import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  forwardRef,
  Input,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { jqxPopoverModule } from 'jqwidgets-ng/jqxpopover';
import { jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { HelpTopicComponent } from '../help-topic/help-topic.component';

@Component({
  selector: 'topic-popup',
  standalone: true,
  imports: [CommonModule, forwardRef(() => HelpTopicComponent), jqxPopoverModule, jqxWindowModule],
  templateUrl: './help-topic-popup.component.html',
  styleUrl: './help-topic-popup.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpPopupTopicComponent implements AfterViewInit {
  @Input({ required: true }) name!: string;
  @ViewChild('link') link!: ElementRef<HTMLSpanElement>;
  @ViewChild('popup') popup!: ElementRef<HTMLDivElement>;

  // Render lazily to break cycle in component dependencies.
  renderPopup: boolean = false;

  constructor(private readonly changeDetector: ChangeDetectorRef) {}

  openPopup(event: MouseEvent): void {
    let left = 2;
    const helpPaneRect = document.querySelector('.pane-content')!.getBoundingClientRect();
    const linkRect = this.link.nativeElement.parentElement!.getBoundingClientRect();
    const openPopup = document.querySelector('.open-popup') as HTMLElement;
    const popupWidth = 640;
    if (!this.isPopupDescendent) {
      this.hidePopup(openPopup);
    }
    if (linkRect.left + popupWidth > helpPaneRect.right) {
      left -= linkRect.left + popupWidth - helpPaneRect.right;
    }
    if (!this.popup) {
      this.renderPopup = true;
      // TODO: Better way to accomplish this?
      // First evaluates the ngIf body. Second renders the template.
      this.changeDetector.detectChanges();
      this.changeDetector.detectChanges();
    }
    const popupElement = this.popup.nativeElement;
    const style = popupElement.style;
    style.display = 'block';
    style.left = `${left}px`;
    popupElement.classList.add('open-popup');
    popupElement.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
    event.stopPropagation();
  }

  /** Returns whether this popip is a descendant of some other. */
  private get isPopupDescendent(): boolean {
    for (let p = this.link.nativeElement.parentElement; p; p = p.parentElement) {
      if (p.classList.contains('popup-container')) {
        return true;
      }
    }
    return false;
  }

  private hidePopup(element: HTMLElement | undefined | null): void {
    if (!element) {
      return;
    }
    element.classList.remove('open-popup');
    element.style.display = 'none';
  }

  ngAfterViewInit(): void {
    ['pointerdown', 'keydown'].forEach(eventName =>
      document.addEventListener(eventName, _event => {
        this.hidePopup(this.popup?.nativeElement);
      }),
    );
  }
}
