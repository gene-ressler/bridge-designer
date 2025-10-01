import { jqxDropDownListComponent } from 'jqwidgets-ng/jqxdropdownlist';

export const enum StandardCursor {
  ARROW = 'default',
  AUTO = 'auto',
  CROSSHAIR = 'crosshair',
  HAND = 'pointer',
  HORIZONTAL_MOVE = 'ew-resize',
  MOVE = 'move',
  VERTICAL_MOVE = 'ns-resize',
}

export interface CustomCursor {
  cursor: string;
  orgX?: number;
  orgY?: number;
}

/** Static helpers for jqwidgets. */
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

  public static setPointerCursor(ctx: CanvasRenderingContext2D, cursor?: CustomCursor | StandardCursor): void {
    if (cursor === undefined) {
      ctx.canvas.style.cursor = 'none';
      return;
    }
    ctx.canvas.style.cursor =
      typeof cursor === 'string' ? cursor : `url(${cursor.cursor}) ${cursor.orgX} ${cursor.orgY}, auto`;
  }

  /**
   * Mitigates a quirk in dropdown list API: if nothing selected, it returns index -1,
   * but selecting index -1 does not clear the list.
   */
  public static setDropdownListSelection(list: jqxDropDownListComponent, index: number): void {
    if (index < 0) {
      list.clearSelection();
      return;
    }
    list.selectedIndex(index);
  }

  private static addButtonImg(imgSrc: string, title: string, tool: any) {
    let img = document.createElement('img');
    img.src = imgSrc;
    img.title = title;
    tool[0].appendChild(img);
  }
}
