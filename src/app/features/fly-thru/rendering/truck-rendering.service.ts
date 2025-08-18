import { Injectable } from '@angular/core';
import { mat4, vec3 } from 'gl-matrix';
import { Mesh, MeshRenderingService } from './mesh-rendering.service';
import { DUAL_WHEEL_MESH_DATA } from '../models/dual-wheel';
import { TRUCK_MESH_DATA } from '../models/truck';
import { WHEEL_MESH_DATA } from '../models/wheel';
import { UniformService } from './uniform.service';
import { SimulationStateService } from './simulation-state.service';
import { GlService } from './gl.service';
import { Geometry } from '../../../shared/classes/graphics';
import { TRUCK_CAB_MESH_DATA } from '../models/truck-cab';

@Injectable({ providedIn: 'root' })
export class TruckRenderingService {
  private readonly offset = vec3.create();
  private bodyMesh!: Mesh;
  private wheelMesh!: Mesh;
  private dualWheelMesh!: Mesh;
  private cabInteriorMesh!: Mesh;

  constructor(
    private readonly glService: GlService,
    private readonly meshRenderingService: MeshRenderingService,
    private readonly simulationStateService: SimulationStateService,
    private readonly uniformService: UniformService,
  ) {}

  public prepare(): void {
    this.bodyMesh = this.meshRenderingService.prepareColoredMesh(TRUCK_MESH_DATA);
    this.wheelMesh = this.meshRenderingService.prepareColoredMesh(WHEEL_MESH_DATA);
    this.dualWheelMesh = this.meshRenderingService.prepareColoredMesh(DUAL_WHEEL_MESH_DATA);
    this.cabInteriorMesh = this.meshRenderingService.prepareColoredMesh(TRUCK_CAB_MESH_DATA);
  }

  public render(viewMatrix: mat4, projectionMatrix: mat4, cabOnly: boolean = false): void {
    let m: mat4;

    // Blend for fade in/out effect if needed.
    const gl = this.glService.gl;
    const alpha = this.simulationStateService.loadAlpha;
    // No need to draw anything for small alpha values.
    if (alpha < 0.01) {
      return;
    }
    if (alpha < 1) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      this.uniformService.updateGlobalAlpha(alpha);
    }

    m = this.uniformService.pushModelMatrix();
    const truckPosition = this.simulationStateService.wayPoint;
    const truckRotation = this.simulationStateService.rotation;
    mat4.translate(m, m, vec3.set(this.offset, truckPosition[0], truckPosition[1], 0));
    Geometry.rotateZ(m, m, truckRotation[1], truckRotation[0]);
    if (cabOnly) {
      gl.disable(gl.CULL_FACE);
      this.uniformService.updateTransformsUniform(viewMatrix, projectionMatrix);
      this.meshRenderingService.renderColoredMesh(this.cabInteriorMesh);
      gl.enable(gl.CULL_FACE);
    } else {
      // Tire diameter is 1. A rotation through 2pi radians covers distance pi.
      const wheelRotation = 2 * truckPosition[0];

      const wheelbaseOffset = -4;

      // Right front.
      m = this.uniformService.pushModelMatrix();

      mat4.translate(m, m, vec3.set(this.offset, 0, 0.5, 0.95));
      mat4.rotateZ(m, m, -wheelRotation);
      this.uniformService.updateTransformsUniform(viewMatrix, projectionMatrix);
      this.meshRenderingService.renderColoredMesh(this.wheelMesh);

      this.uniformService.popModelMatrix();

      // Right rear.
      m = this.uniformService.pushModelMatrix();

      mat4.translate(m, m, vec3.set(this.offset, wheelbaseOffset, 0.5, 1.05));
      mat4.rotateZ(m, m, -wheelRotation);
      this.uniformService.updateTransformsUniform(viewMatrix, projectionMatrix);
      this.meshRenderingService.renderColoredMesh(this.dualWheelMesh);

      this.uniformService.popModelMatrix();

      // Left front.
      m = this.uniformService.pushModelMatrix();

      mat4.translate(m, m, vec3.set(this.offset, 0, 0.5, -0.95));
      mat4.rotateX(m, m, Math.PI);
      mat4.rotateZ(m, m, wheelRotation);
      this.uniformService.updateTransformsUniform(viewMatrix, projectionMatrix);
      this.meshRenderingService.renderColoredMesh(this.wheelMesh);

      this.uniformService.popModelMatrix();

      // Left rear.
      m = this.uniformService.pushModelMatrix();

      mat4.translate(m, m, vec3.set(this.offset, wheelbaseOffset, 0.5, -1.05));
      mat4.rotateX(m, m, Math.PI);
      mat4.rotateZ(m, m, wheelRotation);
      this.uniformService.updateTransformsUniform(viewMatrix, projectionMatrix);
      this.meshRenderingService.renderColoredMesh(this.dualWheelMesh);

      this.uniformService.popModelMatrix();

      // Body.
      this.uniformService.updateTransformsUniform(viewMatrix, projectionMatrix);
      this.meshRenderingService.renderColoredMesh(this.bodyMesh);
    }

    this.uniformService.popModelMatrix();

    if (alpha < 1) {
      gl.disable(gl.BLEND);
    }
  }
}
