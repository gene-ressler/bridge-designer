import { Injectable } from '@angular/core';
import { EventBrokerService } from '../../shared/services/event-broker.service';
import { Manifold, Mesh, Vec3 } from 'manifold-3d';
import { Mat2x3, Print3dEntityService } from './print-3d-entity.service';
import { ToastError } from '../toast/toast/toast-error';
import { cleanup } from 'manifold-3d/lib/garbage-collector.js';

export class Printing3dConfig {
  /**
   * @param modelMmPerWorldM model millimeters per world meter
   * @param minFeatureSize minimum printable feature size
   */
  constructor(
    public readonly modelMmPerWorldM: number = 230 / 44,
    public readonly minFeatureSize: number = 0.8,
    public readonly name: string = '',
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
    eventBrokerService: EventBrokerService,
    private readonly print3dEntityService: Print3dEntityService,
    //objectPlacementService: ObjectPlacementService,
  ) {
    eventBrokerService.print3dRequest.subscribe(() => this.emit3dPrint());
    //eventBrokerService.print3dRequest.subscribe(() => objectPlacementService.test());
  }

  public setConfig(config: Printing3dConfig) {
    this.config = config;
  }

  /** Downloads OBJ files suitable for 3d printing the current bridge model. */
  public async emit3dPrint(): Promise<void> {
    // Load Manifold.
    await this.print3dEntityService.initialize();

    // Common computations context.
    const modelMmPerWorldM = this.config.modelMmPerWorldM;
    const ctx = this.print3dEntityService.getContext(modelMmPerWorldM, this.config.minFeatureSize);

    // Trusses.
    const trussesContext = new ObjContext();
    const minFeatureSize = this.config.minFeatureSize;
    const frontTruss = throwIfEmpty(
      this.print3dEntityService.buildTruss(ctx, [modelMmPerWorldM, 0, 0, modelMmPerWorldM, 0, 0]),
    );
    const trussBoundingBox = frontTruss.boundingBox();
    const trussesText = this.getObjText(trussesContext, 'FrontTruss', frontTruss.getMesh());
    const boundingBoxDx = trussBoundingBox.max[0] - trussBoundingBox.min[0];
    const boundingBoxDy = trussBoundingBox.max[1] - trussBoundingBox.min[1];
    // Place trusses in a row or column depending on largest dimension.
    const xyTransformLeft: Mat2x3 =
      boundingBoxDx > boundingBoxDy
        ? [modelMmPerWorldM, 0, 0, -modelMmPerWorldM, 0, 2 * trussBoundingBox.min[1] - minFeatureSize]
        : [modelMmPerWorldM, 0, 0, -modelMmPerWorldM, boundingBoxDx + minFeatureSize, trussBoundingBox.min[1]];
    const rearTruss = throwIfEmpty(this.print3dEntityService.buildTruss(ctx, xyTransformLeft));
    trussesText.push(...this.getObjText(trussesContext, 'RearTruss', rearTruss.getMesh()));
    cleanup(); // Garbage collect manifolds.
    this.downloadObjFileText(trussesText, '3d-trusses');

    // Abutments.
    const abutmentsContext = new ObjContext();
    let placementX = 0;
    const leftAbutment = throwIfEmpty(
      this.print3dEntityService.buildAbutment(ctx, [modelMmPerWorldM, 0, 0, modelMmPerWorldM, placementX, 0]),
    );
    const abutmentBoundingBox = leftAbutment.boundingBox();
    const leftAbutmentText = this.getObjText(abutmentsContext, 'LeftAbutment', leftAbutment.getMesh());
    placementX += abutmentBoundingBox.max[0] - abutmentBoundingBox.min[0] + minFeatureSize;
    const rightAbutment = throwIfEmpty(
      this.print3dEntityService.buildAbutment(ctx, [modelMmPerWorldM, 0, 0, modelMmPerWorldM, placementX, 0]),
    );
    const rightAbutmentText = this.getObjText(abutmentsContext, 'RightAbutment', rightAbutment.getMesh());
    placementX += minFeatureSize + abutmentBoundingBox.max[0];
    const abutmentsText = leftAbutmentText.concat(rightAbutmentText);

    // Anchorages (if present) also to abutments file.
    if (this.print3dEntityService.isLeftAnchorage) {
      const anchorage = throwIfEmpty(
        this.print3dEntityService.buildAnchorage(ctx, [modelMmPerWorldM, 0, 0, modelMmPerWorldM, placementX, 0]),
      );
      const anchorageBoundingBox = anchorage.boundingBox();
      abutmentsText.push(...this.getObjText(abutmentsContext, `LeftAnchorage`, anchorage.getMesh()));
      placementX += anchorageBoundingBox.max[0] - anchorageBoundingBox.min[0] + minFeatureSize;
    }
    if (this.print3dEntityService.isRightAnchorage) {
      // Make identical to the left. They're symmetric about x-y plane, so this is okay.
      const anchorage = throwIfEmpty(
        this.print3dEntityService.buildAnchorage(ctx, [modelMmPerWorldM, 0, 0, modelMmPerWorldM, placementX, 0]),
      );
      const anchorageBoundingBox = anchorage.boundingBox();
      abutmentsText.push(...this.getObjText(abutmentsContext, `RightAnchorage`, anchorage.getMesh()));
      placementX += anchorageBoundingBox.max[0] - anchorageBoundingBox.min[0] + minFeatureSize;
    }

    // Pier (if present) also to abutments file.
    if (this.print3dEntityService.isPier) {
      const pier = throwIfEmpty(
        this.print3dEntityService.buildPier(ctx, [modelMmPerWorldM, 0, 0, modelMmPerWorldM, placementX, 0]),
      );
      abutmentsText.push(...this.getObjText(abutmentsContext, 'Pier', pier.getMesh()));
    }
    cleanup(); // Garbage collect manifolds.
    this.downloadObjFileText(abutmentsText, '3d-abutments');

    const crossMembersContext = new ObjContext();
    const crossMembers = throwIfEmpty(this.print3dEntityService.buildCrossmembers(ctx, [0, 0]));
    const crossMembersText = this.getObjText(crossMembersContext, 'CrossMembers', crossMembers.getMesh());
    this.downloadObjFileText(crossMembersText, '3d-cross-members');
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

  private downloadObjFileText(text: string[], kind: string): void {
    const blob = new Blob(text, { type: 'model/obj' });
    const anchorElement = window.document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    anchorElement.href = url;
    let fileName = kind;
    if (this.config.name.length > 0) {
      fileName += `-${this.config.name}`;
    }
    fileName += '.obj';
    anchorElement.download = fileName;
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

function throwIfEmpty(manifold: Manifold): Manifold {
  if (manifold.isEmpty()) {
    throw new ToastError('manifoldBuildFailedError');
  }
  return manifold;
}
