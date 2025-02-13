import { Injectable } from '@angular/core';
import { AnalysisService, AnalysisStatus } from '../../shared/services/analysis.service';
import { DOLLARS_FORMATTER } from '../../shared/classes/utility';

export class DesignIteration {
  readonly expanded: boolean = true;

  constructor(
    public readonly status: AnalysisStatus = AnalysisStatus.NONE,
    public readonly iteration: number = 0,
    public readonly cost: number = -1,
    public readonly projectId: string = '[none]',
    public readonly saveSet: string,
  ) {}

  get id(): string {
    return this.iteration.toString();
  }

  get icon(): string {
    return AnalysisService.getStatusIcon(this.status).src;
  }

  get label(): string {
    return `${this.iteration} — ${DOLLARS_FORMATTER.format(this.cost)} — ${this.projectId}`
  }

  get value(): string {
    return this.saveSet;
  }
}

/** Container for iterations on the current design. */
@Injectable({ providedIn: 'root' })
export class DesignIterationService {
  constructor() {}
}
