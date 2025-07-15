import { InterpolationService, Interpolator } from './interpolation.service';
import { BridgeService } from '../../../shared/services/bridge.service';
import { AnalysisService } from '../../../shared/services/analysis.service';
import { TerrainModelService, CenterlinePost } from '../models/terrain-model.service';
import { vec2 } from 'gl-matrix';
import { projectLocalMatchers } from '../../../shared/test/jasmine-matchers';
import { SimulationParametersService } from './simulation-parameters.service';
import { SiteConstants } from '../../../shared/classes/site.model';

describe('InterpolationService', () => {
  let bridgeService: jasmine.SpyObj<BridgeService>;
  let analysisService: jasmine.SpyObj<AnalysisService>;
  let parametersService: jasmine.SpyObj<SimulationParametersService>;
  let terrainModelService: jasmine.SpyObj<TerrainModelService>;
  let service: InterpolationService;
  let interpolator: Interpolator;

  beforeEach(() => {
    jasmine.addMatchers(projectLocalMatchers);
    bridgeService = jasmine.createSpyObj('BridgeService', [], {
      designConditions: { loadedJointCount: 4 },
      bridge: {
        joints: [
          { x: 0, y: 0 },
          { x: 4, y: 0 },
          { x: 8, y: 0 },
          { x: 12, y: 0 },
        ],
      },
    });

    analysisService = jasmine.createSpyObj('AnalysisService', ['getJointDisplacement', 'getJointDisplacementX']);
    parametersService = { exaggeration: 1 } as SimulationParametersService;
    terrainModelService = jasmine.createSpyObj('TerrainModelService', ['getRoadCenterlinePostAtX']);

    analysisService.getJointDisplacement.and.callFake((out: vec2, loadCase: number, index: number) => {
      const deadLoadDisplacements = [
        [1, 1],
        [0, -1],
        [0, 1],
        [1, 1],
      ];
      const dld = deadLoadDisplacements[index];
      out[0] = dld[0];
      out[1] = loadCase === index ? dld[1] - 0.5 : dld[1];
      return out;
    });

    analysisService.getJointDisplacementX.and.callFake((loadCase: number, index: number) => {
      return analysisService.getJointDisplacement(vec2.create(), loadCase, index)[1];
    });

    terrainModelService.getRoadCenterlinePostAtX.and.callFake((post: CenterlinePost, x: number) => {
      post.elevation = (x < 0 ? -x : x > 12 ? x - 12 : 0) + SiteConstants.DECK_TOP_HEIGHT;
      return post;
    });

    service = new InterpolationService(bridgeService, parametersService, terrainModelService);

    interpolator = service.createAnalysisInterpolator(analysisService);
  });

  it('should return roadway coords if left of the bridge', () => {
    expect(interpolator.withParameter(-4).getWayPoint(vec2.create())).toNearlyEqual(vec2.fromValues(-4, 4.8));
    expect(interpolator.withParameter(-2).getWayPoint(vec2.create())).toNearlyEqual(vec2.fromValues(-2, 2.8));
  });

  it('should return roadway coords if right of the bridge', () => {
    expect(interpolator.withParameter(14).getWayPoint(vec2.create())).toNearlyEqual(vec2.fromValues(14, 2.8));
    expect(interpolator.withParameter(16).getWayPoint(vec2.create())).toNearlyEqual(vec2.fromValues(16, 4.8));
  });

  it('should honor exaggeration for load case zero', () => {
    // Zero force location of joint 0 is (0, 0), so checking exaggeration is simplest here.
    const unExaggeratedJointLocation = interpolator.withParameter(-4).getDisplacedJointLocation([0, 0], 0);
    parametersService.exaggeration = 2;
    const exaggeratedJointLocation = interpolator.withParameter(-4).getDisplacedJointLocation([0, 0], 0);
    expect(exaggeratedJointLocation[0]).toBe(2 * unExaggeratedJointLocation[0]);
    expect(exaggeratedJointLocation[1]).toBe(2 * unExaggeratedJointLocation[1]);
  });

  it('should honor exaggeration for load case on bridge', () => {
    const zeroForceInterpolator = service.createAnalysisInterpolator(InterpolationService.ZERO_FORCE_INTERPOLATION_SOURCE);
    const zeroForceJointLocation = zeroForceInterpolator.withParameter(6).getDisplacedJointLocation([0, 0], 1);
    const unExaggeratedJointLocation = interpolator.withParameter(6).getDisplacedJointLocation([0, 0], 1);
    parametersService.exaggeration = 2;
    const exaggeratedJointLocation = interpolator.withParameter(6).getDisplacedJointLocation([0, 0], 1);
    const unExaggeratedDisplacement = vec2.sub([0, 0], unExaggeratedJointLocation, zeroForceJointLocation);
    const exaggeratedDisplacement = vec2.sub([0, 0], exaggeratedJointLocation, zeroForceJointLocation);
    // Won't be exactly 2 because the parameter space is distorted by exaggeration.
    expect(exaggeratedDisplacement).toNearlyEqual(vec2.scale([0, 0], unExaggeratedDisplacement, 2), 0.2);
  });

  it('should make a fairly smooth path onto, through, and off the bridge', () => {
    const locations = [];
    for (let x = -1; x <= 14; x += 0.5) {
      locations.push(interpolator.withParameter(x).getWayPoint([0, 0]));
    }
    const expectedPath: [number, number][] = [
      [-1, 1.8], // 0
      [-0.5, 1.3], // 1
      [0, 0.8], // 2
      [1.358, 1.216], // 3
      [1.74, 1.07], // 4
      [2.121, 0.8944], // 5
      [2.502, 0.6903], // 6
      [2.881, 0.4573], // 7
      [3.259, 0.1954], // 8
      [3.636, -0.09533], // 9
      [4.012, -0.4148], // 10
      [4.387, -0.763], // 11
      [3.906, -0.5819], // 12
      [4.401, -0.2465], // 13
      [4.897, 0.06005], // 14
      [5.394, 0.3376], // 15
      [5.891, 0.5862], // 16
      [6.389, 0.8058], // 17
      [6.887, 0.9963], // 18
      [7.386, 1.158], // 19
      [8.127, 1.335], // 20
      [8.746, 1.433], // 21
      [9.365, 1.501], // 22
      [9.984, 1.54], // 23
      [10.6, 1.55], // 24
      [11.22, 1.53], // 25
      [11.84, 1.481], // 26
      [12.46, 1.403], // 27
      [13, 1.8], // 28
      [13.5, 2.3], // 29
      [14, 2.8], // 30
    ];
    expect(locations).toNearlyEqual(expectedPath, 1e-3);
  });

  it('should have load rotations that make sense', () => {
    const rotations = [];
    for (let x = 0; x <= 18; x += 0.5) {
      const rotation: vec2 = [0, 0];
      interpolator.withParameter(x).getLoadPosition([0, 0], rotation);
      rotations.push(rotation);
    }
    const expectedRotations: [number, number][] = [
      [0.7071, -0.7071], // 0
      [0.8929, -0.4502], // 1
      [0.9123, -0.4095], // 2
      [0.9277, -0.3732], // 3
      [0.9398, -0.3418], // 4
      [0.9493, -0.3144], // 5
      [0.9564, -0.2921], // 6
      [0.961, -0.2764], // 7
      [0.9527, -0.3039], // 8
      [0.9278, -0.3731], // 9
      [0.9383, -0.3458], // 10
      [0.9659, -0.2591], // 11
      [0.9861, -0.1659], // 12
      [0.978, -0.2086], // 13
      [0.9947, -0.1024], // 14
      [0.9999, 0.01212], // 15
      [0.9898, 0.1425], // 16
      [0.9543, 0.2988], // 17
      [0.9213, 0.3889], // 18
      [0.9433, 0.332], // 19
      [0.9616, 0.2745], // 20
      [0.9762, 0.2169], // 21
      [0.9872, 0.1597], // 22
      [0.9946, 0.1038], // 23
      [0.9989, 0.0472], // 24
      [1, 0.003199], // 25
      [0.9965, 0.08355], // 26
      [0.9807, 0.1956], // 27
      [0.9497, 0.313], // 28
      [0.8981, 0.4398], // 29
      [0.8175, 0.576], // 30
      [0.6735, 0.7392], // 31
      [0.7071, 0.7071], // 32
      [0.7071, 0.7071], // 33
      [0.7071, 0.7071], // 34
      [0.7071, 0.7071], // 35
      [0.7071, 0.7071], // 36
    ];
    expect(rotations).toNearlyEqual(expectedRotations, -1e-3);
  });
});
