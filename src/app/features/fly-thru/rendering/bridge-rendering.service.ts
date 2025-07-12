import { Injectable } from '@angular/core';
import { mat4 } from 'gl-matrix';
import { Mesh, MeshRenderingService, Wire } from './mesh-rendering.service';
import { BridgeMeshData, BridgeModelService } from '../models/bridge-model.service';
import { UniformService } from './uniform.service';

@Injectable({ providedIn: 'root' })
export class BridgeRenderingService {
  private bridgeMeshData!: BridgeMeshData;
  private deckBeamMesh!: Mesh;
  private deckSlabMesh!: Mesh;
  private gussetMeshes!: Mesh[];
  private membersMesh!: Mesh;
  private pinMesh!: Mesh;
  private stiffeningWire!: Wire;

  constructor(
    private readonly bridgeModelService: BridgeModelService,
    private readonly meshRenderingService: MeshRenderingService,
    private readonly uniformService: UniformService,
  ) {}

  public prepare(): void {
    this.meshRenderingService.deleteExistingMesh(this.membersMesh);
    const bridgeMeshData = this.bridgeModelService.createForCurrentAnalysis();
    this.bridgeMeshData = bridgeMeshData;
    this.membersMesh = this.meshRenderingService.prepareColoredMesh(bridgeMeshData.memberMeshData);
    this.deckBeamMesh = this.meshRenderingService.prepareColoredMesh(bridgeMeshData.deckBeamMeshData);
    this.deckSlabMesh = this.meshRenderingService.prepareColoredMesh(bridgeMeshData.deckSlabMeshData);
    this.stiffeningWire = this.meshRenderingService.prepareWire(bridgeMeshData.stiffeningWireData);
    this.gussetMeshes = bridgeMeshData.gussetMeshData.map(meshData =>
      this.meshRenderingService.prepareColoredMesh(meshData),
    );
    this.pinMesh = this.meshRenderingService.prepareColoredMesh(bridgeMeshData.pinMeshData);
  }

  public render(viewMatrix: mat4, projectionMatrix: mat4): void {
    // Push the current view to the GPU.
    this.uniformService.updateTransformsUniform(viewMatrix, projectionMatrix);

    // Update the instance transforms for bridge elements.
    this.bridgeModelService.updateForCurrentJointLocations(this.bridgeMeshData);

    // Send updated values to the GPU.
    this.meshRenderingService.updateInstanceModelTransforms(
      this.membersMesh,
      this.bridgeMeshData.memberMeshData.instanceModelTransforms!,
    );
    this.meshRenderingService.updateInstanceModelTransforms(
      this.deckBeamMesh,
      this.bridgeMeshData.deckBeamMeshData.instanceModelTransforms!,
    );
    this.meshRenderingService.updateInstanceModelTransforms(
      this.deckSlabMesh,
      this.bridgeMeshData.deckSlabMeshData.instanceModelTransforms!,
    );
    for (let i = 0; i < this.gussetMeshes.length; ++i) {
      this.meshRenderingService.updateInstanceModelTransforms(
        this.gussetMeshes[i],
        this.bridgeMeshData.gussetMeshData[i].instanceModelTransforms!,
      );
    }
    this.meshRenderingService.updateInstanceModelTransforms(
      this.pinMesh,
      this.bridgeMeshData.pinMeshData.instanceModelTransforms!,
    );

    // Render with meshes most likely to be occluded last to save work.
    this.meshRenderingService.renderColoredMesh(this.deckSlabMesh);
    this.meshRenderingService.renderColoredMesh(this.membersMesh);
    this.meshRenderingService.renderColoredMesh(this.deckBeamMesh);
    this.gussetMeshes.forEach(mesh => this.meshRenderingService.renderColoredMesh(mesh));
    this.meshRenderingService.renderWire(this.stiffeningWire);
    this.meshRenderingService.renderColoredMesh(this.pinMesh);
  }
}
