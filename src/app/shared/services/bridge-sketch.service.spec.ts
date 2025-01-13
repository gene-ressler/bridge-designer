import { TestBed } from '@angular/core/testing';
import { BridgeSketchService } from './bridge-sketch.service';
import { BridgeSketchDataService } from './bridge-sketch-data.service';
import { DesignConditions, DesignConditionsService } from './design-conditions.service';

describe('BridgeSketchService', () => {
  let service: BridgeSketchService;
  // let bridgeSketchDataService: jasmine.SpyObj<BridgeSketchDataService>;
  let designConditionsService: DesignConditionsService;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('BridgeSketchDataService', ['addSketchesFromDataForConditions']);

    TestBed.configureTestingModule({
      providers: [
        BridgeSketchService,
        DesignConditionsService,
        { provide: BridgeSketchDataService, useValue: spy }
      ]
    });
    service = TestBed.inject(BridgeSketchService);
    // bridgeSketchDataService = TestBed.inject(BridgeSketchDataService) as jasmine.SpyObj<BridgeSketchDataService>;
    designConditionsService = TestBed.inject(DesignConditionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get a list of models', () => {
    const conditions = designConditionsService.getStandardConditionsForTag('01A') as DesignConditions;
    const list = service.getSketchList(conditions);
    expect(list).toHaveSize(4);
  });
});
