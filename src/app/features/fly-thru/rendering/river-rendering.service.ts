import { Injectable } from '@angular/core';
import { mat4, vec3 } from 'gl-matrix';
import { UniformService } from './uniform.service';
import { Mesh, MeshRenderingService } from './mesh-rendering.service';
import { RIVER_MESH_DATA } from '../models/river';
import { BridgeService } from '../../../shared/services/bridge.service';
import { DesignConditions } from '../../../shared/services/design-conditions.service';
import { TerrainModelService } from '../models/terrain-model.service';

@Injectable({ providedIn: 'root' })
export class RiverRenderingService {
  private readonly offset = vec3.create();
  private surfaceMesh!: Mesh;

  constructor(private readonly bridgeService: BridgeService,
    private readonly meshRenderingService: MeshRenderingService,
      private readonly uniformService: UniformService,) { }

  public prepare(): void {
    this.surfaceMesh = this.meshRenderingService.prepareRiverMesh(RIVER_MESH_DATA);
  }

  public render(viewMatrix: mat4, projectionMatrix: mat4): void {
    let m: mat4;
    m = this.uniformService.pushModelMatrix();
    // Account for origin y being at bridge deck level.
    const y = TerrainModelService.WATER_LEVEL + DesignConditions.GAP_DEPTH - this.bridgeService.designConditions.deckElevation
    mat4.translate(m, m, vec3.set(this.offset, 0, y, 0));
    this.uniformService.updateTransformsUniform(viewMatrix, projectionMatrix);
    this.meshRenderingService.renderRiverMesh(this.surfaceMesh);
    this.uniformService.popModelMatrix();
  }
}
