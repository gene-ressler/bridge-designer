import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Input,
  ViewChild,
} from '@angular/core';
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
export class HeightListComponent implements AfterViewInit {
  @ViewChild('heightList') heightList!: jqxDropDownListComponent;
  @Input() heights: string[] = [];
  @Input() onSelect: (event: any) => void = () => undefined;
  @Input() get disabled(): boolean {
    return this._disabled;
  }
  set disabled(value: boolean) {
    if (this.heightList) {
      this.heightList.disabled(value);
    }
    this._disabled = value;
  }

  private _disabled: boolean = false;
  private _startIndex: number = 0;
  private _selectedIndex: number = 0;

  public set startIndex(value: number) {
    // Chop value to valid range.
    if (value < 0) {
      value = 0;
    }
    const heightsCount = this.heights.length;
    if (value > heightsCount) {
      value = heightsCount;
    }
    // Do nothing if no change.
    if (value === this._startIndex) {
      return;
    }
    this._startIndex = value;
    // Push selection to valid range.
    if (this._selectedIndex < value && value < heightsCount) {
      this._selectedIndex = value;
    }
    // Zero-length dropdowns create styling problems.
    if (value < heightsCount) {
      this.heightList.source(this.heights.slice(value));
    }
    this.updateWidget();
  }

  public set selectedIndex(value: number) {
    if (value < 0) {
      value = 0;
    }
    if (value > this.heights.length) {
      value = this.heights.length;
    }
    this._selectedIndex = value;
    this.updateWidget();
  }

  public get selectedIndex(): number {
    return this._selectedIndex;
  }

  selectHandler(event: any): void {
    // Ignore programmatic selection.
    if (event.args.type === 'none') {
      return;
    }
    this._selectedIndex = event.args.index + this._startIndex;
    this.onSelect({ args: { index: this._selectedIndex } });
    this.updateWidget();
  }

  /** Workaround for jqxDropDownList not closing when disabled. */
  private disableList(value: boolean = true) {
    if (value) {
      // Delay to avoid a race. Re-calculation of list content margins just 
      // after source change results in contents text too low in list box.
      setTimeout(() =>this.heightList.close());
    }
    this.heightList.disabled(value);
  }

  private updateWidget(): void {
    if (this._startIndex === this.heights.length) {
      this.disableList();
      this.heightList.setContent('');
    } else {
      this.disableList(this.disabled);
      this.heightList.selectIndex(this._selectedIndex - this._startIndex);
      this.heightList.setContent(this.heights[this._selectedIndex]);
    }
  }

  ngAfterViewInit(): void {
    this.heightList.source(this.heights);
    this.updateWidget();
  }
}
