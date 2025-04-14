import { Injectable } from '@angular/core';
import { EventBrokerService, EventOrigin } from './event-broker.service';

@Injectable({ providedIn: 'root' })
export class SessionStateService {
  private static readonly LOCAL_STORAGE_KEY = 'bridgedesigner.v1.00000';
  private static readonly SESSION_KEY = 'session.service';
  private stateAccumulator: { [key: string]: Object } | undefined;
  private isEnabled: boolean = true;

  constructor(private readonly eventBrokerService: EventBrokerService) {
    eventBrokerService.sessionStateEnableToggle.subscribe(eventInfo => {
      this.isEnabled = eventInfo.data !== false;
    });
    this.register(
      SessionStateService.SESSION_KEY,
      () => this.dehydrate(),
      state => this.hydrate(state),
      true /* essential */,
    );
  }

  /**
   * Broadcasts a request for subscribers to record state for saving, then saves the recorded results. Optionally
   * the subscription can be "essential," which means a save request will occur event if this service is disabled.
   */
  public saveState(): void {
    this.stateAccumulator = {};
    if (this.isEnabled) {
      this.eventBrokerService.sessionStateSaveRequest.next({ origin: EventOrigin.SERVICE, data: undefined });
    }
    this.eventBrokerService.sessionStateSaveEssentialRequest.next({ origin: EventOrigin.SERVICE, data: undefined });
    localStorage.clear();
    localStorage.setItem(SessionStateService.LOCAL_STORAGE_KEY, JSON.stringify(this.stateAccumulator));
    this.stateAccumulator = undefined;
  }

  /** Returns whether non-essential saved state has been restored. */
  public get hasRestoredState(): boolean {
    this.loadAccumulatorFromStorage();
    return this.stateAccumulator !== undefined && this.isEnabled;
  }

  /** Returns previously saved state object for given key or undefined if none. */
  public getSavedState(key: string): Object | undefined {
    this.loadAccumulatorFromStorage();
    return this.stateAccumulator && this.stateAccumulator[key];
  }

  /** Records a chunk of state associated with given key for saving and later retrieval. */
  public recordState<T>(key: string, data: T): void {
    if (this.stateAccumulator) {
      this.stateAccumulator[key] = data as Object;
    }
  }

  /** Sends "rehydration complete" event. */
  public notifyRestoreComplete(): void {
    this.loadAccumulatorFromStorage();
    this.eventBrokerService.sessionStateRestoreCompletion.next({ origin: EventOrigin.SERVICE, data: undefined });
  }

  /** Restores the whole system's session manater enabled state with a broadcast. */
  public restoreSessionManagementEnabled(): void {
    this.loadAccumulatorFromStorage();
    this.eventBrokerService.sessionStateEnableToggle.next({ origin: EventOrigin.SERVICE, data: this.isEnabled });
  }

  /**
   * Subscribes to session save requests, responding with given key and dehydrator, then calls a re-hydrator
   * if previously saved state exists with same key. Does nothing if the key is undefined or empty. Convenience
   * function to simplify user constructors.
   */
  public register<T>(
    key: string | undefined,
    dehydrator: () => T,
    rehydrator: (state: T) => void,
    isEssential: boolean = false,
  ): void {
    if (!key) {
      return;
    }
    const saveSubject = isEssential
      ? this.eventBrokerService.sessionStateSaveEssentialRequest
      : this.eventBrokerService.sessionStateSaveRequest;
    saveSubject.subscribe(_eventInfo => this.recordState(key, dehydrator()));
    const state = this.getSavedState(key);
    if (state) {
      rehydrator(state as T);
    }
  }

  private loadAccumulatorFromStorage(): void {
    if (this.stateAccumulator) {
      return;
    }
    const json = localStorage.getItem(SessionStateService.LOCAL_STORAGE_KEY);
    if (!json) {
      return;
    }
    try {
      this.stateAccumulator = JSON.parse(json);
    } catch (error) {
      this.stateAccumulator = undefined;
    }
  }

  private dehydrate(): State {
    return { isEnabled: this.isEnabled };
  }

  private hydrate(state: State): void {
    this.isEnabled = state.isEnabled;
  }
}

type State = {
  isEnabled: boolean;
};
