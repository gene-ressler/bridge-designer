import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild, ViewContainerRef } from '@angular/core';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';
import { jqxSliderComponent, jqxSliderModule } from 'jqwidgets-ng/jqxslider';
import { jqxCheckBoxComponent, jqxCheckBoxModule } from 'jqwidgets-ng/jqxcheckbox';
import { jqxExpanderModule } from 'jqwidgets-ng/jqxexpander';
import { SessionStateService } from '../../../shared/services/session-state.service';
import { FlyThruSettings } from '../rendering/fly-thru-settings.service';

@Component({
  selector: 'fly-thru-settings-dialog',
  imports: [jqxCheckBoxModule, jqxSliderModule, jqxWindowModule, jqxExpanderModule],
  templateUrl: './fly-thru-settings-dialog.component.html',
  styleUrl: './fly-thru-settings-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlyThruSettingsDialogComponent implements AfterViewInit {
  @ViewChild('dialog') dialog!: jqxWindowComponent;
  @ViewChild('speedSliderContainer', { read: ViewContainerRef, static: true }) speedSliderContainer!: ViewContainerRef;
  @ViewChild('brightnessSliderContainer', { read: ViewContainerRef, static: true })
  brightnessSliderContainer!: ViewContainerRef;
  @ViewChild('shadowsCheckbox') shadowsCheckbox!: jqxCheckBoxComponent;
  @ViewChild('skyCheckbox') skyCheckbox!: jqxCheckBoxComponent;
  @ViewChild('terrainCheckbox') terrainCheckbox!: jqxCheckBoxComponent;
  @ViewChild('abutmentsCheckbox') abutmentsCheckbox!: jqxCheckBoxComponent;
  @ViewChild('truckCheckbox') truckCheckbox!: jqxCheckBoxComponent;
  @ViewChild('memberColorsCheckbox') memberColorsCheckbox!: jqxCheckBoxComponent;
  @ViewChild('exaggerationCheckbox') exaggerationCheckbox!: jqxCheckBoxComponent;
  @ViewChild('windTurbineCheckbox') windTurbineCheckbox!: jqxCheckBoxComponent;
  private speedSlider: number | jqxSliderComponent = 30;
  private brightnessSlider: number | jqxSliderComponent = 100;

  checkboxWidth: number = 120;
  checkboxHeight: number = 20;
  speed: number = 0;

  constructor(
     private readonly changeDetector: ChangeDetectorRef,
    private readonly eventBrokerService: EventBrokerService,
    private readonly sessionStateService: SessionStateService,
  ) {
    // jqWidgets provides this of initContent to the jqxWindow component!
    this.initDialogContent = this.initDialogContent.bind(this);
  }

  open() {
    this.dialog.open();
  }

  ngAfterViewInit(): void {
    this.eventBrokerService.flyThruSettingsRequest.subscribe(() => this.open());
    this.sessionStateService.register(
      'flythrusettings.component',
      () => this.dehydrate(),
      state => this.rehydrate(state),
    );
  }

  /** Works around heinous bug in jqxSlider. Can't be declared in HTML. Create dynamically. */
  initDialogContent(): void {
    // Work around heinous bug in jqWidgets. Can't declare sliders in html :-(
    this.speedSlider = FlyThruSettingsDialogComponent.setUpSlider(
      this.speedSliderContainer,
      {
        height: 50,
        max: 50,
        min: 10,
        mode: 'fixed',
        step: 5,
        showTicks: false,
        value: this.speedSlider,
        width: 240,
      },
      () => this.handleSpeedSliderChange(),
    );
    this.brightnessSlider = FlyThruSettingsDialogComponent.setUpSlider(
      this.brightnessSliderContainer,
      {
        height: 120,
        max: 100,
        min: 0,
        mode: 'fixed',
        orientation: 'vertical',
        showButtons: false,
        step: 10,
        showTicks: false,
        tooltip: false,
        value: this.brightnessSlider,
        width: 50,
      },
      () => this.handleBrightnessSliderChange(),
    );
  }

  private static setUpSlider(
    containerRef: ViewContainerRef,
    inputs: { [key: string]: any },
    onChange: () => void,
  ): jqxSliderComponent {
    const sliderRef = containerRef.createComponent(jqxSliderComponent);
    for (const [key, value] of Object.entries(inputs)) {
      sliderRef.setInput(key, value);
    }
    sliderRef.instance.onChange.subscribe(onChange);
    sliderRef.changeDetectorRef.detectChanges();
    return sliderRef.instance;
  }

  handleSpeedSliderChange(): void {
    this.speed = typeof this.speedSlider === 'object' ? this.speedSlider.getValue() : this.speedSlider;
    this.notifySettingsChange({
      speed: this.speed,
    });
    this.changeDetector.detectChanges();
  }

  handleBrightnessSliderChange(): void {
    this.notifySettingsChange({
      brightness: typeof this.brightnessSlider === 'object' ? this.brightnessSlider.getValue() : this.brightnessSlider,
    });
  }

  handleShadowsCheckboxChange(): void {
    this.notifySettingsChange({ noShadows: !this.shadowsCheckbox.checked()! });
  }

  handleSkyCheckboxChange(): void {
    this.notifySettingsChange({ noSky: !this.skyCheckbox.checked()! });
  }

  handleTerrainCheckboxChange(): void {
    this.notifySettingsChange({ noTerrain: !this.terrainCheckbox.checked()! });
  }

  handleAbutmentsCheckboxChange(): void {
    this.notifySettingsChange({ noAbutments: !this.abutmentsCheckbox.checked()! });
  }

  handleTruckCheckboxChange(): void {
    this.notifySettingsChange({ noTruck: !this.truckCheckbox.checked()! });
  }

  handleMemberColorsCheckbox(): void {
    this.notifySettingsChange({ noMemberColors: !this.memberColorsCheckbox.checked()! });
  }

  handleExaggerationCheckbox(): void {
    this.notifySettingsChange({ noExaggeration: !this.exaggerationCheckbox.checked()! });
  }

  handleWindTurbineCheckboxChange(): void {
    this.notifySettingsChange({ noWindTurbine: !this.exaggerationCheckbox.checked()! });
  }

  private notifySettingsChange(data: FlyThruSettings) {
    this.eventBrokerService.flyThruSettingsChange.next({
      origin: EventOrigin.FLY_THRU_SETTINGS_DIALOG,
      data,
    });
  }

  private dehydrate(): State {
    return {
      brightness: typeof this.brightnessSlider === 'object' ? this.brightnessSlider.getValue() : this.brightnessSlider,
      speed: typeof this.speedSlider === 'object' ? this.speedSlider.getValue() : this.speedSlider,
      abutments: this.abutmentsCheckbox.checked() === true,
      exaggeration: this.exaggerationCheckbox.checked() === true,
      memberColors: this.memberColorsCheckbox.checked() === true,
      shadows: this.shadowsCheckbox.checked() === true,
      sky: this.skyCheckbox.checked() === true,
      terrain: this.terrainCheckbox.checked() === true,
      truck: this.truckCheckbox.checked() === true,
      windTurbine: this.windTurbineCheckbox.checked() === true,
    };
  }

  private rehydrate(state: State): void {
    if (typeof this.brightnessSlider === 'object') {
      this.brightnessSlider.setValue(state.brightness);
    } else {
      this.brightnessSlider = state.brightness;
    }
    if (typeof this.speedSlider === 'object') {
      this.speedSlider.setValue(state.speed);
    } else {
      this.speedSlider = state.speed;
    }
    this.speed = state.speed;
    this.abutmentsCheckbox.checked(state.abutments);
    this.exaggerationCheckbox.checked(state.exaggeration);
    this.memberColorsCheckbox.checked(state.memberColors);
    this.shadowsCheckbox.checked(state.shadows);
    this.skyCheckbox.checked(state.sky);
    this.terrainCheckbox.checked(state.terrain);
    this.truckCheckbox.checked(state.truck);
    this.windTurbineCheckbox.checked(state.windTurbine);
  }
}

type State = {
  brightness: number;
  speed: number;
  abutments: boolean;
  exaggeration: boolean;
  memberColors: boolean;
  shadows: boolean;
  sky: boolean;
  terrain: boolean;
  truck: boolean;
  windTurbine: boolean;
};
