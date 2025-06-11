import { Injectable } from '@angular/core';
import { TOWER_MESH_DATA } from '../models/tower';
import { Mesh, MeshRenderingService } from './mesh-rendering.service';
import { mat4, vec3 } from 'gl-matrix';
import { UniformService } from './uniform.service';

@Injectable({ providedIn: 'root' })
export class UtilityLineRenderingService {
  private readonly offset = vec3.create();
  private towerMesh!: Mesh;

  constructor(
    private readonly meshRenderingService: MeshRenderingService,
    private readonly uniformService: UniformService,
  ) {}

  public prepare(): void {
    this.towerMesh = this.meshRenderingService.prepareColoredFacetMesh(TOWER_MESH_DATA);
  }

  public render(viewMatrix: mat4, projectionMatrix: mat4) {
    // TODO: Render rest of utility line.
    let m: mat4;
    m = this.uniformService.pushModelMatrix();
    mat4.translate(m, m, vec3.set(this.offset, 4, 0, 0));
    this.uniformService.updateTransformsUniform(viewMatrix, projectionMatrix);
    this.meshRenderingService.renderFacetMesh(this.towerMesh);
    this.uniformService.popModelMatrix();
  }
}
