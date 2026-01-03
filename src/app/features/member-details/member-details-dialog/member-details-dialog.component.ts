/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';
import { jqxDropDownListModule } from 'jqwidgets-ng/jqxdropdownlist';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';
import { jqxSliderComponent, jqxSliderModule } from 'jqwidgets-ng/jqxslider';
import { MemberStrengthGraphComponet } from '../member-strength-graph/member-strength-graph.component';
import { SectionDiagramComponent } from '../section-diagram/section-diagram.component';
import { StockDropdownComponent } from '../stock-dropdown/stock-dropdown.component';
import { WidgetHelper } from '../../../shared/classes/widget-helper';
import { Member } from '../../../shared/classes/member.model';
import { BridgeCostService } from '../../../shared/services/bridge-cost.service';
import { COUNT_FORMATTER, DOLLARS_FORMATTER, FIXED_FORMATTER } from '../../../shared/classes/utility';
import { BridgeService } from '../../../shared/services/bridge.service';
import { jqxCheckBoxModule } from 'jqwidgets-ng/jqxcheckbox';
import { ElementSelectorService, SelectionStash } from '../../drafting/shared/element-selector.service';

@Component({
  selector: 'member-details-dialog',
  imports: [
    MemberStrengthGraphComponet,
    SectionDiagramComponent,
    StockDropdownComponent,
    jqxButtonModule,
    jqxCheckBoxModule,
    jqxDropDownListModule,
    jqxSliderModule,
    jqxWindowModule,
  ],
  templateUrl: './member-details-dialog.component.html',
  styleUrl: './member-details-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberDetailsDialogComponent implements AfterViewInit {
  material: string = '';
  materialCostPerMeter: string = '';
  materialCrossSection: string = '';
  materialCrossSectionArea: string = '';
  materialCrossSectionMoment: string = '';
  materialCrossSectionSize: string = '';
  materialDensity: string = '';
  materialModulus: string = '';
  materialYieldStress: string = ''; // format with commas
  memberCost: string = '';
  memberLength: string = '';
  memberNumberList: string = '';
  membersPartitionedByStock: Member[][] = [];
  passFailCompression: string = '?';
  passFailTension: string = '?';
  selectedMember: Member | undefined;
  selectedMembers: Member[] | undefined;
  selectionStash: SelectionStash | undefined;
  zoom: boolean = true;
  readonly sliderOptions = {
    width: 286,
    height: 28,
    mode: 'fixed',
    showTicks: true,
    buttonsPosition: 'left',
    tooltip: true,
    ticksFrequency: 1,
    tooltipFormatFunction: this.formatTooltip.bind(this),
    min: 0,
    max: 1,
    value: 0,
  } as const;

  @ViewChild('dialog') dialog!: jqxWindowComponent;
  @ViewChild('memberSliderContainer', { read: ViewContainerRef, static: true })
  memberSliderContainer!: ViewContainerRef;
  @ViewChild('stockDropdown') stockDropdown!: StockDropdownComponent;

  memberSlider!: jqxSliderComponent;

  constructor(
    private readonly bridgeService: BridgeService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly elementSelectorService: ElementSelectorService,
    private readonly eventBrokerService: EventBrokerService,
  ) {
    // jqWidgets binds unuseful "this" in callbacks. Get the one we want.
    this.initDialogContent = this.initDialogContent.bind(this);
  }

  /** Works around heinous bug in jqxSlider: can't be declared in HTML if parent isn't visible. Create dynamically. */
  initDialogContent(): void {
    this.memberSlider = WidgetHelper.setUpSlider(this.memberSliderContainer, this.sliderOptions, event =>
      this.handleMemberSliderChange(event),
    );
  }

  formatTooltip(index: number): string {
    return this.selectedMembers?.[index].number.toString() ?? '-';
  }

  handleOpen(): void {
    this.membersPartitionedByStock = this.bridgeService.partitionMembersByStock();
    this.selectionStash = this.elementSelectorService.stashSelection(EventOrigin.MEMBER_DETAILS_DIALOG);
  }

  handleClose(): void {
    if (this.selectionStash) {
      this.elementSelectorService.restoreSelection(this.selectionStash, EventOrigin.MEMBER_DETAILS_DIALOG);
      this.selectionStash = undefined;
    }
  }

  handleMemberSliderChange(event: any): void {
    const memberIndex = event?.args?.value;
    if (memberIndex !== undefined && this.selectedMembers) {
      this.setMemberInfoAndDetectChanges(this.selectedMembers[memberIndex]);
    }
  }

  handleStockSelection(members: Member[]): void {
    this.selectedMembers = members;
    this.memberNumberList = getMemberNumberList(members);
    const member = members[0]; // At least one element is guaranteed.
    this.materialCostPerMeter = DOLLARS_FORMATTER.format(BridgeCostService.getMemberCostPerM(member));
    this.materialCrossSection = member.shape.section.name;
    this.materialCrossSectionArea = member.shape.area.toExponential(2);
    this.materialCrossSectionMoment = member.shape.moment.toExponential(2);
    this.materialCrossSectionSize = member.shape.name;
    this.materialDensity = COUNT_FORMATTER.format(member.material.density); // Zero decimal places.
    this.material = member.material.name;
    this.materialModulus = member.material.e.toPrecision(3);
    this.materialYieldStress = COUNT_FORMATTER.format(member.material.fy);
    this.memberSlider.value(0);
    if (members.length <= 1) {
      this.memberSlider.disable();
    } else {
      this.memberSlider.enable();
      // Setting memberSlider.max(newMax) breaks button increment. This is the workaround.
      this.memberSlider.setOptions({ ...this.sliderOptions, max: members.length - 1 });
    }
    this.setMemberInfoAndDetectChanges(member);
  }

  handleZoomCheckBoxChange(event: any) {
    this.zoom = event.args.checked; // Piping within template doesn't work. Not sure why.
  }

  private setMemberInfoAndDetectChanges(member: Member) {
    this.selectedMember = member;
    this.memberCost = DOLLARS_FORMATTER.format(BridgeCostService.getMemberTotalCost(member));
    this.memberLength = FIXED_FORMATTER.format(member.lengthM);
    this.passFailCompression = member.compressionForceStrengthRatio > 1 ? 'fail' : 'pass';
    this.passFailTension = member.tensionForceStrengthRatio > 1 ? 'fail' : 'pass';
    // Highlight the member in the drafting panel and also select its material.
    this.elementSelectorService.setSelectedMembers([member.index], EventOrigin.MEMBER_DETAILS_DIALOG);
    this.changeDetectorRef.detectChanges();
  }

  ngAfterViewInit(): void {
    this.eventBrokerService.memberDetailsReportRequest.subscribe(() => this.dialog.open());
  }
}

function getMemberNumberList(members: Member[]): string {
  const ranges = [];
  let i: number = 0;
  while (i < members.length) {
    const [nextI, start, end] = getNextMemberNumberRange(i, members);
    if (start === end) {
      ranges.push(end.toString());
    } else if (end === start + 1) {
      ranges.push(start.toString(), end.toString());
    } else {
      ranges.push(`${start.toString()}-${end.toString()}`);
    }
    i = nextI;
  }
  return ranges.join(',');
}

function getNextMemberNumberRange(i: number, members: Member[]): [number, number, number] {
  const start = members[i].number;
  let current = start;
  while (++i < members.length && members[i].number === current + 1) {
    ++current;
  }
  return [i, start, current];
}
