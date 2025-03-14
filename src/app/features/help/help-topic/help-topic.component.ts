import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  QueryList,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopicNameDirective } from './topic-name.directive';
import { HelpDialogComponent } from '../help-dialog/help-dialog.component';
import { HelpTopicLinkComponent } from '../help-topic-link/help-topic-link.component';
import { HelpEventService } from '../help-event.service';
import { HelpPopupTopicComponent } from '../help-topic-popup/help-topic-popup.component';

@Component({
  selector: 'help-topic',
  standalone: true,
  imports: [CommonModule, HelpPopupTopicComponent, HelpTopicLinkComponent, TopicNameDirective],
  templateUrl: './help-topic.component.html',
  styleUrl: './help-topic.component.css',
})
export class HelpTopicComponent implements AfterViewInit, OnChanges {
  @Input() containerType: 'pane-content' | 'popup-content' = 'pane-content';
  @Input() visibleTopicName: string = HelpDialogComponent.DEFAULT_TOPIC_ID;
  @Output() visibleTopicNameChange: EventEmitter<string> = new EventEmitter<string>();

  @ViewChild('defaultTopic', { static: true }) visibleTopic: TemplateRef<any> | null = null;
  @ViewChild('topicContainer') topicContainer!: ElementRef<HTMLDivElement>;

  @ViewChildren(TopicNameDirective) topicNames!: QueryList<TopicNameDirective>;

  constructor(private readonly helpEventService: HelpEventService) {}

  public goToTopic(topicName: string, scrollTop?: number): void {
    if (!this.topicNames) {
      return;
    }
    const directive = this.topicNames.find((directive, _index, _allNames) => directive.name === topicName);
    if (!directive) {
      return;
    }
    this.visibleTopicName = topicName;
    this.visibleTopic = directive.templateRef;
    this.visibleTopicNameChange.emit(topicName);
    if (scrollTop !== undefined) {
      setTimeout(() => {
        this.topicContainer.nativeElement.scrollTop = scrollTop;
      });
    }
  }

  public get scrollTop(): number {
    return this.topicContainer.nativeElement.scrollTop;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const change = changes['visibleTopicName'];
    if (change) {
      this.goToTopic(change.currentValue);
    }
  }

  ngAfterViewInit(): void {
    this.goToTopic(this.visibleTopicName);
    this.helpEventService.goToTopicRequest.subscribe(({ topicName, scrollTop }) =>
      this.goToTopic(topicName, scrollTop),
    );
  }
}
