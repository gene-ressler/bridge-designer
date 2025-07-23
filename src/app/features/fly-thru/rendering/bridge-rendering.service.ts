import { Injectable } from '@angular/core';
import { mat4 } from 'gl-matrix';
import { Mesh, MeshRenderingService, Wire } from './mesh-rendering.service';
import { BridgeMeshData, BridgeModelService } from '../models/bridge-model.service';
import { UniformService } from './uniform.service';
import { SimulationStateService } from './simulation-state.service';
import { DesignConditions } from '../../../shared/services/design-conditions.service';
import { BitVector } from '../../../shared/core/bitvector';
import { Gusset } from '../models/gussets.service';
import { BuckledMemberMesh, FailedMemberRenderingService } from './failed-member-rendering.service';

type BridgeMesh = {
  membersMesh: Mesh;
  deckBeamsMesh: Mesh;
  deckSlabsMesh: Mesh;
  stiffeningWires: Wire;
  gussetMeshes: Mesh[];
  pinsMesh: Mesh;
  /** Mesh for all bucked members bending in parabola shapes. Added when/if bridge fails. */
  buckledMembersMesh?: BuckledMemberMesh;
  tornMemberMesh?: Mesh;
  gussets: Gusset[];
  trussCenterlineOffset: number;
  membersNotTransectingRoadwayClearance: BitVector;
};

@Injectable({ providedIn: 'root' })
export class BridgeRenderingService {
  private mesh!: BridgeMesh;
  private readonly tmpJointLocations = new Float32Array(2 * DesignConditions.MAX_JOINT_COUNT);

  constructor(
    private readonly bridgeModelService: BridgeModelService,
    private readonly failedMemberRenderingService: FailedMemberRenderingService,
    private readonly meshRenderingService: MeshRenderingService,
    private readonly simulationStateService: SimulationStateService,
    private readonly uniformService: UniformService,
  ) {}

  public prepare(): void {
    this.deleteExistingMesh(this.mesh);
    const jointLocations = this.getJointLocations();
    const meshData = this.bridgeModelService.createForCurrentBridge(jointLocations);
    this.mesh = this.prepareMesh(meshData);
  }

  public render(viewMatrix: mat4, projectionMatrix: mat4): void {
    // Push the current view to the GPU.
    this.uniformService.updateTransformsUniform(viewMatrix, projectionMatrix);

    // Update the instance transforms for bridge elements.
    this.updateMeshForCurrentLoading(this.mesh);

    // Send updated values to the GPU.
    const mesh = this.mesh;
    this.meshRenderingService.updateInstanceModelTransforms(mesh.membersMesh);
    this.meshRenderingService.updateInstanceColors(mesh.membersMesh);
    this.meshRenderingService.updateInstanceModelTransforms(mesh.stiffeningWires);
    this.meshRenderingService.updateInstanceModelTransforms(mesh.deckBeamsMesh);
    this.meshRenderingService.updateInstanceModelTransforms(mesh.deckSlabsMesh);
    for (const gussetMesh of mesh.gussetMeshes) {
      this.meshRenderingService.updateInstanceModelTransforms(gussetMesh);
    }
    this.meshRenderingService.updateInstanceModelTransforms(mesh.pinsMesh);
    if (mesh.buckledMembersMesh) {
      this.meshRenderingService.updateInstanceModelTransforms(mesh.buckledMembersMesh.mesh);
    }
    if (mesh.tornMemberMesh) {
      this.meshRenderingService.updateInstanceModelTransforms(mesh.tornMemberMesh);
    }
    this.renderMesh(mesh);
  }

  private prepareMesh(meshData: BridgeMeshData): BridgeMesh {
    // Everything must be updateable because the bridge moves.
    const membersMesh = this.meshRenderingService.prepareColoredMesh(meshData.memberMeshData, true);
    const deckBeamsMesh = this.meshRenderingService.prepareColoredMesh(meshData.deckBeamMeshData, true);
    const deckSlabsMesh = this.meshRenderingService.prepareColoredMesh(meshData.deckSlabMeshData, true);
    const stiffeningWires = this.meshRenderingService.prepareWire(meshData.stiffeningWireData, true);
    const gussetMeshes = meshData.gussetMeshData.map(meshData =>
      this.meshRenderingService.prepareColoredMesh(meshData, true),
    );
    const pinsMesh = this.meshRenderingService.prepareColoredMesh(meshData.pinMeshData, true);
    return {
      deckBeamsMesh,
      deckSlabsMesh,
      gussetMeshes,
      membersMesh,
      pinsMesh,
      stiffeningWires,
      gussets: meshData.gussets,
      trussCenterlineOffset: meshData.trussCenterlineOffset,
      membersNotTransectingRoadwayClearance: meshData.membersNotTransectingRoadwayClearance,
    };
  }

  /** Updates the model transforms in the given bridge mesh for current joint positions. */
  private updateMeshForCurrentLoading(mesh: BridgeMesh): void {
    const jointLocations = this.getJointLocations();
    const failedMemberCount = this.simulationStateService.interpolator.failedMemberCount;
    if (failedMemberCount > 0) {
      if (mesh.buckledMembersMesh) {
        // TODO: Handle torn member updates.
        this.failedMemberRenderingService.update(mesh.buckledMembersMesh, jointLocations);
      } else {
        const [buckled, torn] = this.failedMemberRenderingService.prepare(jointLocations);
        mesh.buckledMembersMesh = buckled;
        mesh.tornMemberMesh = torn;
      }
    }
    this.bridgeModelService.buildMemberInstanceTransforms(
      mesh.membersMesh.instanceModelTransforms,
      jointLocations,
      mesh.trussCenterlineOffset,
    );
    this.bridgeModelService.buildMemberInstanceColors(mesh.membersMesh.instanceColors);
    // The builders possibly skipped failed members. so add a commensurate limit.
    mesh.membersMesh.instanceLimit = mesh.membersMesh.instanceCount! - 2 * failedMemberCount;
    this.bridgeModelService.buildDeckBeamInstanceTransforms(mesh.deckBeamsMesh.instanceModelTransforms, jointLocations);
    this.bridgeModelService.buildDeckSlabInstanceTransforms(mesh.deckSlabsMesh.instanceModelTransforms, jointLocations);
    this.bridgeModelService.buildWireInstanceTransforms(
      mesh.stiffeningWires.instanceModelTransforms,
      jointLocations,
      mesh.trussCenterlineOffset,
      mesh.membersNotTransectingRoadwayClearance,
    );
    this.bridgeModelService.buildPinInstanceModelTransforms(
      mesh.pinsMesh.instanceModelTransforms,
      jointLocations,
      mesh.gussets,
    );
    for (let i = 0; i < mesh.gussetMeshes.length; ++i) {
      this.bridgeModelService.buildGussetInstanceModelTransforms(
        mesh.gussetMeshes[i].instanceModelTransforms,
        mesh.gussets[i],
        jointLocations,
      );
    }
  }

  private getJointLocations(): Float32Array {
    return this.simulationStateService.interpolator.getAllDisplacedJointLocations(this.tmpJointLocations);
  }

  private renderMesh(mesh: BridgeMesh): void {
    // Render with meshes most likely to be occluded last to save work.
    this.meshRenderingService.renderColoredMesh(mesh.deckSlabsMesh);
    this.meshRenderingService.renderColoredMesh(mesh.membersMesh);
    this.meshRenderingService.renderColoredMesh(mesh.deckBeamsMesh);
    mesh.gussetMeshes.forEach(mesh => this.meshRenderingService.renderColoredMesh(mesh));
    this.meshRenderingService.renderWire(mesh.stiffeningWires);
    this.meshRenderingService.renderColoredMesh(mesh.pinsMesh);
    if (mesh.buckledMembersMesh) {
      this.failedMemberRenderingService.render(mesh.buckledMembersMesh);
    }
    if (mesh.tornMemberMesh) {
      this.meshRenderingService.renderColoredMesh(mesh.tornMemberMesh);
    }
  }

  private deleteExistingMesh(mesh: BridgeMesh | undefined): void {
    if (!mesh) {
      return;
    }
    this.meshRenderingService.deleteExistingMesh(mesh.deckBeamsMesh);
    this.meshRenderingService.deleteExistingMesh(mesh.deckSlabsMesh);
    mesh.gussetMeshes.forEach(mesh => this.meshRenderingService.deleteExistingMesh(mesh));
    this.meshRenderingService.deleteExistingMesh(mesh.membersMesh);
    this.meshRenderingService.deleteExistingMesh(mesh.pinsMesh);
    this.meshRenderingService.deleteExistingWire(mesh.stiffeningWires);
    this.failedMemberRenderingService.deleteExistingBuckledMemberMesh(mesh.buckledMembersMesh);
    this.meshRenderingService.deleteExistingMesh(mesh.tornMemberMesh);
  }
}
