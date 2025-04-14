import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

type TopicLocation = { topicId: string; scrollTop: number };

/**
 * Container for the current help topic id plus "go back" and "go forward" state and logic.
 *
 * All help widgets inject this an call goToTopicId in response to user interaction. Broadcast
 * event handlers update the UI. When this causes e.g. "select" events due to programmatic
 * widget updates, the handler causes goToTopicId recursively. It's the on-stop shop for
 * breaking such cycles.
 *
 * This replaces an implementation with Angular events, which ended up fare more complex.
 */
@Injectable({ providedIn: 'root' })
export class CurrentTopicService {
  public static readonly DEFAULT_TOPIC_ID = 'hlp_how_to';

  /** Broadcast notification subject for current topic changes. */
  public readonly currentTopicIdChange = new Subject<TopicLocation>();
  /** Settable callback for fetching current scroll top just before going to a new topic. */
  public scrollTopCallback: () => number = () => 0;

  private _currentTopicId: string = CurrentTopicService.DEFAULT_TOPIC_ID;
  private backTopicStack: TopicLocation[] = [];
  private forwardTopicStack: TopicLocation[] = [];

  /** Returns the current topic. */
  public get currentTopicId(): string {
    return this._currentTopicId;
  }

  /** Returns whether "go back" topics are available */
  public get hasBackTopics(): boolean {
    return this.backTopicStack.length > 0;
  }

  /** Returns whether "go forward" topics are available */
  public get hasForwardTopics(): boolean {
    return this.forwardTopicStack.length > 0;
  }

  /**
   * Goes to a specific topic, stacking the current one and its scrolltop
   * beforehand (optionally). Broadcasts a notification of the change.
   */
  public goToTopicId(id: string, options?: { scrollTop?: number; stack?: TopicLocation[] | null }): void {
    if (id === this._currentTopicId) {
      return; // important for breaking event cycles
    }
    let stack = options?.stack;
    if (stack !== null) {
      // Default is to stack back and clear forward. Else just add to given stack.
      if (stack === undefined) {
        stack = this.backTopicStack;
        this.forwardTopicStack.length = 0;
      }
      stack.push({ topicId: this._currentTopicId, scrollTop: this.scrollTopCallback() });
    }
    this._currentTopicId = id;
    this.currentTopicIdChange.next({ scrollTop: options?.scrollTop || 0, topicId: id });
  }

  /** Goes back one topic if there's one stacked. */
  public goBack(): void {
    const top = this.backTopicStack.pop();
    if (top) {
      this.goToTopicId(top.topicId, { scrollTop: top.scrollTop, stack: this.forwardTopicStack });
    }
  }

  /** Goes forward one topic if there's one stacked. */
  public goForward() {
    const top = this.forwardTopicStack.pop();
    if (top) {
      this.goToTopicId(top.topicId, { scrollTop: top.scrollTop, stack: this.backTopicStack });
    }
  }
}
