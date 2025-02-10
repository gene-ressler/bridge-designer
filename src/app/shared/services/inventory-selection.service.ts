import { Injectable } from '@angular/core';
import { EventBrokerService, EventInfo, EventOrigin } from './event-broker.service';
import { CrossSection, InventoryService, Material, Shape, StockId } from './inventory.service';

/** Injectable mirror of the state of the toolbar material selector. */
@Injectable({ providedIn: 'root' })
export class InventorySelectionService {
  private _material: Material | undefined;
  private _crossSection: CrossSection | undefined;
  private _shape: Shape | undefined;

  constructor(inventoryService: InventoryService, eventBrokerService: EventBrokerService) {
    this._material = inventoryService.materials[0];
    this._crossSection = inventoryService.crossSections[0];
    this._shape = inventoryService.getShape(0, 22);
    const that = this;
    const updateState = (eventInfo: EventInfo) => {
      if (eventInfo.origin === EventOrigin.TOOLBAR) {
        const stockId = eventInfo.data as StockId;
        // Array references return undefined for indices oob.
        const material = inventoryService.materials[stockId.materialIndex];
        const crossSection = inventoryService.crossSections[stockId.sectionIndex];
        const shape = inventoryService.getShape(stockId.sectionIndex, stockId.sizeIndex);
        if (material !== that._material || crossSection !== that._crossSection || shape !== that._shape) {
          that._material = material;
          that._crossSection = crossSection;
          that._shape = shape;
          eventBrokerService.inventorySelectionCompletion.next({
            origin: EventOrigin.SERVICE,
            data: { material, crossSection, shape, stockId },
          });
        }
      }
    };
    eventBrokerService.inventorySelectionChange.subscribe(updateState);
    eventBrokerService.loadInventorySelectorRequest.subscribe(updateState);
  }

  public get material(): Material | undefined {
    return this._material;
  }

  public get crossSection(): CrossSection | undefined {
    return this._crossSection;
  }

  public get shape(): Shape | undefined {
    return this._shape;
  }
}
