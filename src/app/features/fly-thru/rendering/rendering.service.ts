import { Injectable } from '@angular/core';
import { mat4 } from 'gl-matrix';
import { ShaderService } from '../shaders/shader.service';
import { GlService } from './gl.service';
import { Mesh, MeshRenderingService } from './mesh-rendering.service';
import { ProjectionService } from './projection.service';
import { UniformService } from './uniform.service';
import { ViewService } from './view.service';
import { TruckRenderingService } from './truck-rendering.service';
import { TerrainModelService } from '../models/terrain-model.service';
import { UtilityLineRenderingService } from './utility-line-rendering.service';
import { RiverRenderingService } from './river-rendering.service';
import { SkyRenderingService } from './sky-rendering.service';
import { AbutmentRenderingService } from './abutment-rendering.service';
import { BridgeRenderingService } from './bridge-rendering.service';
import { PierRenderingService } from './pier-rendering.service';
import { WindTurbineRenderingService } from '../../../shared/services/wind-turbine-rendering.service';
import { SimulationStateService } from './simulation-state.service';
import { AnimationControlsOverlayService } from './animation-controls-overlay.service';

/** Rendering functionality for fly-thrus. */
@Injectable({ providedIn: 'root' })
export class RenderingService {
  private readonly viewMatrix = mat4.create();
  private readonly projectionMatrix = mat4.create();
  private prepared: boolean = false;
  private roadwayMesh!: Mesh;
  private terrainMesh!: Mesh;

  constructor(
    private readonly abutmentRenderingService: AbutmentRenderingService,
    private readonly animationControlsOverlayService: AnimationControlsOverlayService,
    private readonly bridgeRenderingService: BridgeRenderingService,
    private readonly glService: GlService,
    private readonly meshRenderingService: MeshRenderingService,
    private readonly pierRenderingService: PierRenderingService,
    private readonly projectionService: ProjectionService,
    private readonly riverRenderingService: RiverRenderingService,
    private readonly shaderService: ShaderService,
    private readonly simulationStateService: SimulationStateService,
    private readonly skyRenderingService: SkyRenderingService,
    private readonly terrainModelService: TerrainModelService,
    private readonly truckRenderingService: TruckRenderingService,
    private readonly uniformService: UniformService,
    private readonly utilityLineRenderingService: UtilityLineRenderingService,
    private readonly viewService: ViewService,
    private readonly windTurbineRenderingService: WindTurbineRenderingService,
  ) {}

  /** Sets the rendered view to default. Includes movement limits for the eye. */
  public setDefaultView(): void {
    this.viewService.setFixedViewLimits();
    this.viewService.resetView();
  }

  /** Prepares for rendering frames before every animation start. */
  public prepareToRender(): void {
    // Setups needed one time and before the per-design conditions setups.
    if (!this.prepared) {
      this.shaderService.prepareShaders(this.glService.gl);
      this.uniformService.prepareUniforms();
    }

    // Per-bridge setups.
    this.setDefaultView();
    // TODO: Some of these can be done only on design conditions changes to save some GC.
    this.terrainModelService.initializeForBridge();
    this.meshRenderingService.deleteExistingMesh(this.terrainMesh);
    this.meshRenderingService.deleteExistingMesh(this.roadwayMesh);
    this.terrainMesh = this.meshRenderingService.prepareTerrainMesh(this.terrainModelService.terrainMeshData);
    this.roadwayMesh = this.meshRenderingService.prepareColoredMesh(this.terrainModelService.roadwayMeshData);
    this.abutmentRenderingService.prepare();
    this.bridgeRenderingService.prepare();
    this.pierRenderingService.prepare();
    this.utilityLineRenderingService.prepare();
    this.windTurbineRenderingService.prepare();
    this.simulationStateService.start();

    // Other on-time setups follow.
    if (this.prepared) {
      return;
    }

    // Set up objects that remain between animations.
    this.riverRenderingService.prepare();
    this.skyRenderingService.prepare();
    this.truckRenderingService.prepare();
    this.animationControlsOverlayService.prepare();
    this.prepared = true;
  }

  public renderFrame(clockMillis: number, elapsedMillis: number): void {
    if (!this.glService.isWebGL2Supported) {
      return;
    }
    // Advance clock-based state.
    this.simulationStateService.advance(clockMillis);

    // TODO: Maybe call this getter once every time viewport is set.
    this.projectionService.getPerspectiveProjection(this.projectionMatrix);
    this.viewService.updateWalkingView(elapsedMillis * 0.001);
    this.viewService.getLookAtMatrix(this.viewMatrix);

    const gl = this.glService.gl;

    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    this.uniformService.updateTimeUniform(clockMillis);
    this.uniformService.updateLightDirection(this.viewMatrix);

    // Render. The renderers can make no assumption about what's in the transforms uniform.
    this.uniformService.updateTransformsUniform(this.viewMatrix, this.projectionMatrix);
    this.meshRenderingService.renderTerrainMesh(this.terrainMesh);
    this.meshRenderingService.renderColoredMesh(this.roadwayMesh);
    this.riverRenderingService.render(this.viewMatrix, this.projectionMatrix);
    this.abutmentRenderingService.render(this.viewMatrix, this.projectionMatrix);
    this.pierRenderingService.render(this.viewMatrix, this.projectionMatrix);
    this.truckRenderingService.render(this.viewMatrix, this.projectionMatrix);
    this.utilityLineRenderingService.render(this.viewMatrix, this.projectionMatrix);
    this.windTurbineRenderingService.render(this.viewMatrix, this.projectionMatrix, clockMillis);
    this.bridgeRenderingService.render(this.viewMatrix, this.projectionMatrix);
    this.skyRenderingService.render(this.viewMatrix, this.projectionMatrix);
    this.animationControlsOverlayService.render();
  }
}
