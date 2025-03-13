import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { jqxTreeComponent, jqxTreeModule } from 'jqwidgets-ng/jqxtree';
import { HelpDialogComponent } from '../help-dialog/help-dialog.component';

@Component({
  selector: 'help-nav-tree',
  standalone: true,
  imports: [jqxTreeModule],
  templateUrl: './help-nav-tree.component.html',
  styleUrl: './help-nav-tree.component.scss',
})
export class HelpNavTreeComponent implements AfterViewInit, OnChanges {
  @ViewChild('navTree') navTree!: jqxTreeComponent;

  @Input() selectedTopicName: string = HelpDialogComponent.DEFAULT_TOPIC_ID;
  @Output() selectedTopicNameChange = new EventEmitter<string>();

  handleSelect(event: any) {
    const newSelectedTopicName = event.args.element.id;
    if (newSelectedTopicName === this.selectedTopicName) {
      return;
    }
    this.selectedTopicName = newSelectedTopicName;
    this.selectedTopicNameChange.emit(newSelectedTopicName);
  }

  getTopicItem(topicId: string): Element | null {
    return document.getElementById(topicId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.navTree) {
      return;
    }
    const item = this.getTopicItem(changes['selectedTopicName'].currentValue);
    this.navTree.selectItem(item);
  }

  ngAfterViewInit(): void {
    const openFolders: NodeList = this.navTree.elementRef.nativeElement.querySelectorAll('li.open');
    openFolders.forEach(folder => this.navTree.expandItem(folder));
  }
}
