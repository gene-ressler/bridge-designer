import { AfterViewInit, Component } from '@angular/core';
import { AnalysisService, AnalysisStatus } from '../../../shared/services/analysis.service';
import { AnalysisValidityService } from '../management/analysis-validity.service';
import { EventBrokerService } from '../../../shared/services/event-broker.service';

@Component({
  selector: 'status-indicator',
  standalone: true,
  templateUrl: './status-indicator.component.html',
  styleUrl: './status-indicator.component.scss',
})
export class StatusIndicatorComponent implements AfterViewInit {
  iconSrc!: string;
  iconTitle!: string;

  constructor(
    private readonly analysisService: AnalysisService,
    private readonly analysisValidityService: AnalysisValidityService,
    private readonly eventBrokerService: EventBrokerService,
  ) {
    this.setIcon(AnalysisStatus.NONE);
  }

  private setIcon(status: AnalysisStatus): void {
    switch (status) {
      case AnalysisStatus.PASSES:
        this.iconSrc = 'img/good.png';
        this.iconTitle = 'The design passed its last test.';
        break;
      case AnalysisStatus.FAILS_LOAD_TEST:
        this.iconSrc = 'img/bad.png';
        this.iconTitle = 'The design failed its last test.';
        break;
      case AnalysisStatus.FAILS_SLENDERNESS:
        this.iconSrc = 'img/bad.png';
        this.iconTitle = 'Some members that are too slender.';
        break;
      case AnalysisStatus.UNSTABLE:
        this.iconSrc = 'img/bad.png';
        this.iconTitle = 'The design is unstable.';
        break;
      default:
        this.iconSrc = 'img/working.png';
        this.iconTitle = "The design hasn't been analyzed.";
        break;
    }
  }

  ngAfterViewInit(): void {
    this.eventBrokerService.analysisCompletion.subscribe(eventInfo => {
      this.setIcon(eventInfo.data);
    });
    this.eventBrokerService.editCommandCompletion.subscribe(_eventInfo => {
      if (this.analysisValidityService.isLastAnalysisValid) {
        this.setIcon(this.analysisService.status);
      } else {
        this.iconSrc = 'img/working.png';
        this.iconTitle = 'The design changed since last tested.';
      }
    })
  }
}
