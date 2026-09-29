/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ContestParametersService } from '../../../shared/services/contest-parameters.service';
import { SessionStateService } from '../../session-state/session-state.service';

@Component({
  selector: 'contest-welcome-dialog',
  imports: [ConfirmationDialogComponent],
  templateUrl: './contest-welcome-dialog.component.html',
  styleUrl: './contest-welcome-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContestWelcomeDialogComponent {
  @ViewChild('dialog') dialog!: ConfirmationDialogComponent;

  constructor(
    public readonly contestParametersService: ContestParametersService,
    public readonly sessionStateService: SessionStateService,
  ) {}

  public splashIfContest() {
    if (this.contestParametersService.parameters.isPatched && !this.sessionStateService.isCurrentStateDueToTabRefresh) {
      this.dialog.open();
    }
  }
}
