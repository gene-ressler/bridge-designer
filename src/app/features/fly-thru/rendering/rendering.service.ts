import { Injectable } from '@angular/core';
import { mat4, vec3 } from 'gl-matrix';
import { ImageService } from '../../../shared/core/image.service';
import { ShaderService } from '../shaders/shader.service';
import { GlService } from './gl.service';
import { Mesh, MeshRenderingService } from './mesh-rendering.service';
import { OVERLAY_ICONS } from './overlay-icons';
import { OverlayContext, OverlayRenderingService } from './overlay-rendering.service';
import { OverlayUiService } from './overlay-ui.service';
import { ProjectionService } from './projection.service';
import { UniformService } from './uniform.service';
import { ViewService } from './view.service';
import { ViewportService } from './viewport.service';
import { TRUCK_MESH_DATA } from '../models/truck';
import { TOWER_MESH_DATA } from '../models/tower';
import { WHEEL_MESH_DATA } from '../models/wheel';
import { DUAL_WHEEL_MESH_DATA } from '../models/dual-wheel';

/** Rendering functionality for fly-thrus. */
@Injectable({ providedIn: 'root' })
export class RenderingService {
  private readonly viewMatrix = mat4.create();
  private readonly projectionMatrix = mat4.create();
  private readonly offset = vec3.create();
  private prepared: boolean = false;
  private truckMesh!: Mesh;
  private towerMesh!: Mesh;
  private wheelMesh!: Mesh;
  private dualWheelMesh!: Mesh;
  private controlsOverlay!: OverlayContext;

  constructor(
    private readonly glService: GlService,
    private readonly imageService: ImageService,
    private readonly meshService: MeshRenderingService,
    private readonly overlayService: OverlayRenderingService,
    private readonly overlayUiService: OverlayUiService,
    private readonly projectionService: ProjectionService,
    private readonly shaderService: ShaderService,
    private readonly uniformService: UniformService,
    private readonly viewService: ViewService,
    private readonly viewportService: ViewportService,
  ) {}

  /** Sets the rendered view to default. Includes movement limits for the eye. */
  public setDefaultView(): void {
    this.viewService.setFixedViewLimits();
    this.viewService.resetView();
  }

  /** Prepares for rendering frames before every animation start. */
  public prepareToRender(): void {
    this.setDefaultView();

    // One-time setups follow.
    if (this.prepared) {
      return;
    }

    // Set up shaders.
    this.shaderService.prepareShaders(this.glService.gl);
    this.uniformService.prepareUniforms();

    // Set up meshes.
    this.truckMesh = this.meshService.prepareColoredFacetMesh(TRUCK_MESH_DATA);
    this.towerMesh = this.meshService.prepareColoredFacetMesh(TOWER_MESH_DATA);
    this.wheelMesh = this.meshService.prepareColoredFacetMesh(WHEEL_MESH_DATA);
    this.dualWheelMesh = this.meshService.prepareColoredFacetMesh(DUAL_WHEEL_MESH_DATA);

    // Set up overlay icons with click/drag.
    const iconsLoader = this.imageService.createImagesLoader(OVERLAY_ICONS);
    this.controlsOverlay = this.overlayService.prepareIconOverlay(iconsLoader, overlaysByUrl => {
      const iconSize = 64;
      let y = 0.5 * (this.viewportService.height - OVERLAY_ICONS.length * iconSize);
      for (const url of OVERLAY_ICONS) {
        const overlay = overlaysByUrl[url];
        overlay.x0 = 100;
        overlay.y0 = y;
        y += iconSize;
        Object.assign(overlay, this.viewService.getOverlayUiHandler(url));
      }
      this.overlayUiService.registerOverlays(this.controlsOverlay.overlaysByUrl);
    });

    this.prepared = true;
  }

  public renderFrame(_clockMillis: number, elapsedMillis: number): void {
    if (!this.glService.isWebGL2Supported) {
      return;
    }
    // TODO: Maybe call this getter once in setViewport;
    this.projectionService.getPerspectiveProjection(this.projectionMatrix);
    this.viewService.updateView(elapsedMillis * 0.001);
    this.viewService.getLookAtMatrix(this.viewMatrix);

    const gl = this.glService.gl;

    // TODO: Remove after sky box is implemented.
    gl.clearColor(0.5294, 0.8078, 0.9216, 1); // sky blue
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    this.uniformService.initializeTransformStack(this.viewMatrix, this.projectionMatrix);

    this.meshService.renderFacetMesh(this.truckMesh);
    this.uniformService.pushModelTransform((dst, src) => {
      mat4.translate(dst, src, vec3.set(this.offset, 4, 0, 0));
    });
    this.meshService.renderFacetMesh(this.towerMesh);
    this.uniformService.pushModelTransform((dst, src) => {
      mat4.translate(dst, src, vec3.set(this.offset, 4, 0, 0));
    });
    this.meshService.renderFacetMesh(this.wheelMesh);
    this.uniformService.popPopTransform();
    this.uniformService.popPopTransform();

    this.uniformService.pushModelTransform((dst, src) => {
      mat4.translate(dst, src, vec3.set(this.offset, 0, 0, 4));
    });
    this.meshService.renderFacetMesh(this.dualWheelMesh);
    this.uniformService.popPopTransform();
    this.overlayService.drawIconOverlays(this.controlsOverlay);
  }
}
