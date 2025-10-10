import { Injectable } from '@angular/core';
import { EventBrokerService } from '../../shared/services/event-broker.service';
import Module, { Mat4, Mesh, SimplePolygon, Vec2, Vec3 } from 'manifold-3d';
import * as ManifoldTypes from 'manifold-3d/manifold-encapsulated-types';
import { Manifold } from 'manifold-3d/manifold';
import { BridgeService } from '../../shared/services/bridge.service';
import { GussetsService } from '../../shared/services/gussets.service';

type Mat2x3 = [number, number, number, number, number, number];
class ObjContext {
  normalIndices: { [key: string]: number } = {};
  baseVertexIndex: number = 0;
  nextNormalIndex: number = 0;
}

/** Returns whether the given transform reverses the winding order of polygons when applied.*/
function isReverseWinding(a: Mat2x3): boolean {
  return a[0] * a[3] < a[1] * a[2];
}

function transformVec2(a: Mat2x3, x: number, y: number, w: number = 1): Vec2 {
  return [a[0] * x + a[2] * y + a[4] * w, a[1] * x + a[3] * y + a[5] * w];
}

@Injectable({ providedIn: 'root' })
export class Printing3dService {
  private manifoldInstance!: typeof ManifoldTypes.Manifold;

  constructor(
    private readonly bridgeService: BridgeService,
    eventBrokerService: EventBrokerService,
    private readonly gussetsService: GussetsService,
  ) {
    eventBrokerService.print3dRequest.subscribe(() => this.emit3dPrint());
  }

  /** Sets up the Manifold library for CSG operations. Multiple calls okay. */
  private async initialize(): Promise<void> {
    if (this.manifoldInstance) {
      return;
    }
    // Assets spec puts manifold.wasm at /wasm.
    const wasm = await Module({ locateFile: () => 'wasm/manifold.wasm' });
    wasm.setup();
    this.manifoldInstance = wasm.Manifold;
  }

  public async emit3dPrint(): Promise<void> {
    await this.initialize();
    const trussExtent = this.bridgeService.getWorldExtent();
    const frontTruss = this.buildTruss([1, 0, 0, 1, 0, 0.75 - trussExtent.y0]);
    if (!frontTruss) {
      return;
    }
    const objContext = new ObjContext();
    const frontTrussText = this.getObjText(objContext, 'FrontTruss', frontTruss.getMesh());
    frontTruss.delete();
    const rearTruss = this.buildTruss([1, 0, 0, -1, 0, trussExtent.y0 - 0.75]);
    if (!rearTruss) {
      return;
    }
    const rearTrussText: string[] = this.getObjText(objContext, 'RearTruss', rearTruss.getMesh());
    this.emitObjFileText(frontTrussText.concat(rearTrussText), '3d-bridge.obj');
  }

  private buildTruss(xyTransform: Mat2x3): Manifold | undefined {
    let truss!: Manifold;
    const add = (newComponent: Manifold): void => {
      if (truss) {
        const oldTruss = truss;
        truss = truss.add(newComponent);
        oldTruss.delete();
      } else {
        truss = newComponent;
      }
    };
    for (const member of this.bridgeService.bridge.members) {
      const size = member.materialSizeMm * 0.001;
      const halfsize = size * 0.5;
      const [ax, ay] = transformVec2(xyTransform, member.a.x, member.a.y);
      const [bx, by] = transformVec2(xyTransform, member.b.x, member.b.y);
      let dx = bx - ax;
      let dy = by - ay;
      let len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      // Rotate about to correct angle after shifting down and right by 1/2 member size.
      const tx = ax + halfsize * (dx + dy);
      const ty = ay + halfsize * (dy - dx);
      // prettier-ignore
      const m: Mat4 = [
        dx, dy, 0, 0, // column 0
        -dy, dx, 0, 0, // column 1
        0, 0, 1, 0, // column 2
        tx, ty, 0, 1, // column 3
      ];
      const memberAtOrigin = this.manifoldInstance.cube([member.lengthM - size, size, size]);
      add(memberAtOrigin.transform(m));
      memberAtOrigin.delete();
    }
    const d = 0.015;
    const hole: SimplePolygon = [
      [0, d],
      [d, 0],
      [0, -d],
      [-d, 0],
    ];
    for (const gusset of this.gussetsService.gussets) {
      const polygon: SimplePolygon = gusset.hull.map(pt => transformVec2(xyTransform, pt.x, pt.y, 0));
      if (isReverseWinding(xyTransform)) {
        polygon.reverse();
      }
      const hull3d = this.manifoldInstance.extrude([polygon, hole], gusset.halfDepthM * 2);
      const [gx, gy] = transformVec2(xyTransform, gusset.joint.x, gusset.joint.y);
      add(hull3d.translate(gx, gy, 0));
      hull3d.delete();
    }
    return truss;
  }

  private getObjText(ctx: ObjContext, name: string, mesh: Mesh): string[] {
    const coords = mesh.vertProperties;
    const text: string[] = [`o ${name}\n`];
    for (let i = 0; i < coords.length; i += 3) {
      text.push(`v ${toNice(coords[i])} ${toNice(coords[i + 1])} ${toNice(coords[i + 2])}\n`);
    }
    const indices = mesh.triVerts;
    for (let i = 0; i < indices.length; i += 3) {
      const ia = indices[i];
      const ib = indices[i + 1];
      const ic = indices[i + 2];
      const normal = getTriangleNormal(coords, ia, ib, ic);
      const key = getNormalString(normal);
      let normalIndex = ctx.normalIndices[key];
      if (normalIndex === undefined) {
        text.push(`vn ${key}\n`);
        ctx.normalIndices[key] = normalIndex = ctx.nextNormalIndex++;
      }
      const nn = 1 + normalIndex; // Normal number
      const vnb = 1 + ctx.baseVertexIndex; // Vertex number base
      text.push(`f ${vnb + ia}//${nn} ${vnb + ib}//${nn} ${vnb + ic}//${nn}\n`);
    }
    ctx.baseVertexIndex += coords.length / 3;
    return text;
  }

  // TODO: Handle both new and old method of writing files as in existing SaveLoadService for bridges.
  private emitObjFileText(text: string[], preferredName: string): void {
    const blob = new Blob(text, { type: 'model/obj' });
    const anchorElement = window.document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    anchorElement.href = url;
    anchorElement.download = preferredName;
    document.body.appendChild(anchorElement);
    anchorElement.click();
    document.body.removeChild(anchorElement);
    window.URL.revokeObjectURL(anchorElement.href);
  }
}

/** Returns slightly rounded normal coordinates as a string. Rounding reduces file size. */
function getNormalString(n: Vec3): string {
  return `${toNice(n[0])} ${toNice(n[1])} ${toNice(n[2])}`;
}

function toNice(x: number): string {
  return x.toPrecision(6).replace(/\.0*$|(\.\d*[1-9])0*$/, '$1');
}

/** Returns the unit normal of triangle with given indices. */
function getTriangleNormal(coords: Float32Array, ia: number, ib: number, ic: number): Vec3 {
  const a = coords.slice(ia * 3);
  const b = coords.slice(ib * 3);
  const c = coords.slice(ic * 3);
  let nx = 0;
  let ny = 0;
  let nz = 0;
  nx += (a[1] - b[1]) * (a[2] + b[2]);
  ny += (a[2] - b[2]) * (a[0] + b[0]);
  nz += (a[0] - b[0]) * (a[1] + b[1]);
  nx += (b[1] - c[1]) * (b[2] + c[2]);
  ny += (b[2] - c[2]) * (b[0] + c[0]);
  nz += (b[0] - c[0]) * (b[1] + c[1]);
  nx += (c[1] - a[1]) * (c[2] + a[2]);
  ny += (c[2] - a[2]) * (c[0] + a[0]);
  nz += (c[0] - a[0]) * (c[1] + a[1]);
  const len = Math.hypot(nx, ny, nz);
  return [nx / len, ny / len, nz / len];
}
