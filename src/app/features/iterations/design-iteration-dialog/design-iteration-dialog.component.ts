import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { jqxListBoxModule } from 'jqwidgets-ng/jqxlistbox';
import { jqxTabsModule } from 'jqwidgets-ng/jqxtabs';
import { jqxTreeGridModule } from 'jqwidgets-ng/jqxtreegrid';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { jqxButtonComponent, jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';
import { EventBrokerService, EventInfo } from '../../../shared/services/event-broker.service';
import { BridgeService } from '../../../shared/services/bridge.service';
import { DesignBridgeRenderingService } from '../../../shared/services/design-bridge-rendering.service';
import { DesignJointRenderingService } from '../../../shared/services/design-joint-rendering.service';
import { DesignMemberRenderingService } from '../../../shared/services/design-member-rendering.service';
import { DesignRenderingService } from '../../../shared/services/design-rendering.service';
import { DesignSiteRenderingService } from '../../../shared/services/design-site-rendering.service';
import { ViewportTransform2D } from '../../../shared/services/viewport-transform.service';
import { SelectedElementsService } from '../../drafting/shared/selected-elements-service';

@Component({
  selector: 'design-iteration-dialog',
  standalone: true,
  imports: [jqxButtonModule, jqxListBoxModule, jqxTabsModule, jqxTreeGridModule, jqxWindowModule],
  /** Component-level injections of stateful services. Root versions are hidden. */
  providers: [
    DesignBridgeRenderingService,
    BridgeService,
    DesignJointRenderingService,
    DesignMemberRenderingService,
    DesignRenderingService,
    DesignSiteRenderingService,
    SelectedElementsService,
    ViewportTransform2D,
  ],

  templateUrl: './design-iteration-dialog.component.html',
  styleUrl: './design-iteration-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesignIterationDialogComponent {
  private static readonly ITERATION_DATA_FIELDS = [
    { name: 'status', type: 'number' },
    { name: 'iteration', type: 'number' },
    { name: 'cost', type: 'number' },
    { name: 'projectId', type: 'string' },
  ];

  // prettier-ignore
  readonly columns: any[] = [
    { 
      text: 'Status',
      datafield: 'status',
      cellsalign: 'center',
      width: 40,
    }, {
      text: 'Iteration',
      datafield: 'iteration',
      cellsalign: 'center',
      width: 52,
    }, {
      text: 'Cost',
      datafield: 'cost',
      cellsalign: 'center',
      width:64,
    }, {
      text: 'Project ID',
      datafield: 'projectId',
      cellsalign: 'center',
      width:64,
    }
  ];

  readonly source: any = {
    localdata: [],
    datatype: 'array',
    datafields: DesignIterationDialogComponent.ITERATION_DATA_FIELDS,
    hierarchy: { root: 'children' },
    id: 'iteration',
  };
  readonly dataAdapter: any;

  @ViewChild('dialog') dialog!: jqxWindowComponent;
  @ViewChild('okButton') okButton!: jqxButtonComponent;

  constructor(private readonly eventBrokerService: EventBrokerService) {

    this.dataAdapter = new jqx.dataAdapter(this.source);
  }

  dialogOpenHandler(_event: any) {}

  okClickHandler(): void {
    this.dialog.close();
  }

  ngAfterViewInit(): void {
    this.eventBrokerService.loadDesignIterationRequest.subscribe((_eventInfo: EventInfo): void => {
      this.dialog.open();
    });
  }
}
