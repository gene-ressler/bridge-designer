import { Injectable } from '@angular/core';
import { AbutmentModelService } from '../models/abutment-model.service';
import { Mesh, MeshRenderingService } from './mesh-rendering.service';
import { mat4 } from 'gl-matrix';
import { UniformService } from './uniform.service';
import { Colors } from '../../../shared/classes/graphics';

@Injectable({ providedIn: 'root' })
export class AbutmentRenderingService {
  constructor(
    private readonly abutmentModelService: AbutmentModelService,
    private readonly meshRenderingService: MeshRenderingService,
    private readonly uniformService: UniformService,
  ) {}

  private coloredMesh!: Mesh;
  private texturedMesh!: Mesh;

  public prepare(): void {
    // Delete previously prepared meshes.
    this.meshRenderingService.deleteExistingMesh(this.coloredMesh);
    this.meshRenderingService.deleteExistingMesh(this.texturedMesh);

    // Build new ones.
    const { texturedMeshData, coloredMeshData } = this.abutmentModelService.buildAbutmentForDesignConditions();
    const url = 'img/bricktile.png';
    this.texturedMesh = this.meshRenderingService.prepareTexturedMesh(texturedMeshData, url, Colors.GL_CONCRETE);
    this.coloredMesh = this.meshRenderingService.prepareColoredMesh(coloredMeshData);
  }

  public render(viewMatrix: mat4, projectionMatrix: mat4): void {
    this.uniformService.updateTransformsUniform(viewMatrix, projectionMatrix);
    this.meshRenderingService.renderTexturedMesh(this.texturedMesh);
    this.meshRenderingService.renderColoredMesh(this.coloredMesh);
    // TODO: Render other bank.
  }
}
