import { Injectable } from '@angular/core';
import { EventBrokerService } from '../../shared/services/event-broker.service';
import { Mesh, Vec3 } from 'manifold-3d';
import { Print3dEntityService } from './print-3d-entity.service';

export class Printing3dConfig {
  /**
   * @param scale model millimeters per world meter
   * @param minFeatureSize minimum printable feature size
   */
  constructor(public readonly scale: number = 230 / 44,
    public readonly minFeatureSize: number = 0.8,
  ) {}
}

/**
 * State of the OBJ file formatter `getObjText(mesh)` allowing several of
 * its return values to be concatenated in a single file.
 */
class ObjContext {
  normalIndices: { [key: string]: number } = {};
  baseVertexIndex: number = 0;
  nextNormalIndex: number = 0;
}

@Injectable({ providedIn: 'root' })
export class Printing3dService {
  private config = new Printing3dConfig();

  constructor(
    private readonly print3dEntityService: Print3dEntityService,
    eventBrokerService: EventBrokerService,
    //objectPlacementService: ObjectPlacementService,
  ) {
    eventBrokerService.print3dRequest.subscribe(() => this.emit3dPrint());
    //eventBrokerService.print3dRequest.subscribe(() => objectPlacementService.test());
  }

  public setConfig(config: Printing3dConfig) {
    this.config = config;
  }

  /** Emits an OBJ file suitable for 3d printing the current bridge model. */
  public async emit3dPrint(): Promise<void> {
    // Load Manifold.
    await this.print3dEntityService.initialize();

    // Trusses
    const scale = this.config.scale;
    const minFeatureSize = this.config.minFeatureSize;;
    const frontTruss = this.print3dEntityService.buildTruss([scale, 0, 0, scale, 0, 0], minFeatureSize);
    if (!frontTruss) {
      return;
    }
    const trussBoundingBox = frontTruss.boundingBox();
    const trussContext = new ObjContext();
    const frontTrussText = this.getObjText(trussContext, 'FrontTruss', frontTruss.getMesh());
    frontTruss.delete();
    const rearTruss = this.print3dEntityService.buildTruss(
      [scale, 0, 0, -scale, 0, 2 * trussBoundingBox.min[1] - minFeatureSize],
      minFeatureSize,
    );
    if (!rearTruss) {
      return;
    }
    const rearTrussText: string[] = this.getObjText(trussContext, 'RearTruss', rearTruss.getMesh());
    rearTruss.delete();
    this.downloadObjFileText(frontTrussText.concat(rearTrussText), '3d-truss.obj');

    // Abutments, pier, anchorages
    const leftAbutment = this.print3dEntityService.buildAbutment([scale, 0, 0, scale, 0, 0], minFeatureSize);
    const abutmentBoundingBox = leftAbutment.boundingBox();
    if (!leftAbutment) {
      return;
    }
    const abutmentContext = new ObjContext();
    const leftAbutmentText = this.getObjText(abutmentContext, 'LeftAbutment', leftAbutment.getMesh());
    leftAbutment.delete();
    const rightAbutment = this.print3dEntityService.buildAbutment(
      [-scale, 0, 0, scale, 2 * abutmentBoundingBox.max[0] + minFeatureSize, 0],
      minFeatureSize,
    );
    const rightAbutmentText = this.getObjText(abutmentContext, 'RightAbutment', rightAbutment.getMesh());
    rightAbutment.delete();
    this.downloadObjFileText(leftAbutmentText.concat(rightAbutmentText), '3d-abutment.obj');
  }

  /**
   * Gets a chunk of text lines constituting an OBJ file object for the given mesh. Multiple chunks
   * may be concatenated (in exact order gotten) for all calls that provided the same context.
   *
   * @param ctx context within a single OBJ file to be emitted
   * @param name desired OBJ file object name
   * @param mesh Manifold Mesh to be used as source data
   * @returns array of text lines
   */
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

  private downloadObjFileText(text: string[], preferredName: string): void {
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

/** Returns the unit normal of triangle with given indices. Uses Newell's method. */
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
