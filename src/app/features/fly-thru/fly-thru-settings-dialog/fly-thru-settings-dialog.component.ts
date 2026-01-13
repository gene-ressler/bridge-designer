/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';
import { jqxSliderComponent, jqxSliderModule } from 'jqwidgets-ng/jqxslider';
import { jqxCheckBoxComponent, jqxCheckBoxModule } from 'jqwidgets-ng/jqxcheckbox';
import { jqxExpanderModule } from 'jqwidgets-ng/jqxexpander';
import { SessionStateService } from '../../session-state/session-state.service';
import { DEFAULT_FLY_THRU_SETTINGS, FlyThruSettings } from '../rendering/fly-thru-settings.service';
import { UiStateService } from '../../controls/management/ui-state.service';
import { WidgetHelper } from '../../../shared/classes/widget-helper';

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
  private brightnessSlider: number | jqxSliderComponent = 50;
  /** Whether a close event being handled was a user click on the close icon (otherwise a programmatic close). */
  private isUserClose: boolean = true;
  /** Tracked value of the animation controls toggle. Needed for hiding/unhiding the dialog as UI state changes. */
  private isVisible: boolean = false;

  dialogWidth: number = 210;
  dialogHeight: number = 270;
  checkboxWidth: number = 120;
  checkboxHeight: number = 20;
  settings = DEFAULT_FLY_THRU_SETTINGS;
  speed = DEFAULT_FLY_THRU_SETTINGS.speed;

  constructor(
    private readonly changeDetector: ChangeDetectorRef,
    private readonly eventBrokerService: EventBrokerService,
    private readonly sessionStateService: SessionStateService,
    private readonly uiStateService: UiStateService,
  ) {
    // jqWidgets provides the wrong "this" (of initContent to the jqxWindow component)!
    this.initDialogContent = this.initDialogContent.bind(this);
  }

  /** Works around heinous bug in jqxSlider: can't be declared in HTML if parent isn't visible. Create dynamically. */
  initDialogContent(): void {
    // Work around heinous bug in jqWidgets. Can't declare sliders in html :-(
    this.speedSlider = WidgetHelper.setUpSlider(
      this.speedSliderContainer,
      {
        height: 44,
        width: 190,
        max: 50,
        min: 10,
        mode: 'fixed',
        step: 5,
        showTicks: false,
        template: 'primary',
        value: this.speedSlider,
      },
      () => this.handleSpeedSliderChange(),
    );
    this.brightnessSlider = WidgetHelper.setUpSlider(
      this.brightnessSliderContainer,
      {
        height: 140,
        width: 30,
        max: 100,
        min: 0,
        mode: 'fixed',
        orientation: 'vertical',
        step: 10,
        showTicks: false,
        tooltip: false,
        value: this.brightnessSlider,
      },
      () => this.handleBrightnessSliderChange(),
    );
  }

  handleDialogClose(): void {
    // Only handle clicks on dialog close button, not programmatic closings.
    // (Nothing in the close event says where it came from.)
    if (!this.isUserClose) {
      return;
    }
    this.eventBrokerService.animationControlsToggle.next({
      origin: EventOrigin.FLY_THRU_SETTINGS_DIALOG,
      data: false,
    });
  }

  handleAbutmentsCheckboxChange(): void {
    this.notifySettingsChange({ noAbutments: !this.abutmentsCheckbox.checked()! });
  }

  handleBrightnessSliderChange(): void {
    this.notifySettingsChange({
      brightness: typeof this.brightnessSlider === 'object' ? this.brightnessSlider.getValue() : this.brightnessSlider,
    });
  }

  handleExaggerationCheckbox(): void {
    this.notifySettingsChange({ noExaggeration: !this.exaggerationCheckbox.checked()! });
  }

  handleMemberColorsCheckbox(): void {
    this.notifySettingsChange({ noMemberColors: !this.memberColorsCheckbox.checked()! });
  }

  handleShadowsCheckboxChange(): void {
    this.notifySettingsChange({ noShadows: !this.shadowsCheckbox.checked()! });
  }

  handleSkyCheckboxChange(): void {
    this.notifySettingsChange({ noSky: !this.skyCheckbox.checked()! });
  }

  handleSpeedSliderChange(): void {
    this.speed = typeof this.speedSlider === 'object' ? this.speedSlider.getValue() : this.speedSlider;
    this.notifySettingsChange({
      speed: this.speed,
    });
    this.changeDetector.detectChanges();
  }

  handleTerrainCheckboxChange(): void {
    this.notifySettingsChange({ noTerrain: !this.terrainCheckbox.checked()! });
  }

  handleTruckCheckboxChange(): void {
    this.notifySettingsChange({ noTruck: !this.truckCheckbox.checked()! });
  }

  handleWindTurbineCheckboxChange(): void {
    this.notifySettingsChange({ noWindTurbine: !this.windTurbineCheckbox.checked()! });
  }

  /** Sync notified settings wtih current control widget state.  */
  private syncSettings(): void {
    this.handleAbutmentsCheckboxChange();
    this.handleBrightnessSliderChange();
    this.handleExaggerationCheckbox();
    this.handleMemberColorsCheckbox();
    this.handleShadowsCheckboxChange();
    this.handleSkyCheckboxChange();
    this.handleSpeedSliderChange();
    this.handleTerrainCheckboxChange();
    this.handleTruckCheckboxChange();
    this.handleWindTurbineCheckboxChange();
  }

  /** Opens the dialog with custom position logic, as jqxWindow does't offer what we need. */
  private open(): void {
    // Clear event queue so flyThruPane is certain to be visible.
    setTimeout(() => {
      const position = this.dialog.position();
      let flyThruPane: HTMLElement = this.dialog.elementRef.nativeElement?.parentElement?.parentElement;
      if (!flyThruPane?.offsetWidth) {
        return;
      }
      const x = flyThruPane.offsetLeft + 0.5 * (flyThruPane.offsetWidth - this.dialogWidth);
      const y = flyThruPane.offsetTop;
      // If this is initial positioning or old position is invalid due to resize...
      if (position[0] === 'center' || position[0] > x || position[1] > y) {
        this.dialog.position(`${x},${y}`);
        this.dialog.move(x, y);
      }
      this.dialog.open();
    });
  }

  /** Closes the dialog with bodge to prevent infinite recursion. See `handleDialogClose`. */
  private close(): void {
    this.isUserClose = false;
    this.dialog.close();
    this.isUserClose = true;
  }

  /** Opens or closes the dialog based on animation controls toggle and UI state. Optionally updates the tracked toggle state. */
  private openOrClose(isVisible: boolean = this.isVisible): void {
    this.isVisible = isVisible;
    if (!isVisible || this.uiStateService.isDisabledForCurrentUiMode(this.eventBrokerService.animationControlsToggle)) {
      this.close();
    } else {
      this.open();
    }
  }

  private notifySettingsChange(data: FlyThruSettings) {
    this.eventBrokerService.flyThruSettingsChange.next({
      origin: EventOrigin.FLY_THRU_SETTINGS_DIALOG,
      data,
    });
  }

  ngAfterViewInit(): void {
    this.eventBrokerService.animationControlsToggle.subscribe(eventInfo => this.openOrClose(eventInfo.data));
    this.eventBrokerService.uiModeChange.subscribe(() => this.openOrClose());
    this.sessionStateService.register(
      'flythrusettings.component',
      () => this.dehydrate(),
      state => this.rehydrate(state),
    );
    this.syncSettings();
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
