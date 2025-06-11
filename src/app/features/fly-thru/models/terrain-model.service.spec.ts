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
    expect(() => service.rebuildFractalTerrain()).not.toThrow();
  });

  it('should return expected mesh data with correct structure', () => {
    const mesh = service.mesh;
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
    expect(xSum).withContext('x').toBeCloseTo(0, 1);
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
        const context = `e[${i},${j}]`;
        expect(nx).withContext(context).toBeLessThan(0.5);
        expect(ny).withContext(context).toBeGreaterThan(0.5);
        expect(nz).withContext(context).toBeLessThan(0.5);
        expect(nx * nx + ny * ny + nz * nz).toBeCloseTo(1, 0.001);
      }
    }
  });

  it('should return a number for getElevationAt', () => {
    const elevation = service.getElevationAt(0, 0);
    expect(typeof elevation).toBe('number');
  });
});
