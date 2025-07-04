import { Injectable } from '@angular/core';
import { mat4 } from 'gl-matrix';
import { Mesh, MeshRenderingService, Wire } from './mesh-rendering.service';
import { BridgeModelService } from '../models/bridge-model.service';
import { UniformService } from './uniform.service';
import { GussetsModelService } from '../models/gussets-model.service';

@Injectable({ providedIn: 'root' })
export class BridgeRenderingService {
  private deckBeamMesh!: Mesh;
  private deckSlabMesh!: Mesh;
  private gussetMeshes!: Mesh[];
  private membersMesh!: Mesh;
  private pinMesh!: Mesh;
  private stiffeningWire!: Wire;

  constructor(
    private readonly bridgeGussetsModelService: GussetsModelService,
    private readonly bridgeModelService: BridgeModelService,
    private readonly meshRenderingService: MeshRenderingService,
    private readonly uniformService: UniformService,
  ) {}

  public prepare(): void {
    this.meshRenderingService.deleteExistingMesh(this.membersMesh);
    const bridgeMeshData = this.bridgeModelService.buildForCurrentAnalysis();
    this.membersMesh = this.meshRenderingService.prepareColoredMesh(bridgeMeshData.memberMeshData);
    this.deckBeamMesh = this.meshRenderingService.prepareColoredMesh(bridgeMeshData.deckBeamMeshData);
    this.deckSlabMesh = this.meshRenderingService.prepareColoredMesh(bridgeMeshData.deckSlabMeshData);
    this.stiffeningWire = this.meshRenderingService.prepareWire(bridgeMeshData.stiffeningWireData);
    const {gussetMeshData, pinMeshData } = this.bridgeGussetsModelService.meshData;
    this.gussetMeshes = gussetMeshData.map(meshData => this.meshRenderingService.prepareColoredMesh(meshData));
    this.pinMesh = this.meshRenderingService.prepareColoredMesh(pinMeshData);
  }

  public render(viewMatrix: mat4, projectionMatrix: mat4): void {
    this.uniformService.updateTransformsUniform(viewMatrix, projectionMatrix);
    // Order with meshes most likely to be ocluded last.
    this.meshRenderingService.renderColoredMesh(this.deckSlabMesh);
    this.meshRenderingService.renderColoredMesh(this.membersMesh);
    this.meshRenderingService.renderColoredMesh(this.deckBeamMesh);
    this.gussetMeshes.forEach(mesh => this.meshRenderingService.renderColoredMesh(mesh));
    this.meshRenderingService.renderWire(this.stiffeningWire);
    this.meshRenderingService.renderColoredMesh(this.pinMesh);
  }
}
