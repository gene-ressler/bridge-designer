import { Injectable } from '@angular/core';
import { mat4 } from 'gl-matrix';
import { ShaderService } from '../shaders/shader.service';
import { GlService } from './gl.service';
import { Mesh, MeshRenderingService } from './mesh-rendering.service';
import { ProjectionService } from './projection.service';
import { DisplayMatrices, UniformService } from './uniform.service';
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
import { KeyboardService } from '../pane/keyboard.service';
import { ViewportService } from './viewport.service';

/** Rendering functionality for fly-thrus. */
@Injectable({ providedIn: 'root' })
export class RenderingService {
  private readonly matrices: DisplayMatrices = {} as DisplayMatrices;
  private readonly eyeViewMatrix = mat4.create();
  private readonly projectionMatrix = mat4.create();
  private readonly lightViewMatrix = mat4.create();
  private readonly trapezoidalProjectionMatrix = mat4.create();
  private readonly lightProjectionMatrix = mat4.create();
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
    private readonly keyboardService: KeyboardService,
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
    private readonly viewportService: ViewportService,
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
      this.shaderService.prepareShaders();
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
    this.depthBufferService.pepareRenderToDisplay();

    this.prepared = true;
  }

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

    // Assumed defaults.
    const gl = this.glService.gl;
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LEQUAL);
    gl.clearColor(0.3765, 0.4392, 0.502, 1); // Matches median sky map color.

    // Set up uniforms that apply to both depth and display.
    this.uniformService.updateTimeUniform(nowMillis);

    // Fetch view and projection matrices.
    this.viewService.getLookAtMatrix(this.eyeViewMatrix);
    this.viewService.getLightLookAtMatrix(this.lightViewMatrix);
    this.projectionService.getPerspectiveProjection(this.projectionMatrix);
    this.projectionService.getLightProjection(this.lightProjectionMatrix);
    this.projectionService.getTrapezoidalProjection(
      this.trapezoidalProjectionMatrix,
      this.eyeViewMatrix,
      this.lightViewMatrix,
    );

    if (!this.flyThruSettingsService.settings.noShadows) {
      this.renderDepthBuffer(nowMillis);
    }
    this.renderDisplayBuffer(nowMillis);
  }

  private renderDepthBuffer(nowMillis: number): void {
    // Put the context in depth drawing mode.
    const gl = this.glService.setForDepthBuffer;

    // Have renderers target depth buffer rather than display.
    this.depthBufferService.bindAndSetViewport();

    gl.cullFace(gl.FRONT);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    const m = this.matrices;

    // Set up transformation matrices for depth buffer rendering.
    m.view = this.lightViewMatrix;
    m.projection = this.trapezoidalProjectionMatrix;
    // Defensive code. Matrices not used.
    m.lightView = this.lightViewMatrix;
    m.trapezoidalProjection = this.trapezoidalProjectionMatrix;

    // Renderers called here use depth shaders. See ShaderService.PROGRAM_SPECS.
    // Renderers can make no assumption about what's in the transforms uniform.
    this.uniformService.updateTransformsUniform(this.matrices);
    if (!this.flyThruSettingsService.settings.noTerrain) {
      this.utilityLineRenderingService.render(this.matrices);
    }
    if (!this.flyThruSettingsService.settings.noAbutments) {
      this.abutmentRenderingService.render(this.matrices);
      this.pierRenderingService.render(this.matrices);
    }
    if (!this.flyThruSettingsService.settings.noWindTurbine) {
      this.windTurbineRenderingService.render(this.matrices, nowMillis);
    }
    this.bridgeRenderingService.render(this.matrices);
    if (!this.flyThruSettingsService.settings.noTruck) {
      this.truckRenderingService.render(this.matrices, this.viewService.isDriving);
    }

    // Set target back to display.
    this.depthBufferService.unbind();
    this.viewportService.restoreDisplayViewport();
  }

  private renderDisplayBuffer(nowMillis: number): void {
    // Put the context in display drawing mode.
    const gl = this.glService.setForDisplayBuffer;
    
    // Set up view and projection matrices for normal or debugging view.
    const m = this.matrices;
    switch (this.keyboardService.debugState.projectionType) {
      case 'normal':
        m.view = this.eyeViewMatrix;
        m.projection = this.projectionMatrix;
        m.lightView = this.lightViewMatrix;
        m.trapezoidalProjection = this.trapezoidalProjectionMatrix;
        break;
      case 'light':
        m.view = this.lightViewMatrix;
        m.projection = this.lightProjectionMatrix;
        m.lightView = this.lightViewMatrix;
        m.trapezoidalProjection = this.trapezoidalProjectionMatrix;
        break;
      case 'trapezoidal':
        m.view = this.lightViewMatrix;
        m.projection = this.trapezoidalProjectionMatrix;
        m.lightView = this.lightViewMatrix;
        m.trapezoidalProjection = this.trapezoidalProjectionMatrix;
        break;
      case 'depth':
        // Short circuit normal flow.
        this.depthBufferService.renderToDisplay();
        return;
    }

    gl.cullFace(gl.BACK);

    const clearMask = this.flyThruSettingsService.settings.noSky
      ? gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT
      : gl.DEPTH_BUFFER_BIT;
    gl.clear(clearMask);

    // Send transformed light and tell the shaders whether we're rendering shadows.
    const shadowWeight = this.flyThruSettingsService.settings.noShadows ? 1 : 0.1;
    this.uniformService.updateLight(this.matrices.view, this.flyThruSettingsService.brightness, shadowWeight);

    // The renderers can make no assumption about what's in the transforms uniform.
    this.uniformService.updateTransformsUniform(this.matrices);
    if (!this.flyThruSettingsService.settings.noTerrain) {
      this.meshRenderingService.renderTerrainMesh(this.terrainMesh);
      this.meshRenderingService.renderColoredMesh(this.roadwayMesh);
      this.utilityLineRenderingService.render(this.matrices);
      this.riverRenderingService.render(this.matrices);
    }
    if (!this.flyThruSettingsService.settings.noAbutments) {
      this.abutmentRenderingService.render(this.matrices);
      this.pierRenderingService.render(this.matrices);
    }
    if (!this.flyThruSettingsService.settings.noWindTurbine) {
      this.windTurbineRenderingService.render(this.matrices, nowMillis);
    }
    this.bridgeRenderingService.render(this.matrices);
    if (!this.flyThruSettingsService.settings.noSky) {
      this.skyRenderingService.render(this.matrices);
    }
    // Models that use blending (transparency) must be last.
    if (!this.flyThruSettingsService.settings.noTruck) {
      this.truckRenderingService.render(this.matrices, this.viewService.isDriving);
    }
    this.animationControlsOverlayService.render();
  }
}
