/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { AfterViewInit, Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { jqxSplitterModule } from 'jqwidgets-ng/jqxsplitter';
import { jqxTabsModule, jqxTabsComponent } from 'jqwidgets-ng/jqxtabs';
import { jqxTreeComponent, jqxTreeModule } from 'jqwidgets-ng/jqxtree';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';
import { HelpTopicComponent } from '../help-topic/help-topic.component';
import { HelpNavTreeComponent } from '../help-nav-tree/help-nav-tree.component';
import { jqxToolBarComponent, jqxToolBarModule } from 'jqwidgets-ng/jqxtoolbar';
import { WidgetHelper } from '../../../shared/classes/widget-helper';
import { HelpSearchComponent } from '../help-search/help-search.component';
import { HelpTopicListComponent } from '../help-topic-list/help-topic-list.component';
import { CurrentTopicService } from '../current-topic.service';
import { HelpTab } from './types';

const enum Tools {
  BACK_TOPIC,
  FORWARD_TOPIC,
  SHARE,
  PRINT,
}

/** Dialog height to use before dynamic resizing. */
const DEFAULT_HEIGHT = 650;

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
  dialogHeight: number = DEFAULT_HEIGHT;

  @Output('onLoad') onLoadEmitter = new EventEmitter<void>();

  @ViewChild('dialog') dialog!: jqxWindowComponent;
  @ViewChild('helpSearch') helpSearch!: HelpSearchComponent;
  @ViewChild('helpTopic') helpTopic!: HelpTopicComponent;
  @ViewChild('navTree') navTree!: jqxTreeComponent;
  @ViewChild('tabs') tabs!: jqxTabsComponent;
  @ViewChild('toolBar') toolBar!: jqxToolBarComponent;
  @ViewChild('topicList') topicList!: HelpTopicListComponent;

  readonly tools: string = 'button button | button | button';
  private tabIndex: number | undefined;

  constructor(
    private readonly currentTopicService: CurrentTopicService,
    private readonly eventBrokerService: EventBrokerService,
  ) {}

  initTools = ((_type?: string, index?: number, tool?: any, _menuToolInitialization?: boolean): any => {
    switch (index) {
      case Tools.BACK_TOPIC:
        WidgetHelper.initToolbarImgButton('Back one topic', 'img/back.png', tool);
        tool.on('click', () => this.currentTopicService.goBack());
        break;
      case Tools.FORWARD_TOPIC:
        WidgetHelper.initToolbarImgButton('Forward one topic', 'img/play.png', tool);
        tool.on('click', () => this.currentTopicService.goForward());
        break;
      case Tools.SHARE:
        // Absolute positioning seems to be the only way here.
        WidgetHelper.initToolbarImgButton('Copy topic URL to clipboard', 'img/share.png', tool);
        tool.css({ position: 'absolute', right: '30px' });
        tool.on('click', () => this.copyUrlToClipboard());
        break;
      case Tools.PRINT:
        WidgetHelper.initToolbarImgButton('Forward one topic', 'img/print.png', tool);
        tool.css({ position: 'absolute', right: '0' });
        tool.on('click', () => this.currentTopicService.printCurrentTopicRequest.next());
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

  private copyUrlToClipboard(): void {
    WidgetHelper.copyToClipboard(
      () => `${document.URL}?help=${this.currentTopicService.currentTopicId}`,
      this.eventBrokerService,
      EventOrigin.SERVICE,
    );
  }

  ngAfterViewInit(): void {
    this.currentTopicService.currentTopicIdChange.subscribe(_id => {
      this.enableAndDisableButtons();
    });
    this.eventBrokerService.helpRequest.subscribe(info => {
      if (info.data) {
        this.currentTopicService.goToTopicId(info.data.topic, { stack: null });
        this.tabIndex = info.data.tab;
      }
      if (this.dialog.isOpen()) {
        this.handleDialogOpen();
      } else {
        // Initial resize to use a reasonable chunk of client height. Afterward, size is up to the user.
        if (this.dialogHeight === DEFAULT_HEIGHT) {
          this.dialogHeight = Math.min(window.innerHeight, 1000);
        }
        this.dialog.open();
      }
    });
    this.enableAndDisableButtons();
    // Tell parent deferred load is complete.
    this.onLoadEmitter.emit();
  }
}
