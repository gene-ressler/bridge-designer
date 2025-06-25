import { Injectable } from '@angular/core';
import { TOWER_MESH_DATA } from '../models/tower';
import { Mesh, MeshRenderingService } from './mesh-rendering.service';
import { mat4 } from 'gl-matrix';
import { UniformService } from './uniform.service';
import { UtilityLineModelService } from '../models/utility-line-model.service';
import { Wire, WireRenderingService } from './wire-rendering.service';

@Injectable({ providedIn: 'root' })
export class UtilityLineRenderingService {
  private towerMesh!: Mesh;
  private lineWireInstances!: Wire;

  constructor(
    private readonly meshRenderingService: MeshRenderingService,
    private readonly uniformService: UniformService,
    private readonly utilityLineModelService: UtilityLineModelService,
    private readonly wireRenderingService: WireRenderingService,
  ) {}

  public prepare(): void {
    // TODO: This is some overkill. We need only update the tower and wire transforms.
    this.meshRenderingService.deleteExistingMesh(this.towerMesh);
    this.wireRenderingService.deleteExistingWire(this.lineWireInstances);
    const [instanceModelTransforms, wireData] = this.utilityLineModelService.buildModel();
    const meshData = { instanceModelTransforms, ...TOWER_MESH_DATA };
    this.towerMesh = this.meshRenderingService.prepareColoredMesh(meshData);
    this.lineWireInstances = this.wireRenderingService.prepareWire(wireData);
  }

  public render(viewMatrix: mat4, projectionMatrix: mat4) {
    this.uniformService.updateTransformsUniform(viewMatrix, projectionMatrix);
    this.meshRenderingService.renderColoredMesh(this.towerMesh);
    this.wireRenderingService.renderWire(this.lineWireInstances);
  }
}
