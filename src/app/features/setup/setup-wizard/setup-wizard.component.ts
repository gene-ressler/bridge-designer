import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { jqxButtonComponent, jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';
import { jqxInputComponent, jqxInputModule } from 'jqwidgets-ng/jqxinput';
import { jqxRadioButtonComponent, jqxRadioButtonModule } from 'jqwidgets-ng/jqxradiobutton';
import { jqxRadioButtonGroupComponent, jqxRadioButtonGroupModule } from 'jqwidgets-ng/jqxradiobuttongroup';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { EventBrokerService } from '../../../shared/services/event-broker.service';

const enum BumpDirection {
  UP = 1,
  DOWN = -1,
  TO = 2,
}

@Component({
  selector: 'setup-wizard',
  standalone: true,
  imports: [jqxButtonModule, jqxInputModule, jqxRadioButtonModule, jqxWindowModule],
  templateUrl: './setup-wizard.component.html',
  styleUrl: './setup-wizard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetupWizardComponent implements AfterViewInit {
  private static readonly CARD_COUNT = 7;

  readonly edition = 'Cloud edition';
  readonly buttonWidth = 80;

  private cardIndex: number = 0;
  private cardElements: NodeListOf<HTMLElement>[] = new Array<NodeListOf<HTMLElement>>(SetupWizardComponent.CARD_COUNT);

  @ViewChild('backButton') backButton!: jqxButtonComponent;
  @ViewChild('content') content!: ElementRef<HTMLDivElement>;
  @ViewChild('dialog') dialog!: jqxWindowComponent;
  @ViewChild('elevationCanvas') elevationCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('finishButton') finishButton!: jqxButtonComponent;
  @ViewChild('localContestCodeInput') localContestCodeInput!: ElementRef<HTMLInputElement>;
  @ViewChild('nextButton') nextButton!: jqxButtonComponent;

  constructor(private readonly eventBrokerService: EventBrokerService) {}

  private setCardDisplay(index: number, value: string = ''): void {
    this.cardElements[index].forEach(element => (element.style.display = value));
  }

  private bumpCard(direction: BumpDirection, toIndex: number = 0): void {
    const newCardIndex = direction == BumpDirection.TO ? toIndex : this.cardIndex + direction;
    if (newCardIndex < 0 || newCardIndex >= this.cardElements.length) {
      return;
    }
    this.setCardDisplay(this.cardIndex, 'none');
    this.setCardDisplay(newCardIndex);
    this.backButton.disabled(newCardIndex == 0);
    this.nextButton.disabled(newCardIndex == SetupWizardComponent.CARD_COUNT - 1);
    this.cardIndex = newCardIndex;
  }

  helpButtonOnClickHandler(): void {
    window.open('https://google.com', '_blank', 'location=yes,height=570,width=520,scrollbars=yes,status=yes');
  }

  backButtonOnClickHandler(): void {
    this.bumpCard(BumpDirection.DOWN);
  }

  nextButtonOnClickHandler(): void {
    this.bumpCard(BumpDirection.UP);
  }

  finishButtonOnClickHandler(): void {
    this.dialog.close();
  }

  localContestRadioYesHandler(event: any) {
    this.localContestCodeInput.nativeElement.disabled = !event.args.checked;
  }

  ngAfterViewInit(): void {
    this.eventBrokerService.newDesignRequest.subscribe(_info => this.dialog.open());
    // Find all the elements associated with cards and hide all but card-1.
    for (var i: number = 0; i < SetupWizardComponent.CARD_COUNT; ++i) {
      this.cardElements[i] = this.content.nativeElement.querySelectorAll(`.card-${i + 1}`);
      if (i !== this.cardIndex) {
        this.setCardDisplay(i, 'none');
      }
    }
  }
}
