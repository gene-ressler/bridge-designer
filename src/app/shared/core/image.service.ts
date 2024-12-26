import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ImageService {
  /** 
   * Returns an images loader. The loader creates images from given URLs, which the browser fetches via
   * multiple threads. Any function accepting a url to image map can be called any number of times via
   * the loader. If the images have all been loaded, the call proceeds synchronously. Else it is queued
   * and executed by the `onload` handler of the final image received.
  */
  public createImagesLoader(urls: string[]): ImagesLoader {
    return new ImagesLoader(urls);
  }

  /** Draws one image from a sheet of same-sized frames arranged left-to-right. */
  public drawSheetImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement, index: number, sheetImageCount: number, x: number, y: number) {
    const w = image.width / sheetImageCount;
    ctx.drawImage(image, index * w, 0, w, image.height, x, y, w, image.height);
  }
}

export class ImagesLoader {
  private readonly images: Map<string, HTMLImageElement>;
  private readonly pendingActions: ((images: Map<string, HTMLImageElement>) => void)[] = [];
  public readonly errors: string[] = [];
  private remainingCount: number;

  constructor(urls: string[]) {
    this.remainingCount = urls.length;
    this.images = new Map<string, HTMLImageElement>(
      ((loader) => {
        return urls.map(url => {
          const image = new Image();
          image.onload = () => {
            // On last load, execute pending actions.
            if (--loader.remainingCount == 0) {
              loader.pendingActions.forEach(action => action(loader.images));
              loader.pendingActions.length = 0; // Not necessary, but nice.
            }
          }
          image.onerror = () => loader.errors.push(url);
          image.src = url;
          return [url, image];
        })
      })(this));
  }

  public invokeAfterLoaded(action: (images: Map<string, HTMLImageElement>) => void): void  {
    if (this.errors.length) {
      throw new Error(`Images load fail: ${this.errors}`);
    }
    if (this.remainingCount == 0) {
      action(this.images);
    } else {
      this.pendingActions.push(action);
    }
  }
}
