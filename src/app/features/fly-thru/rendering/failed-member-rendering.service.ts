import { Injectable } from '@angular/core';
import { Member } from '../../../shared/classes/member.model';
import { Mesh, MeshRenderingService } from './mesh-rendering.service';
import { FailedMemberModelService } from '../models/failed-member-model.service';
import { SimulationStateService } from './simulation-state.service';
import { BridgeService } from '../../../shared/services/bridge.service';
import { FailedMemberKind } from './interpolation.service';

/** Wrapper for buckled member along with data sufficient to update it per frame. */
export type BuckledMemberMesh = {
  mesh: Mesh;
  members: Member[];
  jointLocations: Float32Array;
  trussCenterlineOffset: number;
};

/** Wrapper for torn member along with data sufficient to update it per frame. */
export type TornMemberMesh = {
  mesh: Mesh;
  members: Member[];
  jointLocations: Float32Array;
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
  public prepare(jointLocations: Float32Array): [BuckledMemberMesh | undefined, TornMemberMesh | undefined] {
    const trussCenterlineOffset = this.bridgeService.trussCenterlineOffset;
    const failedMemberKinds = this.simulationStateService.interpolator.failedMemberKinds;
    return [
      this.maybeGetBuckledMembersMesh(failedMemberKinds, jointLocations, trussCenterlineOffset),
      this.maybeGetTornMembersMesh(failedMemberKinds, jointLocations, trussCenterlineOffset),
    ];
  }

  /** Build a mesh for rendering buckled members, if there are any. */
  private maybeGetBuckledMembersMesh(
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
    const meshData = buckledMemberMeshData.meshData;
    return {
      jointLocations,
      mesh: this.meshRenderingService.prepareBuckledMemberMesh(meshData),
      members: buckledMemberMeshData.members,
      trussCenterlineOffset: buckledMemberMeshData.trussCenterlineOffset,
    };
  }

  /** Builds a mesh for rendering torn members, if there are any. */
  private maybeGetTornMembersMesh(
    failedMemberKinds: Uint8Array,
    jointLocations: Float32Array,
    trussCenterlineOffset: number,
  ): TornMemberMesh | undefined {
    const tornMembers = this.bridgeService.bridge.members.filter(
      member => failedMemberKinds[member.index] === FailedMemberKind.TENSION,
    );
    if (tornMembers.length === 0) {
      return undefined;
    }
    const tornMemberMeshData = this.failedMemberModelService.buildMeshDataForTornMembers(
      tornMembers,
      jointLocations,
      trussCenterlineOffset,
    );
    return {
      jointLocations,
      mesh: this.meshRenderingService.prepareColoredMesh(tornMemberMeshData.meshData, true),
      members: tornMemberMeshData.members,
      trussCenterlineOffset: tornMemberMeshData.trussCenterlineOffset,
    };
  }

  /** Updates the buckled member mesh for new joint locations. */
  public updateBuckledMembers(buckledMemberMesh: BuckledMemberMesh): void {
    const jointLocations = buckledMemberMesh.jointLocations;
    const transforms = buckledMemberMesh.mesh.instanceModelTransforms!;
    const trussCenterlineOffset = buckledMemberMesh.trussCenterlineOffset;
    let offset = 0;
    for (const member of buckledMemberMesh.members) {
      this.failedMemberModelService.buildSegmentTransformsForBuckledMember(
        transforms,
        member,
        jointLocations,
        trussCenterlineOffset,
        offset,
      );
      offset += FailedMemberModelService.SEGMENT_TRANSFORM_FLOAT_COUNT;
    }
  }

  /** Updates the torn member mesh for new joint locations. */
  public updateTornMembers(tornMemberMesh: TornMemberMesh): void {
    const jointLocations = tornMemberMesh.jointLocations;
    const transforms = tornMemberMesh.mesh.instanceModelTransforms!;
    const trussCenterlineOffset = tornMemberMesh.trussCenterlineOffset;
    let offset = 0;
    for (const member of tornMemberMesh.members) {
      this.failedMemberModelService.buildModelInstanceTransformsForTornMember(
        transforms,
        member,
        jointLocations,
        trussCenterlineOffset,
        offset,
      );
      offset += 64;
    }
  }
}
