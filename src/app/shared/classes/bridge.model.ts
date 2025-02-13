import { DesignConditions } from '../services/design-conditions.service';
import { Joint } from './joint.model';
import { Member } from './member.model';

export class BridgeModel {
  public readonly version = 2024;
  public projectName: string = 'Dennis H. Mahan Memorial Bridge';
  public projectId: string = '';
  public designedBy: string = '';
  public iteration: number = 1;
  public readonly joints: Joint[] = [];
  public readonly members: Member[] = [];

  constructor(public designConditions: DesignConditions) {
    designConditions.prescribedJoints.forEach(joint => this.joints.push(joint));
  }

  /** Create a clone of the source bridge. Analysis results in the source members are not copied. */
  public static createClone(bridge: BridgeModel): BridgeModel {
    const newBridge = new BridgeModel(bridge.designConditions);
    newBridge.projectName = bridge.projectName;
    newBridge.projectId = bridge.projectId;
    newBridge.designedBy = bridge.designedBy;
    newBridge.iteration = bridge.iteration;
    for (let i: number = bridge.designConditions.prescribedJoints.length; i < bridge.joints.length; ++i) {
      const joint = bridge.joints[i];
      newBridge.joints.push(new Joint(joint.index, joint.x, joint.y, joint.isFixed));
    }
    for (const member of bridge.members) {
      newBridge.members.push(
        new Member(
          member.index,
          bridge.joints[member.a.index],
          bridge.joints[member.b.index],
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

  public clear(): void {
    this.joints.length = this.designConditions.prescribedJoints.length;
    this.members.length = 0;
  }
}
