import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { jqxSplitterModule } from 'jqwidgets-ng/jqxsplitter';
import { jqxTabsModule } from 'jqwidgets-ng/jqxtabs';
import { jqxTreeComponent, jqxTreeModule } from 'jqwidgets-ng/jqxtree';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';
import { EventBrokerService } from '../../../shared/services/event-broker.service';
import { HelpTopicComponent } from '../help-topic/help-topic.component';
import { HelpNavTreeComponent } from '../help-nav-tree/help-nav-tree.component';
import { jqxToolBarComponent, jqxToolBarModule } from 'jqwidgets-ng/jqxtoolbar';
import { WidgetHelper } from '../../../shared/classes/widget-helper';
import { HelpEventService } from '../help-event.service';

const enum Tools {
  BACK_TOPIC,
  FORWARD_TOPIC,
}

@Component({
  selector: 'help-dialog',
  standalone: true,
  imports: [
    HelpNavTreeComponent,
    HelpTopicComponent,
    jqxSplitterModule,
    jqxTabsModule,
    jqxToolBarModule,
    jqxTreeModule,
    jqxWindowModule,
    jqxButtonModule,
  ],
  templateUrl: './help-dialog.component.html',
  styleUrl: './help-dialog.component.scss',
})
export class HelpDialogComponent implements AfterViewInit {
  public static readonly DEFAULT_TOPIC_ID = 'hlp_how_to';

  @ViewChild('dialog') dialog!: jqxWindowComponent;
  @ViewChild('helpTopic') helpTopic!: HelpTopicComponent;
  @ViewChild('navTree') navTree!: jqxTreeComponent;
  @ViewChild('toolBar') toolBar!: jqxToolBarComponent;

  _currentTopicName: string = HelpDialogComponent.DEFAULT_TOPIC_ID;
  tools: string = 'button button';
  private backTopicStack: { topicName: string; scrollTop: number }[] = [];
  private forwardTopicStack: { topicName: string; scrollTop: number }[] = [];
  private isInternalGoTo: boolean = false;

  constructor(
    private readonly eventBrokerService: EventBrokerService,
    private readonly helpEventService: HelpEventService,
  ) {}

  initTools = ((_type?: string, index?: number, tool?: any, _menuToolIninitialization?: boolean): any => {
    switch (index) {
      case Tools.BACK_TOPIC:
        WidgetHelper.initToolbarImgButton('Back one topic', 'img/back.png', tool);
        tool.on('click', () => this.goBack());
        break;
      case Tools.FORWARD_TOPIC:
        WidgetHelper.initToolbarImgButton('Forward one topic', 'img/play.png', tool);
        tool.on('click', () => this.goForward());
        break;
    }
  }).bind(this);

  // Listen in on the 2-way binding to maintain stacks.
  set currentTopicName(value: string) {
    if (value !== this._currentTopicName && !this.isInternalGoTo) {
      this.backTopicStack.push({ topicName: this._currentTopicName, scrollTop: this.helpTopic.scrollTop });
      this.forwardTopicStack.length = 0;
      this.enableAndDisableButtons();
    }
    this._currentTopicName = value;
  }

  get currentTopicName(): string {
    return this._currentTopicName;
  }

  private goBack() {
    const top = this.backTopicStack.pop();
    if (top) {
      this.forwardTopicStack.push({ topicName: this._currentTopicName, scrollTop: this.helpTopic.scrollTop });
      this.goToInternal(top.topicName, top.scrollTop);
      this.enableAndDisableButtons();
    }
  }

  private goForward() {
    const top = this.forwardTopicStack.pop();
    if (top) {
      this.backTopicStack.push({ topicName: this._currentTopicName, scrollTop: this.helpTopic.scrollTop });
      this.goToInternal(top.topicName, top.scrollTop);
      this.enableAndDisableButtons();
    }
  }

  /** Go to a topic without handling the resulting change event. */
  private goToInternal(topicName: string, scrollTop: number) {
    this.isInternalGoTo = true;
    this.helpEventService.goToTopicRequest.next({ topicName, scrollTop });
    this.isInternalGoTo = false;
  }

  private enableAndDisableButtons(): void {
    const tools = this.toolBar.getTools();
    tools[Tools.BACK_TOPIC].tool.jqxButton({ disabled: this.backTopicStack.length === 0 });
    tools[Tools.FORWARD_TOPIC].tool.jqxButton({ disabled: this.forwardTopicStack.length === 0 });
  }

  ngAfterViewInit(): void {
    this.eventBrokerService.helpRequest.subscribe(eventInfo => {
      if (eventInfo.data) {
        this.goToInternal(eventInfo.data, 0);
      }
      this.dialog.open();
    });
    this.enableAndDisableButtons();
  }
}
