import { EventEmitter, Injectable } from '@angular/core';
import { Joint } from '../../../shared/classes/joint.model';
import { Member } from '../../../shared/classes/member.model';
import { HotElementService } from '../services/hot-element.service';

@Injectable({ providedIn: 'root' })
export class EraseModeService {
  private ctx: CanvasRenderingContext2D | undefined;
  private deleteRequest: EventEmitter<Joint | Member> | undefined;

  constructor(private readonly hotElementService: HotElementService) {}

  public initialize(ctx: CanvasRenderingContext2D, deleteRequest: EventEmitter<Joint | Member>): EraseModeService {
    this.ctx = ctx;
    this.deleteRequest = deleteRequest;
    return this;
  }

  handleMouseDown(_event: MouseEvent): void {
    const hotElement = this.hotElementService.hotElement;
    if (this.ctx) {
      this.hotElementService.clearRenderedHotElement(this.ctx);
    }
    if (hotElement) {
      this.deleteRequest?.emit(hotElement);
    }
  }

  handleMouseMove(event: MouseEvent): void {
    if (!this.ctx) {
      return;
    }
    this.hotElementService.updateRenderedHotElement(this.ctx, event.offsetX, event.offsetY, {
      excludeFixedJoints: true,
    });
  }
}
