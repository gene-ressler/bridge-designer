import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';
import { BridgeService } from '../../../shared/services/bridge.service';
import { EventBrokerService } from '../../../shared/services/event-broker.service';

@Component({
  selector: 'load-test-report-dialog',
  standalone: true,
  imports: [CommonModule, jqxWindowModule, jqxButtonModule],
  templateUrl: './load-test-report-dialog.component.html',
  styleUrl: './load-test-report-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadTestReportDialogComponent implements AfterViewInit {
  @ViewChild('dialog') dialog!: jqxWindowComponent;
  private changeToken: string = '';

  constructor(
    readonly bridgeService: BridgeService,
    private readonly changeDetector: ChangeDetectorRef,
    private readonly eventBrokerService: EventBrokerService,
  ) {}

  dialogOpenHandler(): void {
    this.changeToken += 'change';
    this.changeDetector.detectChanges();
    this.changeToken = '';
  }

  ngAfterViewInit(): void {
    this.eventBrokerService.analysisReportRequest.subscribe(_eventInfo => this.dialog.open());
  }
}
