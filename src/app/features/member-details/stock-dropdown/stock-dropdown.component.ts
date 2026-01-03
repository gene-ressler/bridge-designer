import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { jqxDropDownListComponent, jqxDropDownListModule } from 'jqwidgets-ng/jqxdropdownlist';

import { Member } from '../../../shared/classes/member.model';

@Component({
  selector: 'stock-dropdown',
  imports: [jqxDropDownListModule],
  templateUrl: './stock-dropdown.component.html',
  styleUrl: './stock-dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockDropdownComponent implements OnChanges {
  @Input() width: number = 376;
  @Input() selectedIndex: number = 0;
  @Input() membersPartitionedByStock: Member[][] = [];
  @Output() readonly onStockSelection = new EventEmitter<Member[]>();

  @ViewChild('stockDropdownList') stockDropdownList!: jqxDropDownListComponent;

  source: string[] = [''];

  constructor() {
    // Fix up "this" for jqWidgets callbacks. They pass the jqxDropdownList.
    this.renderer = this.renderer.bind(this);
    this.selectionRenderer = this.selectionRenderer.bind(this);
  }

  /** Sets up dependent values when underlying member data changes. */
  ngOnChanges(changes: SimpleChanges): void {
    if (this.stockDropdownList && changes['membersPartitionedByStock']) {
      // Only source length matters. Renderer touches member partitions by index.
      this.source = new Array(this.membersPartitionedByStock.length).fill('');
      this.stockDropdownList.selectedIndex(0);
      this.onStockSelection.emit(this.membersPartitionedByStock[0]);
    }
  }

  handleOnSelect(event: any): void {
    if (!event.args) {
      return;
    }
    this.onStockSelection.emit(this.membersPartitionedByStock[event.args.index]);
  }

  renderer(index?: number): string {
     // jqWidgets sends odd stuff. Filter it out.
    if (typeof index !== 'number') {
      return '';
    }
    return this.formatMemberMaterial(this.membersPartitionedByStock[index]);
  }

  selectionRenderer(_obj?: any, index?: number): string {
    // jqWidgets sends odd stuff. Filter it out.
    if (typeof index !== 'number' || index < 0) { 
      return '<div style="display:grid;padding:4px 0 4px 0">No selection</div>';
    }
    return this.formatMemberMaterial(this.membersPartitionedByStock[index]);
  }

  private formatMemberMaterial(members: Member[] | undefined): string {
    if (!members || !members[0]) {
      return '<div style="display:grid;padding:4px 0 4px 0">none</div>';
    }
    const member = members[0];
    return `<div style="display:grid;grid-template-columns:180px 80px auto;padding:4px 0 4px 0">
<div>${member.material.name}</div>
<div>${member.shape.section.name}</div>
<div>${member.shape.name}</div>
</div>`;
  }
}
