import { Injectable } from '@angular/core';
import { GlService } from './gl.service';
import { ProjectionService } from './projection.service';
import { mat3 } from 'gl-matrix';

/** Manager for the WegGL viewport and projections into it: graphical and mouse coords. */
@Injectable({ providedIn: 'root' })
export class ViewportService {
  public readonly mouseProjection = mat3.create();
  public width: number = 0;
  public height: number = 0;

  constructor(
    private readonly glService: GlService,
    private readonly projectionService: ProjectionService,
  ) {}

  /* Sets up state related to viewport using given canvas and wrapper css pixel sizes. */
  public setViewport(_canvasWidth: number, canvasHeight: number, viewportWidth: number, viewportHeight: number) {
    this.width = viewportWidth;
    this.height = viewportHeight;
    // WebGL's mapping of clip coordinates to device.
    this.glService.gl.viewport(0, canvasHeight - this.height, this.width, this.height);
    // Experimentally  determined perspective view of animation world.
    this.projectionService.setFrustum(45, viewportWidth / viewportHeight, 0.333333, 400, 0.5);
    // Mapping from css (mouse) to WebGL clip coordinates.
    mat3.projection(this.mouseProjection, this.width, this.height);
  }
}
