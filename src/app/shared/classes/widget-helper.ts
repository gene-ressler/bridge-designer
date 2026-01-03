/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { ViewContainerRef } from '@angular/core';
import { jqxDropDownListComponent } from 'jqwidgets-ng/jqxdropdownlist';
import { jqxSliderComponent } from 'jqwidgets-ng/jqxslider';

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
    options?: { toggled?: boolean; disabled?: boolean; height?: number },
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

  public static updateToolbarButtonImg(buttonTool: any, imgSrc: string, title?: string) {
    const img = buttonTool.tool[0].firstChild;
    img.src = imgSrc;
    if (title) {
      img.title = title;
    }
  }

  public static setUpSlider(
    containerRef: ViewContainerRef,
    inputs: { [key: string]: any },
    onChange: (event?: any) => void,
  ): jqxSliderComponent {
    const sliderRef = containerRef.createComponent(jqxSliderComponent);
    for (const [key, value] of Object.entries(inputs)) {
      sliderRef.setInput(key, value);
    }
    sliderRef.instance.onChange.subscribe(onChange);
    sliderRef.changeDetectorRef.detectChanges();
    return sliderRef.instance;
  }

  private static addButtonImg(imgSrc: string, title: string, tool: any) {
    let img = document.createElement('img');
    img.src = imgSrc;
    img.title = title;
    tool[0].appendChild(img);
  }
}
