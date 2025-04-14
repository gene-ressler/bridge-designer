import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { jqxSplitterModule } from 'jqwidgets-ng/jqxsplitter';
import { jqxTabsModule, jqxTabsComponent } from 'jqwidgets-ng/jqxtabs';
import { jqxTreeComponent, jqxTreeModule } from 'jqwidgets-ng/jqxtree';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';
import { EventBrokerService } from '../../../shared/services/event-broker.service';
import { HelpTopicComponent } from '../help-topic/help-topic.component';
import { HelpNavTreeComponent } from '../help-nav-tree/help-nav-tree.component';
import { jqxToolBarComponent, jqxToolBarModule } from 'jqwidgets-ng/jqxtoolbar';
import { WidgetHelper } from '../../../shared/classes/widget-helper';
import { HelpSearchComponent } from '../help-search/help-search.component';
import { HelpTopicListComponent } from '../help-topic-list/help-topic-list.component';
import { CurrentTopicService } from '../current-topic.service';

const enum Tools {
  BACK_TOPIC,
  FORWARD_TOPIC,
}

export const enum HelpTab {
  CONTENTS,
  TOPICS,
  SEARCH,
}

@Component({
  selector: 'help-dialog',
  imports: [
    HelpNavTreeComponent,
    HelpSearchComponent,
    HelpTopicComponent,
    HelpTopicListComponent,
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
  @ViewChild('dialog') dialog!: jqxWindowComponent;
  @ViewChild('helpSearch') helpSearch!: HelpSearchComponent;
  @ViewChild('helpTopic') helpTopic!: HelpTopicComponent;
  @ViewChild('navTree') navTree!: jqxTreeComponent;
  @ViewChild('tabs') tabs!: jqxTabsComponent;
  @ViewChild('toolBar') toolBar!: jqxToolBarComponent;
  @ViewChild('topicList') topicList!: HelpTopicListComponent;

  readonly tools: string = 'button button';
  private tabIndex: number | undefined;

  constructor(
    private readonly currentTopicService: CurrentTopicService,
    private readonly eventBrokerService: EventBrokerService,
  ) {}

  initTools = ((_type?: string, index?: number, tool?: any, _menuToolIninitialization?: boolean): any => {
    switch (index) {
      case Tools.BACK_TOPIC:
        WidgetHelper.initToolbarImgButton('Back one topic', 'img/back.png', tool);
        tool.on('click', () => this.currentTopicService.goBack());
        break;
      case Tools.FORWARD_TOPIC:
        WidgetHelper.initToolbarImgButton('Forward one topic', 'img/play.png', tool);
        tool.on('click', () => this.currentTopicService.goForward());
        break;
    }
  }).bind(this);

  handleDialogOpen() {
    this.helpSearch.clear();
    this.tabs.select(this.tabIndex === undefined ? HelpTab.CONTENTS : this.tabIndex);
  }

  /** Works around failure of jqxListbox height calcs when in non-visible tabs. */
  handleTabSelected(event: any) {
    if (event.args.item === HelpTab.TOPICS) {
      setTimeout(() => this.topicList.refresh());
    }
  }

  private enableAndDisableButtons(): void {
    const tools = this.toolBar.getTools();
    tools[Tools.BACK_TOPIC].tool.jqxButton({ disabled: !this.currentTopicService.hasBackTopics });
    tools[Tools.FORWARD_TOPIC].tool.jqxButton({ disabled: !this.currentTopicService.hasForwardTopics });
  }

  ngAfterViewInit(): void {
    this.currentTopicService.currentTopicIdChange.subscribe(_id => {
      this.enableAndDisableButtons();
    });
    this.eventBrokerService.helpRequest.subscribe(eventInfo => {
      if (eventInfo.data) {
        this.currentTopicService.goToTopicId(eventInfo.data.topic, { stack: null });
        this.tabIndex = eventInfo.data.tab;
      }
      if (this.dialog.isOpen()) {
        this.handleDialogOpen();
      } else {
        this.dialog.open();
      }
    });
    this.enableAndDisableButtons();
  }
}
