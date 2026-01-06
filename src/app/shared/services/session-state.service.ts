/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { Injectable } from '@angular/core';
import { EventBrokerService, EventOrigin } from './event-broker.service';
import { VERSION } from '../classes/version';

const LOCAL_STORAGE_PREFIX = 'bridge-designer';

@Injectable({ providedIn: 'root' })
export class SessionStateService {
  /** Local storage key that advances for every build via `npm run build`. */
  private static readonly LOCAL_STORAGE_KEY = `${LOCAL_STORAGE_PREFIX}.v${VERSION}`;
  private static readonly SESSION_KEY = 'session.service';
  private stateAccumulator: { [key: string]: Object } | undefined;
  private isEnabled: boolean = true;

  constructor(private readonly eventBrokerService: EventBrokerService) {
    // Allow user to reset local storage with URL query string "?reset".
    // Here to ensure no possible session reads are already complete.
    // Too early for Angular active route, so use window object.
    // The reset param is deleted at app level after view init.
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') !== null) {
      localStorage.clear();
    }
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
    this.clearSavedState();
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

  /** Get saved state into the accumulator. May be called any number of times; loads only once. */
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

  /** Clear all old state, but keep other local storage key prefixes. Declutters storage on version bump. */
  private clearSavedState() {
    for (let i = 0; i < localStorage.length; ++i) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOCAL_STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
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
