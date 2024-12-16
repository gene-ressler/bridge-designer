import { EventEmitter, Injectable } from '@angular/core';
import { Joint } from '../../../shared/classes/joint.model';
import { JointCursorService } from '../services/joint-cursor.service';

@Injectable({ providedIn: 'root' })
export class JointsModeService {
  private _ctx: CanvasRenderingContext2D | undefined;
  private addJointRequest: EventEmitter<Joint> | undefined;

  constructor(private readonly jointCursorService: JointCursorService) {}

  private get ctx(): CanvasRenderingContext2D {
    if (!this._ctx) {
      throw new Error('Joint mode service not initialized');
    }
    return this._ctx;
  }

  public initialize(ctx: CanvasRenderingContext2D, addJointRequest: EventEmitter<Joint>): JointsModeService {
    this._ctx = ctx;
    this.addJointRequest = addJointRequest;
    return this;
  }

  handleMouseEnter(event: MouseEvent): void {
    this.jointCursorService.start(event.offsetX, event.offsetY).show(this.ctx);
  }

  handleMouseLeave(_event: MouseEvent): void {
    this.jointCursorService.clear(this.ctx);
  }

  handleMouseMove(event: MouseEvent): void {
    this.jointCursorService.move(this.ctx, event.offsetX, event.offsetY);
  }

  handleMouseDown(event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }
    // Adding the joint sets the index correctly.
    const locationWorld = this.jointCursorService.locationWorld;
    this.addJointRequest?.emit(new Joint(-1, locationWorld.x, locationWorld.y, false));
  }
}
