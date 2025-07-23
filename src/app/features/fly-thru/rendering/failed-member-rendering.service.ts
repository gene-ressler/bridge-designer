import { Injectable } from '@angular/core';
import { Member } from '../../../shared/classes/member.model';
import { Mesh, MeshRenderingService } from './mesh-rendering.service';
import { BuckledMemberMeshData, FailedMemberModelService } from '../models/failed-member-model.service';
import { SimulationStateService } from './simulation-state.service';
import { BridgeService } from '../../../shared/services/bridge.service';
import { FailedMemberKind } from './interpolation.service';

export type BuckledMemberMesh = {
  mesh: Mesh;
  members: Member[];
  trussCenterlineOffset: number;
};

/** Container of logic for rendering failed members in the current bridge. */
@Injectable({ providedIn: 'root' })
export class FailedMemberRenderingService {
  constructor(
    private readonly bridgeService: BridgeService,
    private readonly failedMemberModelService: FailedMemberModelService,
    private readonly meshRenderingService: MeshRenderingService,
    private readonly simulationStateService: SimulationStateService,
  ) {}

  /** Prepares meshes for failed members, returning one for buckled and another for torn ones, if any. */
  public prepare(jointLocations: Float32Array): [BuckledMemberMesh | undefined, Mesh | undefined] {
    const trussCenterlineOffset = this.bridgeService.trussCenterlineOffset;
    const failedMemberKinds = this.simulationStateService.interpolator.failedMemberKinds;
    return [this.maybeGetBuckledMemberMesh(failedMemberKinds, jointLocations, trussCenterlineOffset), undefined];
  }

  private maybeGetBuckledMemberMesh(
    failedMemberKinds: Uint8Array,
    jointLocations: Float32Array,
    trussCenterlineOffset: number,
  ): BuckledMemberMesh | undefined {
    const buckledMembers = this.bridgeService.bridge.members.filter(
      member => failedMemberKinds[member.index] === FailedMemberKind.COMPRESSION,
    );
    if (buckledMembers.length === 0) {
      return undefined;
    }
    const buckledMemberMeshData = this.failedMemberModelService.buildMeshDataForBuckledMembers(
      buckledMembers,
      jointLocations,
      trussCenterlineOffset,
    );
    return this.prepareMesh(buckledMemberMeshData);
  }

  /** Update the failed member meshes for new joint locations. */
  public update(buckledMemberMesh: BuckledMemberMesh, jointLocations: Float32Array): void {
    const transforms = buckledMemberMesh.mesh.instanceModelTransforms!;
    const trussCenterlineOffset = buckledMemberMesh.trussCenterlineOffset;
    let offset = 0;
    for (const member of buckledMemberMesh.members) {
      this.failedMemberModelService.buildSegmentTransformsForMember(
        transforms,
        member,
        jointLocations,
        trussCenterlineOffset,
        offset,
      );
      offset += FailedMemberModelService.SEGMENT_TRANSFORM_FLOAT_COUNT;
    }
  }

  /** Render the failed member meshes. */
  public render(buckledMemberMesh: BuckledMemberMesh): void {
    this.meshRenderingService.renderBuckledMemberMesh(buckledMemberMesh.mesh);
  }

  public deleteExistingBuckledMemberMesh(mesh: BuckledMemberMesh | undefined): void {
    this.meshRenderingService.deleteExistingMesh(mesh?.mesh);
  }

  private prepareMesh(buckledMemberMeshData: BuckledMemberMeshData): BuckledMemberMesh {
    const meshData = buckledMemberMeshData.meshData;
    return {
      mesh: this.meshRenderingService.prepareBuckledMemberMesh(meshData),
      members: buckledMemberMeshData.members,
      trussCenterlineOffset: buckledMemberMeshData.trussCenterlineOffset,
    };
  }
}
