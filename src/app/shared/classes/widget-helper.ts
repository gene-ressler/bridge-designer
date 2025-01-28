export const enum StandardCursor {
  ARROW = 'default',
  AUTO = 'auto',
  CROSSHAIR = 'crosshair',
  HAND = 'pointer',
  HORIZONTAL_MOVE = 'ew-resize',
  MOVE = 'move',
  VERTICAL_MOVE = 'ns-resize',
}

export class WidgetHelper {
  public static initToolbarImgButton(title: string, imgSrc: string, tool: any, isDisabled: boolean = false) {
    WidgetHelper.addButtonImg(imgSrc, title, tool);
    tool.jqxButton({ height: 28, disabled: isDisabled });
  }

  public static initToolbarImgToggleButton(
    title: string,
    imgSrc: string,
    tool: any,
    options?: { toggled?: boolean; disabled?: boolean },
  ) {
    WidgetHelper.addButtonImg(imgSrc, title, tool);
    tool.jqxToggleButton({ height: 28, ...options });
  }

  public static setPointerCursor(
    ctx: CanvasRenderingContext2D,
    cursor?: string | StandardCursor,
    orgX: number = 0,
    orgY: number = 0,
  ): void {
    if (cursor === undefined) {
      ctx.canvas.style.cursor = 'none';
      return;
    }
    ctx.canvas.style.cursor = cursor.startsWith('img/') ? `url(${cursor}) ${orgX} ${orgY}, auto` : cursor;
  }

  public static getPointerCursor(ctx: CanvasRenderingContext2D): string {
    return ctx.canvas.style.cursor;
  }

  /* Replaced by uistate service.
  public static sendEventOnToolbarClick(subject: Subject<EventInfo>, tool: any, data?: any) {
    tool.on('click', () =>
      subject.next({
        source: EventOrigin.TOOLBAR,
        data: typeof data === 'function' ? data() : data,
      }),
    );
  }*/

  private static addButtonImg(imgSrc: string, title: string, tool: any) {
    let img = document.createElement('img');
    img.src = imgSrc;
    img.title = title;
    tool[0].appendChild(img);
  }
}
