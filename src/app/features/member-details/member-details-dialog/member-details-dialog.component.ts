/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { AfterViewInit, ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { EventBrokerService } from '../../../shared/services/event-broker.service';

@Component({
  selector: 'member-details-dialog',
  imports: [jqxButtonModule, jqxWindowModule],
  templateUrl: './member-details-dialog.component.html',
  styleUrl: './member-details-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberDetailsDialogComponent implements AfterViewInit{
  @ViewChild('dialog') dialog!: jqxWindowComponent;

  constructor(private readonly eventBrokerService: EventBrokerService) {}

  ngAfterViewInit(): void {
    this.eventBrokerService.memberDetailsRequest.subscribe(() => this.dialog.open())
  }
}
