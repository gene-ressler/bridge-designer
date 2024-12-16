import { Material, Shape, StockId } from '../services/inventory.service';
import { Editable } from './editing';
import { Geometry } from './graphics';
import { Joint } from './joint.model';

export class Member implements Editable {
  constructor(
    public index: number,
    public a: Joint,
    public b: Joint,
    public material: Material,
    public shape: Shape,
  ) {
    if (a === b) {
      throw new Error(`Single joint member: ${a.number}`);
    }
  }

  public get number(): number {
    return this.index + 1;
  }

  public get length(): number {
    return Geometry.distance2DPoints(this.a, this.b);
  }

  public get stockId(): StockId {
    return new StockId(this.material.index, this.shape.section.index, this.shape.sizeIndex);
  }

  public get slenderness(): number {
    return this.length * this.shape.inverseRadiusOfGyration;
  }

  /** Returns a unique string key for this member. */
  public get key(): string {
    return Member.getJointsKey(this.a, this.b);
  }

  /** Returns a unique string key for an unordered pair of joints. */
  public static getJointsKey(a: Joint, b: Joint) {
    const ia = a.index;
    const ib = b.index;
    return ia < ib ? `${ia},${ib}` : `${ib},${ia}`;
  }

  public hasJoints(a: Joint, b: Joint): boolean {
    return (a === this.a && b === this.b) || (b === this.a && a === this.b);
  }

  public hasJoint(joint: Joint): boolean {
    return this.a === joint || this.b === joint;
  }

  /** Returns joint b of this member if given joint is a, else returns a. */
  public getOtherJoint(joint: Joint): Joint {
    return joint === this.a ? this.b : this.a;
  }

  swapContents(other: Member): void {
    [this.index, other.index] = [other.index, this.index];
    [this.a, other.a] = [other.a, this.a];
    [this.b, other.b] = [other.b, this.b];
    [this.material, other.material] = [other.material, this.material];
    [this.shape, other.shape] = [other.shape, this.shape];
  }
}
