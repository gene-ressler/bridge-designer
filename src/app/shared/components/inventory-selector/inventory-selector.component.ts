import { AfterViewInit, ChangeDetectionStrategy, Component, Input, ViewChild } from '@angular/core';
import { jqxDropDownListComponent, jqxDropDownListModule } from 'jqwidgets-ng/jqxdropdownlist';
import { EventBrokerService, EventOrigin } from '../../services/event-broker.service';
import { InventoryService, StockId } from '../../services/inventory.service';

@Component({
  selector: 'inventory-selector',
  standalone: true,
  imports: [jqxDropDownListModule],
  templateUrl: './inventory-selector.component.html',
  styleUrl: './inventory-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventorySelectorComponent implements AfterViewInit {
  @Input({ required: true }) vertical: boolean = false;
  @Input() eventOrigin: number = EventOrigin.TOOLBAR;
  @ViewChild('materialSelector') materialSelector!: jqxDropDownListComponent;
  @ViewChild('crossSectionSelector') crossSectionSelector!: jqxDropDownListComponent;
  @ViewChild('sizeSelector') sizeSelector!: jqxDropDownListComponent;

  readonly height = 28;
  readonly materialSelectorWidth = 206;
  readonly initialSizeIndex = 22; // 200x200

  constructor(
    readonly inventoryService: InventoryService,
    private readonly eventBrokerService: EventBrokerService,
  ) {}

  public load(stockId: StockId) {
    this.materialSelector.selectIndex(stockId.materialIndex);
    this.crossSectionSelector.selectIndex(stockId.sectionIndex);
    this.sizeSelector.selectIndex(stockId.sizeIndex);
  }

  get crossSectionSelectorWidth(): number {
    return this.vertical ? 206 : 106;
  }

  get sizeSelectorWidth(): number {
    return this.vertical ? 206 : 106;
  }

  handleMaterialSelectorOnChange(_event: any): void {
    if (_event.args.type !== 'mouse') {
      return;
    }
    this.sendStockId();
  }

  handleCrossSectionSelectorOnChange(event: any): void {
    this.sizeSelector.source(this.inventoryService.getShapes(event.args.index));
    if (event.args.type !== 'mouse') {
      return;
    }
    this.sendStockId();
  }

  handleSizeSelectorOnChange(_event: any): void {
    if (_event.args.type !== 'mouse') {
      return;
    }
    this.sendStockId();
  }

  private sendStockId(): void {
    this.eventBrokerService.inventorySelectionChange.next({
      source: this.eventOrigin,
      data: new StockId(
        this.materialSelector.selectedIndex(),
        this.crossSectionSelector.selectedIndex(),
        this.sizeSelector.selectedIndex(),
      ),
    });
  }

  ngAfterViewInit(): void {
    this.eventBrokerService.loadInventorySelectorRequest.subscribe(eventInfo => this.load(eventInfo.data));
  }
}
