import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  HostListener,
  Input,
  ViewChild,
} from '@angular/core';
import { jqxListBoxComponent, jqxListBoxModule } from 'jqwidgets-ng/jqxlistbox';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { Subject } from 'rxjs';
import { Deque } from '../../../shared/core/deque';
import { EditCommand } from '../../../shared/classes/editing';
import {
  EventInfo,
  EventOrigin,
} from '../../../shared/services/event-broker.service';

@Component({
  selector: 'undo-redo-dropdown',
  standalone: true,
  imports: [jqxListBoxModule, jqxWindowModule],
  templateUrl: './undo-redo-dropdown.component.html',
  styleUrl: './undo-redo-dropdown.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UndoRedoDropdownComponent implements AfterViewInit {
  private static readonly CANCEL_ITEM: EditCommand = new EditCommand('Cancel');

  @Input({ required: true }) operation!: string;
  @Input({ required: true }) actionEmitter!: Subject<EventInfo>;
  @ViewChild('dropdown', { static: true }) dropdown!: jqxWindowComponent;
  @ViewChild('listBox', { static: true }) listBox!: jqxListBoxComponent;

  private commandBuffer: Deque<EditCommand> | undefined;
  commandList: EditCommand[] = [];
  toolbarButton: any;

  public static appendDropdownTool(tool: any): any {
    tool.append('<div></div>');
    return tool.children()[1];
  }

  public initialize(toolbarButton: any, commandBuffer: Deque<EditCommand>) {
    this.commandBuffer = commandBuffer;
    this.toolbarButton = toolbarButton;
    toolbarButton.on('click', (_event: any) => {
      if (toolbarButton.jqxToggleButton('toggled')) {
        const bounds: DOMRect = toolbarButton[0].getBoundingClientRect();
        this.dropdown.move(bounds.left, bounds.bottom);
        this.dropdown.open();
        this.listBox.focus();
      } else {
        this.dropdown.close();
      }
    });
    // Don't let the global mousedown handler confuse the toggle button logic.
    toolbarButton.on('mousedown', (event: MouseEvent) => {
      if (toolbarButton.jqxToggleButton('toggled')) {
        event.stopPropagation();
      }
    });
  }

  handleDropdownOpen(_event: any) {
    if (!this.commandBuffer) {
      throw new Error('Dropdown not initialized.');
    }
    this.commandBuffer.copyTo(this.commandList, 10);
    this.commandList.push(UndoRedoDropdownComponent.CANCEL_ITEM);
    this.listBox.source(this.commandList);
    this.listBox.refresh();
    const listBounds: DOMRect =
      this.listBox.elementRef.nativeElement.getBoundingClientRect();
    this.dropdown.height(listBounds.height);
    // Monkeypatch jqxListBox to handle mouseover on items.
    const listBoxElement: HTMLElement = this.listBox.elementRef.nativeElement;
    listBoxElement
      .querySelectorAll('jqxlistbox .jqx-listitem-element')
      .forEach((item: Element, index: number) =>
        item.addEventListener('mouseover', () =>
          this.handleMouseoverItem(index)
        )
      );
  }

  handleDropdownClose(_event: any) {
    this.toolbarButton.jqxToggleButton('toggled', false);
    // Remove content so it doesn't render briefly before open 
    // handler replaces it. One item avoids item width weirdness.
    this.listBox.source([UndoRedoDropdownComponent.CANCEL_ITEM]);
    this.listBox.refresh();
  }

  selectHandler(event: any) {
    if (event.args.type === 'mouse' || event.args.type === 'key') {
      const index = event.args.index;
      this.listBox.unselectIndex(index);
      this.dropdown.close();
      const actionCount = index + 1;
      if (actionCount < this.commandList.length) {
        // Exclude "cancel" item.
        this.actionEmitter.next({
          source: EventOrigin.TOOLBAR,
          data: actionCount,
        });
      }
    }
  }

  handleMouseoverItem(index: number) {
    const toastIndex = this.commandList.length - 1;
    const prompt =
      index < toastIndex
        ? `${this.operation} ${index + 1} command${index == 0 ? '' : 's'}`
        : 'Cancel';
    this.listBox.updateAt({ label: prompt }, toastIndex);
  }

  @HostListener('document:mousedown', ['$event'])
  onMouseDown(_event: MouseEvent) {
    this.dropdown.close();
  }

  ngAfterViewInit(): void {
    // Monkeypatch jqxWindow to hide the header.
    const headerElement =
      this.listBox.elementRef.nativeElement?.previousSibling;
    if (headerElement) {
      headerElement.style.display = 'none';
    }
  }
}
