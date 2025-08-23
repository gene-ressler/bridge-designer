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
import { FlyThruSettingsService } from './fly-thru-settings.service';
import { DepthBufferService } from './depth-buffer.service';

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
    private readonly depthBufferService: DepthBufferService,
    private readonly flyThruSettingsService: FlyThruSettingsService,
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
    // Put the user in the home position.
    this.setDefaultView();
    // Reset the state machine. Required before bridge renderer can be prepared.
    this.simulationStateService.start();
    // TODO: Some of these can be done only on design conditions changes to save some GC.
    // Build terrain that matches the work site configuration.
    this.terrainModelService.initializeForBridge();
    // Clear old meshes if any. Then build new ones.
    this.meshRenderingService.deleteExistingMesh(this.terrainMesh);
    this.meshRenderingService.deleteExistingMesh(this.roadwayMesh);
    this.terrainMesh = this.meshRenderingService.prepareTerrainMesh(this.terrainModelService.terrainMeshData);
    this.roadwayMesh = this.meshRenderingService.prepareColoredMesh(this.terrainModelService.roadwayMeshData);
    this.abutmentRenderingService.prepare();
    this.bridgeRenderingService.prepare();
    this.pierRenderingService.prepare();
    this.utilityLineRenderingService.prepare();
    this.windTurbineRenderingService.prepare();

    // Other one-time setups follow.
    if (this.prepared) {
      return;
    }

    // Set up objects that remain between animations.
    this.riverRenderingService.prepare();
    this.skyRenderingService.prepare();
    this.truckRenderingService.prepare();
    this.animationControlsOverlayService.prepare();
    this.depthBufferService.prepare();
    this.prepared = true;
  }

  projection: string =  'normal'; //'light';

  /**
   * Renders a single frame.
   *
   * @param nowMillis Current time in milliseconds.
   * @param elapsedNowMillis Elapsed time since last frame in milliseconds.
   * @param clockMillis Simulation clock time in milliseconds. Can be paused by view controls.
   */
  public renderFrame(nowMillis: number, elapsedNowMillis: number, clockMillis: number): void {
    if (!this.glService.isWebGL2Supported) {
      return;
    }
    // Advance clock-based state.
    this.simulationStateService.advance(clockMillis);

    this.viewService.updateWalkingView(elapsedNowMillis * 0.001);

    if (this.projection === 'normal') {
      // TODO: Maybe call this getter once every time viewport is set.
      this.projectionService.getPerspectiveProjection(this.projectionMatrix);
      this.viewService.getLookAtMatrix(this.viewMatrix);
    } else {
      this.projectionService.getLightProjection(this.projectionMatrix);
      this.viewService.getLightLookAtMatrix(this.viewMatrix);
    }

    const gl = this.glService.gl;

    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LEQUAL);
    gl.clearColor(0, 0.4, 0.8, 1);
    const clearMask = this.flyThruSettingsService.settings.noSky
      ? gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT
      : gl.DEPTH_BUFFER_BIT;
    gl.clear(clearMask);

    this.uniformService.updateTimeUniform(nowMillis);
    this.uniformService.updateLight(this.viewMatrix, this.flyThruSettingsService.brightness);

    // Render. The renderers can make no assumption about what's in the transforms uniform.
    this.uniformService.updateTransformsUniform(this.viewMatrix, this.projectionMatrix);
    if (!this.flyThruSettingsService.settings.noTerrain) {
      this.meshRenderingService.renderTerrainMesh(this.terrainMesh);
      this.meshRenderingService.renderColoredMesh(this.roadwayMesh);
      this.utilityLineRenderingService.render(this.viewMatrix, this.projectionMatrix);
      this.riverRenderingService.render(this.viewMatrix, this.projectionMatrix);
    }
    if (!this.flyThruSettingsService.settings.noAbutments) {
      this.abutmentRenderingService.render(this.viewMatrix, this.projectionMatrix);
      this.pierRenderingService.render(this.viewMatrix, this.projectionMatrix);
    }
    if (!this.flyThruSettingsService.settings.noWindTurbine) {
      this.windTurbineRenderingService.render(this.viewMatrix, this.projectionMatrix, nowMillis);
    }
    this.bridgeRenderingService.render(this.viewMatrix, this.projectionMatrix);
    if (!this.flyThruSettingsService.settings.noSky) {
      this.skyRenderingService.render(this.viewMatrix, this.projectionMatrix);
    }
    // Models that use blending (transparency) must be last.
    if (!this.flyThruSettingsService.settings.noTruck) {
      this.truckRenderingService.render(this.viewMatrix, this.projectionMatrix, this.viewService.isDriving);
    }
    this.animationControlsOverlayService.render();
  }
}
