import { Injectable } from '@angular/core';
import { Joint } from '../classes/joint.model';
import { ImageService, ImagesLoader } from '../core/image.service';
import { ViewportTransform2D } from './viewport-transform.service';

const JOINT_SHEET: string = 'img/jointsheet.png';

const enum JointSheetIndex {
  FIXED,
  NORMAL,
  SELECTED,
  HOT,
  HOT_SELECTED,
}

@Injectable({ providedIn: 'root' })
export class DesignJointRenderingService {
  public static readonly JOINT_RADIUS_VIEWPORT = 8.5;

  private readonly imagesLoader: ImagesLoader;

  constructor(
    private readonly imageService: ImageService,
    private readonly viewportTransform: ViewportTransform2D
  ) {
    this.imagesLoader = imageService.createImagesLoader([JOINT_SHEET]);
  }

  public render(
    ctx: CanvasRenderingContext2D,
    joint: Joint,
    isSelected: boolean = false
  ): void {
    this.doRender(
      ctx,
      joint,
      joint.isFixed
        ? JointSheetIndex.FIXED
        : isSelected
        ? JointSheetIndex.SELECTED
        : JointSheetIndex.NORMAL
    );
  }

  public renderHot(
    ctx: CanvasRenderingContext2D,
    joint: Joint,
    isSelected: boolean = false
  ): void {
    this.doRender(
      ctx,
      joint,
      isSelected ? JointSheetIndex.HOT_SELECTED : JointSheetIndex.HOT
    );
  }

  public clear(ctx: CanvasRenderingContext2D, joint: Joint) {
    const x = this.viewportTransform.worldToViewportX(joint.x);
    const y = this.viewportTransform.worldToViewportY(joint.y);
    const ofs = DesignJointRenderingService.JOINT_RADIUS_VIEWPORT;
    ctx.clearRect(x - ofs, y - ofs, 2 * ofs, 2 * ofs);
  }

  private doRender(
    ctx: CanvasRenderingContext2D,
    joint: Joint,
    index: number
  ): void {
    this.imagesLoader.invokeAfterLoaded(
      images => {
        const sheet = images[JOINT_SHEET];
        if (!sheet) {
          return;
        }
        const x = this.viewportTransform.worldToViewportX(joint.x);
        const y = this.viewportTransform.worldToViewportY(joint.y);
        const ofs = DesignJointRenderingService.JOINT_RADIUS_VIEWPORT;
        this.imageService.drawSheetImage(
          ctx,
          sheet,
          index,
          5,
          x - ofs,
          y - ofs
        );
      }
    );
  }
}
