import { Injectable } from '@angular/core';
import { AnalysisService, AnalysisStatus } from '../../shared/services/analysis.service';
import { DOLLARS_FORMATTER, Utility } from '../../shared/classes/utility';
import { EventBrokerService, EventOrigin } from '../../shared/services/event-broker.service';
import { BridgeService } from '../../shared/services/bridge.service';
import { DraftingPanelState, PersistenceService, SaveSet } from '../../shared/services/persistence.service';
import { BridgeCostService } from '../costs/cost-report-dialog/bridge-cost.service';
import { BridgeModel } from '../../shared/classes/bridge.model';
import { SessionStateService } from '../../shared/services/session-state.service';

/** A POTO representation of iterations for jqxTreegrid and jqxListbox. */
export class DesignIteration {
  readonly expanded: boolean = true;

  // Defaults are only to create the root node.
  constructor(
    public readonly index: number,
    public readonly parentIndex: number | undefined,
    private _bridge: BridgeModel,
    private _cost: number,
    private _draftingPanelState: DraftingPanelState,
    private _status: AnalysisStatus | undefined,
  ) {}

  get bridge(): BridgeModel {
    return this._bridge;
  }

  get cost(): number {
    return this._cost;
  }

  get draftingPanelState(): DraftingPanelState {
    return this._draftingPanelState;
  }

  get isOpen(): boolean {
    return this._status === undefined;
  }

  get iterationNumber(): number {
    return this._bridge!.iterationNumber;
  }

  get projectId(): string {
    return this._bridge!.projectId;
  }

  get status(): AnalysisStatus {
    return this._status || AnalysisStatus.NONE;
  }

  // UI tree widget item data

  get icon(): string {
    return AnalysisService.getStatusIcon(this.status).src;
  }

  get label(): string {
    return `${this.iterationNumber} — ${DOLLARS_FORMATTER.format(this.cost)} — ${this.projectId}`;
  }

  /** Gets the open iteration ready to be displayed. */
  refreshCost(cost: number): void {
    this._cost = cost;
  }

  closeOrUpdateClosedIteration(cost: number, status: AnalysisStatus) {
    if (!this._status) {
      this._bridge = BridgeModel.createClone(this._bridge);
      this._draftingPanelState = DraftingPanelState.createClone(this._draftingPanelState);
    }
    this._cost = cost;
    this._status = status;
  }
}

/** Container for iterations on the current design. */
@Injectable({ providedIn: 'root' })
export class DesignIterationService {
  public readonly iterations: DesignIteration[] = [];
  private _inProgressIndex: number = -1;
  /** Max number seen while creating any new in-progress iteration. Incremented to get fresh numbers. */
  private maxIterationNumber: number = 0;
  private inProgressParentIndex: number | undefined;

  constructor(
    private readonly bridgeService: BridgeService,
    private readonly bridgeCostService: BridgeCostService,
    private readonly eventBrokerService: EventBrokerService,
    private readonly persistenceService: PersistenceService,
    sessionStateService: SessionStateService,
  ) {
    sessionStateService.register(
      'iterations',
      () => this.dehydrate(),
      state => this.rehydrate(state),
    );
    eventBrokerService.sessionStateRestoreComplete.subscribe(_eventInfo => {
      if (this.iterations.length > 0) {
        this.sendChangeEvent();
      }
    });
    eventBrokerService.loadBridgeRequest.subscribe(eventInfo => {
      if (eventInfo.origin !== EventOrigin.DESIGN_ITERATION_DIALOG) {
        this.clearIterations();
        this.createInProgressIteration(eventInfo.data.bridge, eventInfo.data.draftingPanelState);
        this._inProgressIndex = 0;
      }
    });
    eventBrokerService.analysisCompletion.subscribe(eventInfo => {
      this.inProgress.closeOrUpdateClosedIteration(bridgeCostService.allCosts, eventInfo.data);
    });
    eventBrokerService.editCommandCompletion.subscribe(_eventInfo => {
      if (!this.inProgress.isOpen) {
        const bridge = this.bridgeService.bridge;
        this.createInProgressIteration(bridge, this.bridgeService.draftingPanelState);
        bridge.iterationNumber = ++this.maxIterationNumber;
      }
    });
    eventBrokerService.designIterationForwardRequest.subscribe(_eventInfo => this.chooseRelative(+1));
    eventBrokerService.designIterationBackRequest.subscribe(_eventInfo => this.chooseRelative(-1));
    if (this.iterations.length === 0) {
      // Skip if rehydrated.
      this.createInProgressIteration(bridgeService.bridge, bridgeService.draftingPanelState); // Placeholder.
    }
  }

  public get inProgressIndex(): number {
    return this._inProgressIndex;
  }

  public refreshInProgress(): void {
    this.inProgress.refreshCost(this.bridgeCostService.allCosts);
  }

  /** Choose the iteration with given index. If the in progress index is given, nothing happens. */
  public choose(index: number): void {
    if (index === this._inProgressIndex) {
      return;
    }
    const inProgress = this.inProgress;
    if (inProgress.isOpen) {
      inProgress.closeOrUpdateClosedIteration(this.bridgeCostService.allCosts, AnalysisStatus.NONE);
    }
    this._inProgressIndex = index;
    // Refrain from starting a new column if we're at the last iteration for its parent.
    this.inProgressParentIndex = this.isLastChildOfParent(index) ? this.iterations[index].parentIndex : index;
    const newInProgress = this.inProgress;
    this.eventBrokerService.loadBridgeRequest.next({
      origin: EventOrigin.DESIGN_ITERATION_DIALOG,
      data: {
        bridge: BridgeModel.createClone(newInProgress.bridge),
        draftingPanelState: DraftingPanelState.createClone(newInProgress.draftingPanelState),
      },
    });
    this.sendChangeEvent();
  }

  /** Chooses an iteration with index relative to the current one. */
  public chooseRelative(increment: number): void {
    const newInProgressIndex = Utility.clamp(this._inProgressIndex + increment, 0, this.iterations.length - 1);
    if (newInProgressIndex === this._inProgressIndex) {
      return;
    }
    this.choose(newInProgressIndex);
  }

  /** Returns whether the iteration with given index is the last child of its parent. */
  private isLastChildOfParent(index: number) {
    const parentIndex = this.iterations[index].parentIndex;
    for (let i = index + 1; i < this.iterations.length; ++i) {
      if (this.iterations[i].parentIndex === parentIndex) {
        return false;
      }
    }
    return true;
  }

  private get inProgress(): DesignIteration {
    return this.iterations[this._inProgressIndex];
  }

  private createInProgressIteration(bridge: BridgeModel, draftingPanelState: DraftingPanelState): void {
    if (bridge.iterationNumber > this.maxIterationNumber) {
      this.maxIterationNumber = bridge.iterationNumber;
    }
    const newIterationIndex = this.iterations.length;
    const newIteration = new DesignIteration(
      newIterationIndex,
      this.inProgressParentIndex,
      bridge,
      -1,
      draftingPanelState,
      undefined, // status open
    );
    this._inProgressIndex = newIterationIndex;
    this.iterations.push(newIteration);
    this.sendChangeEvent();
  }

  private sendChangeEvent(): void {
    this.eventBrokerService.designIterationChange.next({
      origin: EventOrigin.SERVICE,
      data: {
        iterationCount: this.iterations.length,
        inProgressIndex: this._inProgressIndex,
      },
    });
  }

  private clearIterations(): void {
    if (this.iterations.length === 0) {
      return;
    }
    this.iterations.length = 0;
    this._inProgressIndex = -1;
    this.maxIterationNumber = 0;
    this.inProgressParentIndex = undefined;
    this.sendChangeEvent();
  }

  dehydrate(): State {
    this.refreshInProgress();
    return {
      iterations: this.iterations.map(iteration => ({
        index: iteration.index,
        parentIndex: iteration.parentIndex,
        bridge: this.persistenceService.getSaveSetAsText(
          SaveSet.create(iteration.bridge, iteration.draftingPanelState),
        ),
        cost: iteration.cost,
        status: iteration.status,
      })),
      inProgressIndex: this._inProgressIndex,
      maxIterationNumber: this.maxIterationNumber,
      inProgressParentIndex: this.inProgressParentIndex,
    };
  }

  rehydrate(state: State): void {
    state.iterations.forEach(iteration => {
      const saveSet = SaveSet.createNew();
      this.persistenceService.parseSaveSetText(iteration.bridge, saveSet);
      this.iterations.push(
        new DesignIteration(
          iteration.index,
          iteration.parentIndex,
          saveSet.bridge,
          iteration.cost,
          saveSet.draftingPanelState,
          iteration.status,
        ),
      );
    });
    this._inProgressIndex = state.inProgressIndex;
    this.maxIterationNumber = state.maxIterationNumber;
    this.inProgressParentIndex = state.inProgressParentIndex;
  }
}

type IterationState = {
  index: number;
  parentIndex: number | undefined;
  bridge: string;
  cost: number;
  status: AnalysisStatus | undefined;
};

type State = {
  iterations: IterationState[];
  inProgressIndex: number;
  maxIterationNumber: number;
  inProgressParentIndex: number | undefined;
};
