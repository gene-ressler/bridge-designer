import { AfterViewInit, ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';
import { jqxDropDownListComponent, jqxDropDownListModule } from 'jqwidgets-ng/jqxdropdownlist';

@Component({
  selector: 'height-dropdown-list',
  standalone: true,
  imports: [jqxButtonModule, jqxDropDownListModule],
  templateUrl: './height-list.component.html',
  styleUrl: './height-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeightListComponent implements AfterViewInit, OnChanges {
  @ViewChild('heightList') heightList!: jqxDropDownListComponent;
  @Input() heights: string[] = [];
  @Input() onSelect: (event: any) => void = () => undefined;
  @Input() disabled: boolean = false;

  /** Suffix of input heights visible to the user. */
  visibleHeights: string[] = [];

  private _startIndex: number = 0;
  private _selectedIndex: number = 0;

  public set startIndex(startIndex: number) {
    if (startIndex < 0) {
      startIndex = 0;
    }
    if (startIndex > this.heights.length) {
      startIndex = this.heights.length;
    }
    if (startIndex === this._startIndex) {
      return;
    }
    this._startIndex = startIndex;
    // Invokes change detection.
    this.visibleHeights = this.heights.slice(startIndex);
  }

  public set selectedIndex(selectedIndex: number) {
    this._selectedIndex = selectedIndex;
    this.updateWidget();
  }

  public get selectedIndex(): number {
    return this._selectedIndex;
  }

  selectHandler(event: any): void {
    this._selectedIndex = event.args.index + this._startIndex;
    this.onSelect({ args: { index: this._selectedIndex }})
  }

  private updateWidget(): void {
    if (this._startIndex == this.heights.length) {
      this.heightList.setContent('');
      this.heightList.disabled(true);
    } else {
      this.heightList.disabled(this.disabled);
      if (this._selectedIndex < this._startIndex) {
        this._selectedIndex = this._startIndex;
      }
      this.heightList.selectIndex(this._selectedIndex - this._startIndex);
      this.heightList.setContent(this.heights[this._selectedIndex]);
    }
  }

  ngAfterViewInit(): void {
    this.visibleHeights = this.heights;
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.updateWidget();
  }
}
