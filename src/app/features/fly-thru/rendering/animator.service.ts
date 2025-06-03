import { Injectable } from '@angular/core';
import { RenderingService } from './rendering.service';

export type FrameRenderer = (clockMillis: number, elapsedMillis: number) => void;

export const enum AnimationState {
  STOPPED,
  RUNNING,
  PAUSED,
}

/**
 * Container for general purpose logic that starts, runs, and pauses/unpauses an animation.
 *                              ,-------.
 *                              v       |
 * A state machine: STOPPED -> RUN--->PAUSE. Attempts to make other transitions are ignored.
 *                     ^        |       |
 *                     '--------'<------'
 */
@Injectable({ providedIn: 'root' })
export class AnimatorService {
  private clockBaseMillis: number | undefined;
  private lastClockMillis: number | undefined;
  private _state: AnimationState = AnimationState.STOPPED;
  private frameTickMillis: number | undefined;
  private frameCount: number = 0;

  constructor(private readonly renderService: RenderingService) {}

  /** Returns the current state of animation. */
  public get state(): AnimationState {
    return this._state;
  }

  /** Starts calls to the registered renderer at the frame rate with clock at zero. */
  public start(): void {
    if (this._state !== AnimationState.STOPPED) {
      return;
    }
    this.resetClock();
    this._state = AnimationState.RUNNING;
    this.lastClockMillis = this.clockBaseMillis;
    const render = (nowMillis: number): void => {
      ++this.frameCount;
      if (!this.frameTickMillis) {
        this.frameTickMillis = nowMillis;
      } else {
        if (nowMillis - this.frameTickMillis > 1000) {
          console.log('fps: %d', this.frameCount);
          this.frameTickMillis = nowMillis;
          this.frameCount = 0;
        }
      }
      if (this._state === AnimationState.STOPPED) {
        return; // Skips scheduling next loop iteration.
      }
      // Handle first frame.
      if (this.lastClockMillis === undefined) {
        this.lastClockMillis = nowMillis;
      }
      // Reset after unpause.
      if (this.clockBaseMillis === undefined) {
        this.clockBaseMillis = nowMillis - this.lastClockMillis;
      }
      const clockMillis =
        this._state === AnimationState.PAUSED ? this.lastClockMillis : nowMillis - this.clockBaseMillis;
      this.renderService.renderFrame(clockMillis, clockMillis - this.lastClockMillis);
      this.lastClockMillis = clockMillis;
      // Schedule next loop iteration.
      requestAnimationFrame(render);
    };
    this.renderService.prepareToRender();
    // Kick off the animation loop.
    // TODO: Look for a better way to draw first frame after the viewport and projection are set.
    setTimeout(() => requestAnimationFrame(render));
  }

  /** When running, pauses the clock while the renderer is still called at the frame rate. */
  public pause(): void {
    if (this._state !== AnimationState.RUNNING) {
      return;
    }
    this._state = AnimationState.PAUSED;
  }

  /** When paused, upauses the rendering clock. Rendering proceeds at the frame rate. */
  public unpause(): void {
    if (this._state !== AnimationState.PAUSED) {
      return;
    }
    this._state = AnimationState.RUNNING;
    // Reset base so clock will advance from the paused value.
    this.clockBaseMillis = undefined;
  }

  /** Stops calls to the registered renderer. */
  public stop(): void {
    this._state = AnimationState.STOPPED;
  }

  /** Reset the simulation clock to zero, regardless of state. */
  public resetClock(): void {
    this.clockBaseMillis = Date.now();
  }
}
