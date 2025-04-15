import { Injectable } from '@angular/core';
import { BridgeService } from '../../shared/services/bridge.service';
import { PersistenceService, SaveSet } from '../../shared/services/persistence.service';
import { EventBrokerService, EventOrigin } from '../../shared/services/event-broker.service';
import { ToastError } from '../toast/toast/toast-error';

const DEFAULT_NAME = 'MyBridge.bdc';
const PICKER_ID = 'bridge-design';
const PICKER_DIR = 'documents';
const PICKER_TYPES = [
  {
    description: 'Bridge design',
    accept: { 'text/plain': ['.bdc'] }, // TODO: change to application/octet-stream with obfuscation
  },
];

@Injectable({ providedIn: 'root' })
export class SaveLoadService {
  // TODO: Dehydrate-rehydrate as much as possible. Probably preferred name and saved mark.
  private currentFileHandle: FileSystemFileHandle | undefined;
  private preferredName: string = DEFAULT_NAME;

  constructor(
    private readonly bridgeService: BridgeService,
    private readonly eventBrokerService: EventBrokerService,
    private readonly persistenceService: PersistenceService,
  ) {}

  public async saveBridgeFile(forceGetFile: boolean = false): Promise<void> {
    try {
      if (forceGetFile || !this.currentFileHandle) {
        this.currentFileHandle = await this.getSaveFile();
        const file = await this.currentFileHandle.getFile();
        this.preferredNameAndWindowTitle = file.name;
      }
      const stream = await this.currentFileHandle!.createWritable();
      const text = this.bridgeService.saveSetText;
      await stream.write(text);
      await stream.close();
      this.eventBrokerService.toastRequest.next({ origin: EventOrigin.SERVICE, data: 'fileSaveSuccess' });
    } catch (error) {
      console.log('save:', error);
      throw new ToastError(this.isUserCancel(error) ? 'noError' : 'fileWriteError');
    }
  }

  public async loadBridgeFile(): Promise<void> {
    const text = await this.doLoad();
    const saveSet = SaveSet.createNew();
    this.persistenceService.parseSaveSetText(text, saveSet);
    this.eventBrokerService.loadBridgeRequest.next({
      origin: EventOrigin.SERVICE,
      data: saveSet,
    });
  }

  private set preferredNameAndWindowTitle(fileName: string) {
    this.preferredName = fileName;
    document.title = fileName;
  }

  private async doLoad(): Promise<string> {
    const options = {
      id: PICKER_ID,
      startIn: PICKER_DIR,
      types: PICKER_TYPES,
    };
    try {
      const [fileHandle]: FileSystemFileHandle[] = await (window as any).showOpenFilePicker(options);
      const file = await fileHandle.getFile();
      this.preferredNameAndWindowTitle = file.name;
      return file.text();
    } catch (error) {
      console.log('load:', error);
      throw new ToastError(this.isUserCancel(error) ? 'noError' : 'fileReadError');
    }
  }

  private isUserCancel(error: any): boolean {
    return error instanceof DOMException && error.name === 'AbortError';
  }

  private async getSaveFile(): Promise<FileSystemFileHandle> {
    const options = {
      id: PICKER_ID,
      startIn: PICKER_DIR,
      suggestedName: this.preferredName,
      types: PICKER_TYPES,
    };
    return await (window as any).showSaveFilePicker(options);
  }
}
