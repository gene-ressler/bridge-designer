import { Injectable } from '@angular/core';
import { mat4, vec3 } from 'gl-matrix';
import { Mesh, MeshRenderingService } from './mesh-rendering.service';
import { DUAL_WHEEL_MESH_DATA } from '../models/dual-wheel';
import { TRUCK_MESH_DATA } from '../models/truck';
import { WHEEL_MESH_DATA } from '../models/wheel';
import { UniformService } from './uniform.service';

@Injectable({ providedIn: 'root' })
export class TruckRenderingService {
  public readonly position: vec3 = vec3.create();
  public readonly bodyRotation: number = 0;
  public readonly wheelRotation: number = 0;

  private readonly offset = vec3.create();
  private bodyMesh!: Mesh;
  private wheelMesh!: Mesh;
  private dualWheelMesh!: Mesh;

  constructor(
    private readonly meshService: MeshRenderingService,
    private readonly uniformService: UniformService,
  ) {}

  public prepare(): void {
    this.bodyMesh = this.meshService.prepareColoredFacetMesh(TRUCK_MESH_DATA);
    this.wheelMesh = this.meshService.prepareColoredFacetMesh(WHEEL_MESH_DATA);
    this.dualWheelMesh = this.meshService.prepareColoredFacetMesh(DUAL_WHEEL_MESH_DATA);
  }

  public render(viewMatrix: mat4, projectionMatrix: mat4) {
    const wheelbaseOffset = -4;
    let m: mat4;

    // Right front.
    m = this.uniformService.pushModelMatrix();

    mat4.translate(m, m, vec3.set(this.offset, 0, 0.5, 0.95));
    mat4.rotateZ(m, m, -this.wheelRotation);
    this.uniformService.updateTransformsUniform(viewMatrix, projectionMatrix);
    this.meshService.renderFacetMesh(this.wheelMesh);

    this.uniformService.popModelMatrixStack();

    // Right rear.
    m = this.uniformService.pushModelMatrix();

    mat4.translate(m, m, vec3.set(this.offset, wheelbaseOffset, 0.5, 0.95));
    mat4.rotateZ(m, m, -this.wheelRotation);
    this.uniformService.updateTransformsUniform(viewMatrix, projectionMatrix);
    this.meshService.renderFacetMesh(this.dualWheelMesh);

    this.uniformService.popModelMatrixStack();

    // Left front.
    m = this.uniformService.pushModelMatrix();

    mat4.translate(m, m, vec3.set(this.offset, 0, 0.5, -0.95));
    mat4.rotateX(m, m, Math.PI);
    mat4.rotateZ(m, m, -this.wheelRotation);
    this.uniformService.updateTransformsUniform(viewMatrix, projectionMatrix);
    this.meshService.renderFacetMesh(this.wheelMesh);

    this.uniformService.popModelMatrixStack();

    // Left rear.
    m = this.uniformService.pushModelMatrix();

    mat4.translate(m, m, vec3.set(this.offset, wheelbaseOffset, 0.5, -0.95));
    mat4.rotateX(m, m, Math.PI);
    mat4.rotateZ(m, m, -this.wheelRotation);
    this.uniformService.updateTransformsUniform(viewMatrix, projectionMatrix);
    this.meshService.renderFacetMesh(this.dualWheelMesh);

    this.uniformService.popModelMatrixStack();

    // Body.
    this.uniformService.updateTransformsUniform(viewMatrix, projectionMatrix);
    this.meshService.renderFacetMesh(this.bodyMesh);
  }
}
