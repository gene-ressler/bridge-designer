import { Injectable } from '@angular/core';
import { BridgeService } from '../../shared/services/bridge.service';
import { PersistenceService, SaveSet } from '../../shared/services/persistence.service';
import { EventBrokerService, EventOrigin } from '../../shared/services/event-broker.service';
import { ToastError } from '../toast/toast/toast-error';
import { SaveMarkService } from './save-mark.service';

const DEFAULT_NAME = 'MyBridge.bdc';
const PICKER_ID = 'bridge-design';
const PICKER_DIR = 'documents';
const PICKER_TYPES = [
  {
    description: 'Bridge design',
    accept: { 'text/plain': ['.bdc'] }, // TODO: change to application/octet-stream with obfuscation
  },
];

/** Interface for service supporting either experimental FileSystem API or old school upload/download. */
export interface SaveLoadService {
  /** Saves the current bridge file. If `forceGetFile` is true, prompts the user to select a file. */
  saveBridgeFile(forceGetFile: boolean, fileNameGetter: (value: string) => Promise<string>): Promise<void>;

  /** Loads a bridge file and processes its content. */
  loadBridgeFile(): Promise<void>;
}

/** File save/loader using long-available HTML download and upload features. Required e.g for Firefox. */
@Injectable()
export class LegacySaveLoadService implements SaveLoadService {
  constructor(
    private readonly bridgeService: BridgeService,
    private readonly eventBrokerService: EventBrokerService,
    private readonly persistenceService: PersistenceService,
    private readonly saveMarkService: SaveMarkService,
  ) {}

  public async saveBridgeFile(
    forceGetFile: boolean,
    fileNameGetter: (value: string) => Promise<string>,
  ): Promise<void> {
    let preferredName = this.saveMarkService.savedFileName ?? DEFAULT_NAME;
    if (forceGetFile || this.saveMarkService.savedFileName === undefined) {
      try {
        preferredName = await fileNameGetter(preferredName);
      } catch (error) {
        throw new ToastError('noError');
      }
    }
    const text = this.bridgeService.saveSetText;
    const blob = new Blob([text], { type: 'text/plain' });
    const anchorElement = window.document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    anchorElement.href = url;
    anchorElement.download = preferredName;
    document.body.appendChild(anchorElement);
    anchorElement.click();
    document.body.removeChild(anchorElement);
    window.URL.revokeObjectURL(anchorElement.href);
    this.saveMarkService.markDesignSaved(preferredName);
    this.eventBrokerService.toastRequest.next({ origin: EventOrigin.SERVICE, data: 'fileSaveSuccess' });
  }

  public async loadBridgeFile(): Promise<void> {
    const inputElement = window.document.createElement('input');
    inputElement.type = 'file';
    inputElement.accept = '.bdc';
    document.body.appendChild(inputElement);
    inputElement.addEventListener('change', event => {
      const file = (event.target as HTMLInputElement).files?.item(0);
      if (!file) {
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => {
        throw new ToastError('fileReadError');
      };
      reader.onload = () => {
        const text = reader.result as string;
        const saveSet = SaveSet.createNew();
        this.persistenceService.parseSaveSetText(text, saveSet);
        this.eventBrokerService.loadBridgeRequest.next({
          origin: EventOrigin.SERVICE,
          data: saveSet,
        });
        this.saveMarkService.markDesignSaved(file.name);
      };
      reader.readAsText(file);
    });
    inputElement.click();
    document.body.removeChild(inputElement);
  }
}

/** File save/loader using experimental (as of 2025) download and upload features. For Chromium-based browsers. */
@Injectable()
export class FileSystemSaveLoadService implements SaveLoadService {
  private currentFileHandle: FileSystemFileHandle | undefined;

  constructor(
    private readonly bridgeService: BridgeService,
    private readonly eventBrokerService: EventBrokerService,
    private readonly persistenceService: PersistenceService,
    private readonly saveMarkService: SaveMarkService,
  ) {}

  public async saveBridgeFile(forceGetFile: boolean = false): Promise<void> {
    try {
      if (forceGetFile || !this.currentFileHandle || this.saveMarkService.savedFileName === undefined) {
        this.currentFileHandle = await this.getSaveFile(this.saveMarkService.savedFileName ?? DEFAULT_NAME);
      }
      const stream = await this.currentFileHandle.createWritable();
      const text = this.bridgeService.saveSetText;
      await stream.write(text);
      await stream.close();
      this.saveMarkService.markDesignSaved(this.currentFileHandle.name);
      this.eventBrokerService.toastRequest.next({ origin: EventOrigin.SERVICE, data: 'fileSaveSuccess' });
    } catch (error) {
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

  private async doLoad(): Promise<string> {
    const options = {
      id: PICKER_ID,
      startIn: PICKER_DIR,
      types: PICKER_TYPES,
    };
    try {
      const [fileHandle]: FileSystemFileHandle[] = await (window as any).showOpenFilePicker(options);
      const file = await fileHandle.getFile();
      this.saveMarkService.markDesignSaved(file.name);
      return file.text();
    } catch (error) {
      throw new ToastError(this.isUserCancel(error) ? 'noError' : 'fileReadError');
    }
  }

  private isUserCancel(error: any): boolean {
    return error instanceof DOMException && error.name === 'AbortError';
  }

  private async getSaveFile(preferredName: string): Promise<FileSystemFileHandle> {
    const options = {
      id: PICKER_ID,
      startIn: PICKER_DIR,
      suggestedName: preferredName,
      types: PICKER_TYPES,
    };
    return await (window as any).showSaveFilePicker(options);
  }
}

/** Returns whether the file system API is present in the browser. */
export function isFileSystemAPIPresent(): boolean {
  return ['showSaveFilePicker', 'showOpenFilePicker'].every(f => f in window);
}

/** A provider spec for injecting the cool service if supported, else the legacy one. */
export const SAVE_LOAD_PROVIDER_SPEC = {
  provide: 'SaveLoadService',
  useClass: isFileSystemAPIPresent() ? FileSystemSaveLoadService : LegacySaveLoadService,
};
