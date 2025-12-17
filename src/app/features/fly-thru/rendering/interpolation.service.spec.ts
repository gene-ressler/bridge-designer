/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { InterpolationService, Interpolator } from './interpolation.service';
import { BridgeService } from '../../../shared/services/bridge.service';
import { AnalysisService } from '../../../shared/services/analysis.service';
import { TerrainModelService, CenterlinePost } from '../models/terrain-model.service';
import { vec2 } from 'gl-matrix';
import { projectLocalMatchers } from '../../../shared/test/jasmine-matchers';
import { SiteConstants } from '../../../shared/classes/site-constants';
import { FlyThruSettingsService } from './fly-thru-settings.service';

describe('InterpolationService', () => {
  let bridgeService: jasmine.SpyObj<BridgeService>;
  let analysisService: jasmine.SpyObj<AnalysisService>;
  let collapseAnalysisService: jasmine.SpyObj<AnalysisService>;
  let settings: { exaggeration: number };
  let settingsService: jasmine.SpyObj<FlyThruSettingsService>;
  let terrainModelService: jasmine.SpyObj<TerrainModelService>;
  let service: InterpolationService;
  let interpolator: Interpolator;
  const load = vec2.create();
  const rotation = vec2.create();

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
        members: [{}, {}, {}, {}, {}, {}],
      },
    });

    analysisService = jasmine.createSpyObj('AnalysisService', [
      'getJointDisplacement',
      'getJointDisplacementX',
      'getMemberForce',
      'getMemberTensileStrength',
    ]);
    collapseAnalysisService = jasmine.createSpyObj('AnalysisService', [
      'getJointDisplacement',
      'getJointDisplacementX',
    ]);
    settings = { exaggeration: 1 };
    settingsService = settings as FlyThruSettingsService;
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

    analysisService.getMemberForce.and.callFake((ilc: number, im: number): number => ilc * 10 + im);

    analysisService.getMemberTensileStrength.and.callFake((im: number): number => im * 100);

    analysisService.getJointDisplacementX.and.callFake((loadCase: number, index: number) => {
      return analysisService.getJointDisplacement(vec2.create(), loadCase, index)[1];
    });

    terrainModelService.getRoadCenterlinePostAtX.and.callFake((post: CenterlinePost, x: number) => {
      post.elevation = (x < 0 ? -x : x > 12 ? x - 12 : 0) + SiteConstants.DECK_TOP_HEIGHT;
      return post;
    });

    service = new InterpolationService(
      analysisService,
      collapseAnalysisService,
      bridgeService,
      settingsService,
      terrainModelService,
    );
    interpolator = service.createAnalysisInterpolator();
  });

  it('should return roadway coords if left of the bridge', () => {
    interpolator.setParameter(-4).getLoadPosition(load, rotation);

    expect(load).toNearlyEqual(vec2.fromValues(-4, 4.8));
    expect(vec2.normalize(rotation, rotation)).toNearlyEqual(vec2.fromValues(0.7071, -0.7071), 1e-3);

    interpolator.setParameter(-2).getLoadPosition(load, rotation);

    expect(load).toNearlyEqual(vec2.fromValues(-2, 2.8));
    expect(vec2.normalize(rotation, rotation)).toNearlyEqual(vec2.fromValues(0.7071, -0.7071), 1e-3);
  });

  it('should return roadway coords if right of the bridge', () => {
    interpolator.setParameter(14).getLoadPosition(load, rotation);

    expect(load).toNearlyEqual(vec2.fromValues(14, 2.8));
    // Rear tire still on the bridge.
    expect(vec2.normalize(rotation, rotation)).toNearlyEqual(vec2.fromValues(0.9683, 0.2503), 1e-3);

    interpolator.setParameter(16).getLoadPosition(load, rotation);

    expect(load).toNearlyEqual(vec2.fromValues(16, 4.8));
    expect(vec2.normalize(rotation, rotation)).toNearlyEqual(vec2.fromValues(0.7071, 0.7071), 1e-3);
  });

  it('should honor exaggeration for load case zero', () => {
    const actualLocations = interpolator.setParameter(-4).getAllDisplacedJointLocations(new Float32Array(8));
    settings.exaggeration = 2;
    const exaggeratedLocations = interpolator.setParameter(-4).getAllDisplacedJointLocations(new Float32Array(8));
    expect(exaggeratedLocations[0]).toBe(2 * actualLocations[0]);
  });

  it('should honor exaggeration for load case on bridge', () => {
    const zeroForceInterpolator = service.createDeadLoadingInterpolator(0);
    const zeroForceLocations = zeroForceInterpolator
      .setParameter(6)
      .getAllDisplacedJointLocations(new Float32Array(8));

    const actualLocations = interpolator.setParameter(6).getAllDisplacedJointLocations(new Float32Array(8));

    settings.exaggeration = 2;
    const exaggeratedLocations = interpolator.setParameter(6).getAllDisplacedJointLocations(new Float32Array(8));

    const actualDisplacement = vec2.sub([0, 0], actualLocations.slice(2, 2), zeroForceLocations.slice(2, 2));
    const exaggeratedDisplacement = vec2.sub([0, 0], exaggeratedLocations.slice(2, 2), zeroForceLocations.slice(2, 2));
    // Won't be exactly 2 because the parameter space is distorted by exaggeration.
    expect(exaggeratedDisplacement).toNearlyEqual(vec2.scale([0, 0], actualDisplacement, 2), 0.2);
  });

  it('should make a fairly smooth path onto, through, and off the bridge', () => {
    const locations = [];
    const rotations = [];
    for (let x = -1; x <= 14; x += 0.5) {
      const location = vec2.create();
      const rotation = vec2.create();
      interpolator.setParameter(x).getLoadPosition(location, rotation);
      locations.push(location[0], location[1]);
      rotations.push(rotation[0], rotation[1]);
    }
    // prettier-ignore
    const expectedLocations: number[] = [
      -1, 1.8, // 0, 1
      -0.5, 1.3, // 2, 3
      0, 0.8, // 4, 5
      1.358, 1.216, // 6, 7
      1.74, 1.07, // 8, 9
      2.121, 0.8944, // 10, 11
      2.502, 0.6903, // 12, 13
      2.881, 0.4573, // 14, 15
      3.259, 0.1954, // 16, 17
      3.636, -0.09533, // 18, 19
      4.012, -0.4148, // 20, 21
      4.387, -0.763, // 22, 23
      3.906, -0.5819, // 24, 25
      4.401, -0.2465, // 26, 27
      4.897, 0.06005, // 28, 29
      5.394, 0.3376, // 30, 31
      5.891, 0.5862, // 32, 33
      6.389, 0.8058, // 34, 35
      6.887, 0.9963, // 36, 37
      7.386, 1.158, // 38, 39
      8.124, 1.336, // 40, 41
      8.733, 1.444, // 42, 43
      9.343, 1.539, // 44, 45
      9.952, 1.619, // 46, 47
      10.562, 1.684, // 48, 49
      11.171, 1.735, // 50, 51
      11.78, 1.771, // 52, 53
      12.39, 1.793, // 54, 55
      13, 1.8, // 56, 57
      13.5, 2.3, // 58, 59
      14, 2.8, // 60, 61
    ];
    // prettier-ignore
    const expectedRotations = [
      2.828, -2.828, // 0, 1
      2.828, -2.828, // 2, 3
      2.828, -2.828, // 4, 5
      3.577, -1.803, // 6, 7
      3.646, -1.637, // 8, 9
      3.715, -1.499, // 10, 11
      3.752, -1.36, // 12, 13
      3.803, -1.265, // 14, 15
      3.821, -1.167, // 16, 17
      3.839, -1.098, // 18, 19
      3.809, -1.215, // 20, 21
      3.887, -1.563, // 22, 23
      3.75, -1.382, // 24, 25
      3.901, -1.046, // 26, 27
      4.397, -0.7399, // 28, 29
      3.808, -1.222, // 30, 31
      3.943, -0.7072, // 32, 33
      3.999, -0.1793, // 34, 35
      3.988, 0.3489, // 36, 37
      3.911, 0.8731, // 38, 39
      3.773, 1.346, // 40, 41
      3.807, 1.218, // 42, 43
      3.856, 1.065, // 44, 45
      3.905, 0.8793, // 46, 47
      3.954, 0.6624, // 48, 49
      3.973, 0.4004, // 50, 51
      3.8, 0.0912, // 52, 53
      3.994, 0.04792, // 54, 55
      3.994, 0, // 56, 57
      3.969, 0.5, // 58, 59
      3.869, 1, // 60, 61
    ];
    expect(locations).withContext('locations').toNearlyEqual(expectedLocations, -1e-3);
    expect(rotations).withContext('rotations').toNearlyEqual(expectedRotations, -1e-3);
  });
});
