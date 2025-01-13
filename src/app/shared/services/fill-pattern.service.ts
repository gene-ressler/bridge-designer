import { Injectable } from '@angular/core';
import { Colors } from '../classes/graphics';

export type FillPattern = string | CanvasPattern; // String is the error fallback.

/** Caching container of commonly used fill patterns. */
@Injectable({ providedIn: 'root' })
export class FillPatternsService {
  private earth: Map<CanvasRenderingContext2D, FillPattern> = new Map<CanvasRenderingContext2D, FillPattern>();
  private excavation: Map<CanvasRenderingContext2D, FillPattern> = new Map<CanvasRenderingContext2D, FillPattern>();
  private concrete: Map<CanvasRenderingContext2D, FillPattern> = new Map<CanvasRenderingContext2D, FillPattern>();
  private subgrade: Map<CanvasRenderingContext2D, FillPattern> = new Map<CanvasRenderingContext2D, FillPattern>();

  public createConcrete(ctx: CanvasRenderingContext2D): FillPattern {
    let concrete = this.concrete.get(ctx);
    if (!concrete) {
      concrete = this.createConcreteImpl(ctx);
      this.concrete.set(ctx, concrete);
    }
    return concrete;
  }

  public createEarth(ctx: CanvasRenderingContext2D): FillPattern {
    let earth = this.earth.get(ctx);
    if (!earth) {
      earth = this.createEarthImpl(ctx);
      this.earth.set(ctx, earth);
    }
    return earth;
  }
  
  public createExcavation(ctx: CanvasRenderingContext2D): FillPattern {
    let excavation = this.excavation.get(ctx);
    if (!excavation) {
      excavation = this.createExcavationImpl(ctx);
      this.excavation.set(ctx, excavation);
    }
    return excavation;
  }

  public createSubgrade(ctx: CanvasRenderingContext2D): FillPattern {
    let subgrade = this.subgrade.get(ctx);
    if (!subgrade) {
      subgrade = this.createSubgradeImpl(ctx);
      this.subgrade.set(ctx, subgrade);
    }
    return subgrade;
  }

  private createConcreteImpl(ctx: CanvasRenderingContext2D): FillPattern {
    const patternCtx = FillPatternsService.getPatternContext(64);
    if (!patternCtx) {
      return Colors.CONCRETE;
    }
    patternCtx.fillStyle = Colors.CONCRETE;
    patternCtx.beginPath();
    const dotCount = patternCtx.canvas.width * patternCtx.canvas.height * 0.25;
    for (let i = 0; i < dotCount; ++i) {
      const x = Math.floor(Math.random() * patternCtx.canvas.width);
      const y = Math.floor(Math.random() * patternCtx.canvas.height);
      patternCtx.fillRect(x, y, 1, 1);
    }
    patternCtx.stroke();
    const pattern = ctx.createPattern(patternCtx.canvas, 'repeat');
    return pattern || Colors.CONCRETE;
  }

  private createEarthImpl(ctx: CanvasRenderingContext2D): FillPattern {
    const patternCtx = FillPatternsService.getPatternContext(32);
    if (!patternCtx) {
      return Colors.EARTH;
    }
    patternCtx.strokeStyle = Colors.EARTH;
    patternCtx.beginPath();
    let x0y1 = -32;
    let y0x1 = 0;
    while (x0y1 <= 32) {
      patternCtx.moveTo(x0y1, y0x1);
      patternCtx.lineTo(y0x1, x0y1);
      x0y1 += 4;
      y0x1 += 4;
    }
    patternCtx.stroke();
    const pattern = ctx.createPattern(patternCtx.canvas, 'repeat');
    return pattern || Colors.EARTH;
  }

  private createExcavationImpl(ctx: CanvasRenderingContext2D): FillPattern {
    const size = 8;
    const patternCtx = FillPatternsService.getPatternContext(size);
    if (!patternCtx) {
      return Colors.EXCAVATION;
    }
    patternCtx.fillStyle = 'white';
    patternCtx.fillRect(0, 0, size, size);
    patternCtx.strokeStyle = Colors.EXCAVATION;
    patternCtx.beginPath();
    patternCtx.moveTo(0, 0);
    patternCtx.lineTo(size, size);
    patternCtx.stroke();
    const pattern = ctx.createPattern(patternCtx.canvas, 'repeat');
    return pattern || Colors.EXCAVATION;
  }

  private createSubgradeImpl(ctx: CanvasRenderingContext2D): FillPattern {
    const patternCtx = FillPatternsService.getPatternContext(8);
    if (!patternCtx) {
      return Colors.CONCRETE;
    }
    patternCtx.fillStyle = Colors.EARTH;
    patternCtx.beginPath();
    patternCtx.moveTo(4, 0);
    patternCtx.lineTo(4, 8);
    patternCtx.stroke();
    const pattern = ctx.createPattern(patternCtx.canvas, 'repeat');
    return pattern || Colors.CONCRETE;
  }

  private static getPatternContext(size: number): CanvasRenderingContext2D | undefined {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return undefined;
    }
    canvas.width = canvas.height = size;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return ctx;
  }
}
