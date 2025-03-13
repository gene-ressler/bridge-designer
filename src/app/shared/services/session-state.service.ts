import { Injectable } from '@angular/core';
import { EventBrokerService, EventOrigin } from './event-broker.service';

@Injectable({ providedIn: 'root' })
export class SessionStateService {
  private static readonly LOCAL_STORAGE_KEY = 'bridgedesigner.v1.000';
  constructor(private readonly eventBrokerService: EventBrokerService) {}
  private stateAccumulator: { [key: string]: Object } | undefined;

  /** Broadcasts a request for all subscribers to record state for saving, then saves the recorded results. */
  public saveState(): void {
    this.stateAccumulator = {};
    this.eventBrokerService.sessionStateSaveRequest.next({ origin: EventOrigin.SERVICE, data: undefined });
    localStorage.setItem(SessionStateService.LOCAL_STORAGE_KEY, JSON.stringify(this.stateAccumulator));
    this.stateAccumulator = undefined;
  }

  /** Returns whether saved state exists. */
  public get isRehydrating(): boolean {
    this.loadAccumulator();
    return this.stateAccumulator !== undefined;
  }

  /** Returns previously saved state object for given key or undefined if none. */
  public getSavedState(key: string): Object | undefined {
    this.loadAccumulator();
    return this.stateAccumulator && this.stateAccumulator[key];
  }

  /** Records a chunk of state associated with given key for saving and later retrieval. */
  public recordState<T>(key: string, data: T): void {
    if (this.stateAccumulator) {
      this.stateAccumulator[key] = data as Object;
    }
  }

  /** Cleans up any saved state. */
  public cleanUpSavedState(): void {
    localStorage.removeItem(SessionStateService.LOCAL_STORAGE_KEY);
  }

  /** Sends "rehydration complete" event. */
  public notifyComplete(): void {
    this.eventBrokerService.sessionStateRestoreComplete.next({origin: EventOrigin.SERVICE, data: undefined});
  }

  /**
   * Subscribes to session save requests, responding with given key and dehydrator, then calls a re-hydrator 
   * if previously saved state exists with same key. Does nothing if the key is undefined. Convenience 
   * function to simplify user constructors.
   */
  public register<T>(key: string | undefined, dehydrator: () => T, rehydrator: (state: T) => void): void {
    if (!key) {
      return;
    }
    this.eventBrokerService.sessionStateSaveRequest.subscribe(_eventInfo => this.recordState(key, dehydrator()));
    const state = this.getSavedState(key);
    if (state) {
      rehydrator(state as T);
    }
  }

  private loadAccumulator(): void {
    if (this.stateAccumulator) {
      return;
    }
    const json = localStorage.getItem(SessionStateService.LOCAL_STORAGE_KEY);
    if (!json) {
      return;
    }
    this.stateAccumulator = JSON.parse(json);
  }
}
