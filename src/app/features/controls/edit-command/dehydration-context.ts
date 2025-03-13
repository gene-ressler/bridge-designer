import { BridgeModel } from '../../../shared/classes/bridge.model';
import { Joint } from '../../../shared/classes/joint.model';
import { Member } from '../../../shared/classes/member.model';
import { Utility } from '../../../shared/classes/utility';
import { InventoryService } from '../../../shared/services/inventory.service';

export type EditCommandTag =
  | 'add-joint'
  | 'add-member'
  | 'change-members'
  | 'delete-members'
  | 'delete-joint'
  | 'move-joint'
  | 'move-labels'
  | 'placeholder';

export interface DehydratedEditCommand {
  tag: EditCommandTag;
}

/** A context for serializing the graph of edit command, joints, and members. */
export class DehydrationContext {
  readonly refsByMember = new Map<Member, ContextElementRef>();
  readonly refsByJoint = new Map<Joint, ContextElementRef>();
  readonly joints: Joint[] = [];
  readonly members: Member[] = [];

  private constructor() {}

  /** Builds a dehydration context preloaded with the given bridge's elements. */
  public static forBridge(bridge: BridgeModel): DehydrationContext {
    const context = new DehydrationContext();
    bridge.joints.forEach(joint => context.refsByJoint.set(joint, { bridge: joint.index }));
    bridge.members.forEach(member => context.refsByMember.set(member, { bridge: member.index }));
    return context;
  }

  public getJointRef(joint: Joint): ContextElementRef {
    return this.getDehydrated(joint, this.refsByJoint, this.joints);
  }

  public getMemberRef(member: Member): ContextElementRef {
    return this.getDehydrated(member, this.refsByMember, this.members);
  }

  /** Translates a joint or member into a proper reference and updates the context. */
  private getDehydrated<T>(item: T, map: Map<T, ContextElementRef>, env: T[]): ContextElementRef {
    let ref: ContextElementRef | undefined = map.get(item);
    if (ref === undefined) {
      // External reference not seen before. Add to context.
      const index = env.length;
      env.push(item);
      ref = { extern: index };
      map.set(item, ref);
    }
    return ref;
  }

  dehydrate(): DehydratedDehydrationContext {
    return {
      joints: this.joints.map(joint => DehydrationContext.dehydrateJoint(joint)),
      members: this.members.map(member => this.dehydrateMember(member)),
    };
  }

  public dehydrateMember(member: Member): DehydratedMember {
    return {
      index: member.index,
      a: this.getJointRef(member.a),
      b: this.getJointRef(member.b),
      materialIndex: member.material.index,
      sectionIndex: member.shape.section.index,
      sizeIndex: member.shape.sizeIndex,
    };
  }

  public static dehydrateJoint(joint: Joint): DehydratedJoint {
    return {
      index: joint.index,
      x: joint.x,
      y: joint.y,
      isFixed: joint.isFixed,
    };
  }

  public static rehydrateJoint(joint: DehydratedJoint) {
    return new Joint(joint.index, joint.x, joint.y, joint.isFixed);
  }
}

/** A reference sufficient to rehydrate a joint or member from context. */
export type ContextElementRef = {
  bridge?: number;
  extern?: number;
};

/** A dehydrated joint object. Stands alone. */
export type DehydratedJoint = {
  index: number;
  x: number;
  y: number;
  isFixed: boolean;
};

/** A dehydrated member object. Contains context element references. */
export type DehydratedMember = {
  index: number;
  a: ContextElementRef;
  b: ContextElementRef;
  materialIndex: number;
  sectionIndex: number;
  sizeIndex: number;
};

/** As the name says... */
export type DehydratedDehydrationContext = {
  joints: DehydratedJoint[];
  members: DehydratedMember[];
};

/** Container for rehydration context and methods to rehydrate bridge elements using the context. */
export class RehydrationContext {
  private constructor(
    private readonly bridge: BridgeModel,
    private readonly externJoints: Joint[],
    private readonly externMembers: Member[],
  ) {}

  /** Creates the context needed for joint and member rehydration. */
  public static create(
    dehydratedContext: DehydratedDehydrationContext,
    bridge: BridgeModel,
    inventoryService: InventoryService,
  ): RehydrationContext {
    const externJoints = dehydratedContext.joints.map(joint => DehydrationContext.rehydrateJoint(joint));
    const members = dehydratedContext.members.map(member =>
      RehydrationContext.rehydrateMember(member, bridge.joints, externJoints, inventoryService),
    );
    return new RehydrationContext(bridge, externJoints, members);
  }

  public rehydrateJointRef(ref: ContextElementRef): Joint {
    return RehydrationContext.rehydrateJointRefStatic(ref, this.bridge.joints, this.externJoints);
  }

  public rehydrateMemberRef(ref: ContextElementRef): Member {
    return ref.bridge !== undefined
      ? this.bridge.members[ref.bridge]
      : this.externMembers[Utility.assertNotUndefined(ref.extern)];
  }

  private static rehydrateJointRefStatic(ref: ContextElementRef, bridgeJoints: Joint[], externJoints: Joint[]) {
    return ref.bridge !== undefined ? bridgeJoints[ref.bridge] : externJoints[Utility.assertNotUndefined(ref.extern)];
  }

  private static rehydrateMember(
    member: DehydratedMember,
    bridgeJoints: Joint[],
    externJoints: Joint[],
    inventoryService: InventoryService,
  ) {
    return new Member(
      member.index,
      RehydrationContext.rehydrateJointRefStatic(member.a, bridgeJoints, externJoints),
      RehydrationContext.rehydrateJointRefStatic(member.b, bridgeJoints, externJoints),
      inventoryService.materials[member.materialIndex],
      inventoryService.getShape(member.sectionIndex, member.sizeIndex),
    );
  }
}

