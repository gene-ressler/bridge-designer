/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { DesignConditions, DesignConditionsService } from '../services/design-conditions.service';
import { Joint } from './joint.model';
import { Member } from './member.model';

export class BridgeModel {
  public projectName: string = 'Dennis H. Mahan Memorial Bridge';
  public projectId: string = '';
  public designedBy: string = '';
  public iterationNumber: number = 1;
  public readonly joints: Joint[] = [];
  public readonly members: Member[] = [];

  /** Construct a new bridge model with given conditions and version. */
  constructor(
    /** Design conditions for the bridge. Mutable for parser. */
    public designConditions: DesignConditions,
    /** Version number of the bridge. Mutable for parser.  */
    public version: number,
  ) {
    designConditions.prescribedJoints.forEach(joint => this.joints.push(joint));
  }

  /** Create an empty, invalid bridge to be filled in by the caller. */
  public static createNew(): BridgeModel {
    return new BridgeModel(DesignConditionsService.PLACEHOLDER_CONDITIONS, -1);
  }

  /** Create a clone of the source bridge. Analysis results in the source members are not copied. */
  public static createClone(bridge: BridgeModel): BridgeModel {
    const newBridge = new BridgeModel(bridge.designConditions, bridge.version);
    newBridge.projectName = bridge.projectName;
    newBridge.projectId = bridge.projectId;
    newBridge.designedBy = bridge.designedBy;
    newBridge.iterationNumber = bridge.iterationNumber;
    for (let i: number = bridge.designConditions.prescribedJoints.length; i < bridge.joints.length; ++i) {
      const joint = bridge.joints[i];
      newBridge.joints.push(new Joint(joint.index, joint.x, joint.y, joint.isFixed));
    }
    for (const member of bridge.members) {
      newBridge.members.push(
        new Member(
          member.index,
          newBridge.joints[member.a.index],
          newBridge.joints[member.b.index],
          member.material,
          member.shape,
          member.maxTension,
          member.maxCompression,
          member.tensionStrength,
          member.compressionStrength,
        ),
      );
    }
    return newBridge;
  }

  public getJointByNumber(n: number): Joint {
    return this.joints[n - 1];
  }

  public get taggedProjectId(): string {
    return /\S/.test(this.projectId)
      ? `000${this.designConditions.tag}-${this.projectId}`
      : `000${this.designConditions.tag}`;
  }

  public clear(): void {
    this.joints.length = this.designConditions.prescribedJoints.length;
    this.members.length = 0;
  }
}
