import { Subject } from 'rxjs';
import { EventInfo, EventOrigin } from '../services/event-broker.service';

export class WidgetHelper {
  public static initToolbarImgButton(title: string, imgSrc: string, tool: any, isDisabled: boolean = false) {
    WidgetHelper.addButtonImg(imgSrc, title, tool);
    tool.jqxButton({ height: 28, disabled: isDisabled });
  }

  public static initToolbarImgToggleButton(title: string, imgSrc: string, tool: any, isDisabled: boolean = false) {
    WidgetHelper.addButtonImg(imgSrc, title, tool);
    tool.jqxToggleButton({ height: 28, disabled: isDisabled });
  }

  public static sendEventOnClick(subject: Subject<EventInfo>, tool: any, data?: any) {
    tool.on('click', () =>
      subject.next({
        source: EventOrigin.TOOLBAR,
        data: typeof data === 'function' ? data() : data,
      }),
    );
  }

  private static addButtonImg(imgSrc: string, title: string, tool: any) {
    let img = document.createElement('img');
    img.src = imgSrc;
    img.title = title;
    tool[0].appendChild(img);
  }
}
