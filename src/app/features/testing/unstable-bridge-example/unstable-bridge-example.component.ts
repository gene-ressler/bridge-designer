import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';

@Component({
  selector: 'unstable-bridge-example',
  standalone: true,
  imports: [jqxButtonModule],
  templateUrl: './unstable-bridge-example.component.html',
  styleUrl: './unstable-bridge-example.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnstableBridgeExampleComponent implements AfterViewInit {
  @Input({ required: true }) exampleNumber: number = 1;
  @ViewChild('textBox') textBox!: ElementRef<HTMLDivElement>;

  partCount: number = 0;
  partIndex: number = 0;
  get exampleImgSrc(): string {
    return `img/ex${this.exampleNumber}pt${this.partIndex + 1}.gif`;
  }

  bumpPart(increment: 1 | -1) {
    let partIndex = this.partIndex + increment;
    if (partIndex >= this.partCount) {
      partIndex -= this.partCount;
    }
    if (partIndex < 0) {
      partIndex += this.partCount;
    }
    this.selectPart(partIndex);
  }

  private selectPart(partIndex: number): void {
    for (let i = 0; i < this.partCount; ++i) {
      const card = this.textBox.nativeElement.children.item(i) as HTMLDivElement;
      card.style.display = i === partIndex ? 'block' : 'none';
    }
    this.partIndex = partIndex;
  }

  ngAfterViewInit(): void {
    this.partCount = this.textBox.nativeElement.childElementCount;
    this.selectPart(0);
  }
}
