import {
  DesignGrid,
  DesignGridDensity,
  DesignGridService,
} from './design-grid.service';

describe('DesignGridService', () => {
  let draftingGridService: DesignGridService;
  let draftingGrid: DesignGrid;

  beforeEach(() => {
    draftingGridService = new DesignGridService();
    draftingGrid = draftingGridService.grid;
  });

  it('should have expected default snap multiple', () => {
    expect(draftingGrid.snapMultiple).toBe(4);
  });

  it('should have expected default grid density', () => {
    expect(draftingGrid.density).toBe(DesignGridDensity.COARSE);
  });

  it('should allow setting density', () => {
    draftingGrid.density = DesignGridDensity.FINE;
    expect(draftingGrid.density).toBe(DesignGridDensity.FINE);
    expect(draftingGrid.snapMultiple).toBe(1);
  });

  it('should test coarseness as expected', () => {
    expect(draftingGrid.isCoarser(DesignGridDensity.FINE)).toBeTrue();
    expect(draftingGrid.isCoarser(DesignGridDensity.MEDIUM)).toBeTrue();
    expect(draftingGrid.isCoarser(DesignGridDensity.COARSE)).toBeFalse();

    draftingGrid.density = DesignGridDensity.FINE;
    expect(draftingGrid.isCoarser(DesignGridDensity.FINE)).toBeFalse();
    expect(draftingGrid.isCoarser(DesignGridDensity.MEDIUM)).toBeFalse();
    expect(draftingGrid.isCoarser(DesignGridDensity.COARSE)).toBeFalse();
  });

  it('should snap world to coarse grid', () => {
    expect(draftingGrid.xformWorldToGrid(0.75)).toBe(4);
    expect(draftingGrid.xformWorldToGrid(1)).toBe(4);
    expect(draftingGrid.xformWorldToGrid(1.25)).toBe(4);
    expect(draftingGrid.xformWorldToGrid(1.5)).toBe(8);
    expect(draftingGrid.xformWorldToGrid(1.75)).toBe(8);
  });

  it('with finest grid endpoint should furnish finest grid', () => {
    expect(DesignGridService.FINEST_GRID.density).toBe(
      DesignGridDensity.FINE
    );
  });
});
