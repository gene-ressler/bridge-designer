import { AfterViewInit, ChangeDetectionStrategy, Component, Input, ViewChild } from '@angular/core';
import { jqxDropDownListComponent, jqxDropDownListModule } from 'jqwidgets-ng/jqxdropdownlist';
import { EventBrokerService, EventOrigin } from '../../services/event-broker.service';
import { InventoryService, StockId } from '../../services/inventory.service';
import { WidgetHelper } from '../../classes/widget-helper';
import { SessionStateService } from '../../services/session-state.service';
import { UiStateService } from '../../../features/controls/management/ui-state.service';

@Component({
    selector: 'inventory-selector',
    imports: [jqxDropDownListModule],
    templateUrl: './inventory-selector.component.html',
    styleUrl: './inventory-selector.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventorySelectorComponent implements AfterViewInit {
  @Input({ required: true }) vertical: boolean = false;
  @Input() eventOrigin: number = EventOrigin.TOOLBAR;
  @Input() sessionStateKey: string | undefined = 'inventorySelector.component';
  @ViewChild('materialSelector') materialSelector!: jqxDropDownListComponent;
  @ViewChild('crossSectionSelector') crossSectionSelector!: jqxDropDownListComponent;
  @ViewChild('sizeSelector') sizeSelector!: jqxDropDownListComponent;

  readonly height = 28;
  readonly materialSelectorWidth = 206;
  readonly initialSizeIndex = 22; // 200x200

  constructor(
    readonly inventoryService: InventoryService,
    private readonly eventBrokerService: EventBrokerService,
    private readonly sessionStateService: SessionStateService,
    private readonly uiStateService: UiStateService,
  ) {}

  public load(stockId: StockId) {
    WidgetHelper.setDropdownListSelection(this.materialSelector, stockId.materialIndex);
    WidgetHelper.setDropdownListSelection(this.crossSectionSelector, stockId.sectionIndex);
    WidgetHelper.setDropdownListSelection(this.sizeSelector, stockId.sizeIndex);
  }

  public disable(value: boolean) {
    this.materialSelector.disabled(value);
    this.crossSectionSelector.disabled(value);
    this.sizeSelector.disabled(value);
  }

  get crossSectionSelectorWidth(): number {
    return this.vertical ? 206 : 106;
  }

  get sizeSelectorWidth(): number {
    return this.vertical ? 206 : 106;
  }

  handleMaterialSelectorOnChange(event: any): void {
    if (event.args.type === 'none') {
      return;
    }
    this.sendStockId();
  }

  handleCrossSectionSelectorOnChange(event: any): void {
    this.sizeSelector.source(this.inventoryService.getShapes(event.args.index));
    if (event.args.type === 'none') {
      return;
    }
    this.sendStockId();
  }

  handleSizeSelectorOnChange(event: any): void {
    if (event.args.type === 'none') {
      return;
    }
    this.sendStockId();
  }

  private get stockId(): StockId {
    return new StockId(
      this.materialSelector.selectedIndex(),
      this.crossSectionSelector.selectedIndex(),
      this.sizeSelector.selectedIndex(),
    );
  }

  private sendStockId(): void {
    this.eventBrokerService.inventorySelectionChange.next({
      origin: this.eventOrigin,
      data: this.stockId,
    });
  }

  ngAfterViewInit(): void {
    this.sessionStateService.register(this.sessionStateKey, () => this.dehydrate(), state => this.rehydrate(state));
    this.eventBrokerService.loadInventorySelectorRequest.subscribe(eventInfo => this.load(eventInfo.data));
    this.uiStateService.addWidgetDisabler(this.eventBrokerService.inventorySelectionChange, disable => this.disable(disable));
  }

  dehydrate(): StockId {
    return this.stockId;
  }

  rehydrate(state: StockId): void {
    this.load(state);
    this.sendStockId();
  }
}
