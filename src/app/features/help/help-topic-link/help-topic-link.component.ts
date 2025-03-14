import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { HelpEventService } from '../help-event.service';

@Component({
  selector: 'topic-link',
  standalone: true,
  imports: [],
  templateUrl: './help-topic-link.component.html',
  styleUrl: './help-topic-link.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpTopicLinkComponent {
  @Input({ required: true }) name!: string;

  constructor(private readonly helpEventService: HelpEventService) {}

  handlePointerDown(event: any) {
    this.helpEventService.goToTopicRequest.next({ topicName: this.name, scrollTop: 0 });
    event.stopPropagation();
  }
}
