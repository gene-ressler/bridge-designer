import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  forwardRef,
  HostListener,
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
export class HelpPopupTopicComponent {
  @Input({ required: true }) name!: string;
  @ViewChild('link') link!: ElementRef<HTMLSpanElement>;
  @ViewChild('popup') popup!: ElementRef<HTMLDivElement>;

  // Render lazily to break cycle in component dependencies.
  renderPopup: boolean = false;

  constructor(private readonly changeDetector: ChangeDetectorRef) {}

  togglePopup(event: MouseEvent): void {
    if (this.isPopupVisible) {
      this.hidePopup(this.popup.nativeElement);
    } else {
      this.showPopup();
    }
    event.stopPropagation();
  }

  private get isPopupVisible(): boolean {
    return this.popup !== undefined && this.popup.nativeElement.style.display !== 'none';
  }

  private hidePopup(element: HTMLElement | undefined | null): void {
    if (element) {
      element.style.display = 'none';
    }
  }

  private showPopup(): void {
    const helpPaneRect = document.querySelector('.pane-content')!.getBoundingClientRect();
    const linkRect = this.link.nativeElement.parentElement!.getBoundingClientRect();
    // Determine the x-axis position so popup is entirely visible.
    const popupWidth = 640;
    let left = 2;
    if (linkRect.left + popupWidth > helpPaneRect.right) {
      left -= linkRect.left + popupWidth - helpPaneRect.right;
    }
    // Render content if not already done.
    if (!this.popup) {
      this.renderPopup = true;
      // TODO: Better way to accomplish this?
      // First evaluates the ngIf body to bind all templates. Second renders one of them.
      this.changeDetector.detectChanges();
      this.changeDetector.detectChanges();
    }
    // Close extraneous existing popups.
    const popupElement = this.popup.nativeElement;
    this.pruneVisiblesPopups(popupElement);
    // Make this one visible.
    const style = popupElement.style;
    style.display = 'block';
    style.left = `${left}px`;
    popupElement.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  }

  /** Hides all popups that aren't on the path from the given leaf popup up to the root help topic. */
  private pruneVisiblesPopups(leaf: HTMLDivElement): void {
    const popupAncestorPath = new Set<Element>();
    let root: HTMLElement | null = leaf;
    while (root && !root.classList.contains('pane-content')) {
      if (root.classList.contains('popup')) {
        popupAncestorPath.add(root);
      }
      root = root.parentElement;
    }
    const walk = (element: Element): void => {
      if (element.classList.contains('popup') && !popupAncestorPath.has(element)) {
        this.hidePopup(element as HTMLElement);
      }
      const children = element.children;
      for (let i = 0; i < children.length; ++i) {
        walk(children.item(i)!);
      }
    };
    if (root) {
      walk(root);
    }
  }

  @HostListener('document:pointerdown')
  @HostListener('document:keydown')
  onPointerOrKeyDown(): void {
    this.hidePopup(this.popup?.nativeElement);
  }
}
