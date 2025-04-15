import { AfterViewInit, ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import {
  ButtonTag,
  ConfirmationDialogComponent,
} from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { SaveLoadService } from '../save-load.service';
import { EventBrokerService } from '../../../shared/services/event-broker.service';
import { SaveMarkService } from '../save-mark.service';

@Component({
  selector: 'design-saver-loader',
  imports: [ConfirmationDialogComponent],
  templateUrl: './design-saver-loader.component.html',
  styleUrl: './design-saver-loader.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesignSaverLoaderComponent implements AfterViewInit {
  @ViewChild('saveBeforeLoadConfirmationDialog') saveBeforeLoadConfirmationDialog!: ConfirmationDialogComponent;

  constructor(
    private readonly eventBrokerService: EventBrokerService,
    private readonly saveLoadService: SaveLoadService,
    private readonly saveMarkService: SaveMarkService,
  ) {}

  public async loadBridgeFileSafely(): Promise<void> {
    if (this.saveMarkService.isUnsaved) {
      this.saveBeforeLoadConfirmationDialog.open();
    } else {
      await this.saveLoadService.loadBridgeFile();
    }
  }

  async handleConfirmationButtonClick(button: ButtonTag): Promise<void> {
    switch (button) {
      case 'yes':
        await this.saveLoadService.saveBridgeFile();
        break;
      case 'no':
        break;
      case 'cancel':
        return;
    }
    await this.saveLoadService.loadBridgeFile();
  }

  ngAfterViewInit(): void {
    this.eventBrokerService.saveBridgeFileRequest.subscribe(eventInfo => this.saveLoadService.saveBridgeFile(eventInfo.data));
    this.eventBrokerService.loadBridgeFileRequest.subscribe(_eventInfo => this.loadBridgeFileSafely());
  }
}
