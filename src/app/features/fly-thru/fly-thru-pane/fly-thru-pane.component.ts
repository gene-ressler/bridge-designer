import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostBinding, ViewChild } from '@angular/core';
import { EventBrokerService } from '../../../shared/services/event-broker.service';

@Component({
  selector: 'fly-thru-pane',
  imports: [],
  templateUrl: './fly-thru-pane.component.html',
  styleUrl: './fly-thru-pane.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlyThruPaneComponent implements AfterViewInit {
  @HostBinding('style.display') display: string = 'none';
  @ViewChild('flyThruCanvas') flyThruCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(private readonly eventBrokerService: EventBrokerService) {}

  public set isVisible(value: boolean) {
    this.display = value ? 'block' : 'none';
  }

  ngAfterViewInit(): void {
    this.eventBrokerService.uiModeRequest.subscribe(eventInfo => {
      this.isVisible = eventInfo.data === 'animation';
    });
  }
}
