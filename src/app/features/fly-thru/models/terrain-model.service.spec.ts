/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { TestBed } from '@angular/core/testing';
import { TerrainModelService } from './terrain-model.service';

describe('TerrainModelService', () => {
  let service: TerrainModelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TerrainModelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have fractalElevations that make sense', () => {
    expect(service.fractalElevations).toBeDefined();
    service.fractalElevations.forEach((column, j) => {
      column.forEach((value, i) => {
        const context = `e[${i},${j}]`;
        expect(value).withContext(context).toBeGreaterThan(-40);
        expect(value).withContext(context).toBeLessThan(40);
      });
    });
  });

  it('should rebuild fractal terrain without errors', () => {
    expect(() => service.refreshFractalTerrain()).not.toThrow();
  });

  it('should return expected mesh data with correct structure', () => {
    const mesh = service.terrainMeshData;
    expect(mesh).toBeDefined();
    expect(mesh.positions instanceof Float32Array).toBeTrue();
    expect(mesh.normals instanceof Float32Array).toBeTrue();
    expect(mesh.indices instanceof Uint16Array).toBeTrue();

    // Positions in a grid averaging roughly zero elevation.
    let ip = 0;
    let xSum = 0;
    let ySum = 0;
    let zSum = 0;
    for (let i = 0; i < TerrainModelService.POST_COUNT; ++i) {
      for (let j = 0; j < TerrainModelService.POST_COUNT; ++j) {
        xSum += mesh.positions[ip++];
        ySum += mesh.positions[ip++];
        zSum += mesh.positions[ip++];
      }
    }
    expect(xSum).withContext('x').toBeCloseTo(366102, 1); // Due to half-span shift in x.
    expect(zSum).withContext('z').toBeCloseTo(0, 1);
    const postSquareCount = mesh.positions.length * mesh.positions.length;
    expect(ySum / postSquareCount)
      .withContext('y')
      .toBeCloseTo(0, 1);

    // Normals generally pointing upward.
    ip = 0;
    for (let i = 0; i < TerrainModelService.POST_COUNT; ++i) {
      for (let j = 0; j < TerrainModelService.POST_COUNT; ++j) {
        const nx = mesh.normals![ip++];
        const ny = mesh.normals![ip++];
        const nz = mesh.normals![ip++];
        expect(nx * nx + ny * ny + nz * nz).toBeCloseTo(1, 0.001);
      }
    }
  });

  it('should return a number for getElevationAt', () => {
    const elevation = service.getElevationAtXZ(0, 0);
    expect(typeof elevation).toBe('number');
  });

  it('should produce a reasonable road centerline', () => {
    for (let i = 0; i < TerrainModelService.POST_COUNT; ++i) {
      const post = service.getRoadCenterlinePostAtJ(i);
      expect(post.elevation).toBeCloseTo(0.8, 4);
      expect(Math.hypot(post.xNormal, post.yNormal)).toBeCloseTo(1, 4);
      expect(post.yNormal).toBeGreaterThan(0.5);
      const iMiddle = TerrainModelService.GRID_COUNT >>> 1;
      if (i < iMiddle) {
        expect(post.xNormal).toBeGreaterThanOrEqual(0);
      } else {
        expect(post.xNormal).toBeLessThanOrEqual(0);
      }
    }
  });
});
