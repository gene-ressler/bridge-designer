import { TestBed } from '@angular/core/testing';
import { BridgeSketchService } from './bridge-sketch.service';
import { DesignConditionsService } from './design-conditions.service';
import { BridgeSketchDataService } from './bridge-sketch-data.service';

describe('BridgeSketchService', () => {
  let service: BridgeSketchService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BridgeSketchService, BridgeSketchDataService],
    });
    service = TestBed.inject(BridgeSketchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create different sketches for different conditions', () => {
    const conditions = DesignConditionsService.STANDARD_CONDITIONS[0];
    const otherConditions = DesignConditionsService.STANDARD_CONDITIONS[5];
    const firstCall = service.getSketchList(conditions);
    const secondCall = service.getSketchList(otherConditions);
    expect(firstCall).not.toBe(secondCall);
  });

  it('should return a list of sketches', () => {
    for (const designConditions of DesignConditionsService.STANDARD_CONDITIONS) {
      const sketches = service.getSketchList(designConditions);
      expect(sketches).toBeTruthy();
      expect(sketches.length).toBeGreaterThan(0);
    }
  });

  it('should cache the sketch list', () => {
    for (const designConditions of DesignConditionsService.STANDARD_CONDITIONS) {
      const firstCall = service.getSketchList(designConditions);
      const secondCall = service.getSketchList(designConditions);
      expect(firstCall).toBe(secondCall);
    }
  });

  it('should have different names for all items in list', () => {
    for (const designConditions of DesignConditionsService.STANDARD_CONDITIONS) {
      const sketches = service.getSketchList(designConditions);
      const names = new Set<string>();
      for (const sketch of sketches) {
        expect(names.has(sketch.name))
          .withContext(`for name '${sketch.name}' on conditions ${designConditions.tagGeometryOnly}`)
          .toBeFalse();
        names.add(sketch.name);
      }
    }
  });
});
