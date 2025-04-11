import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { jqxListBoxModule } from 'jqwidgets-ng/jqxlistbox';
import { HELP_INDEX_DATA } from '../indexer/index-data';

@Component({
  selector: 'help-topic-list',
  imports: [jqxListBoxModule],
  templateUrl: './help-topic-list.component.html',
  styleUrl: './help-topic-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpTopicListComponent {
  @Output() readonly onSelect = new EventEmitter<string>();

  readonly source: any = HELP_INDEX_DATA;

  handleTopicSelect(event: any) {
    const topic: string = event.args.item.originalItem.id;
    this.onSelect.emit(topic);
  }
}
