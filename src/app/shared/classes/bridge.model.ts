import { DesignConditions } from '../services/design-conditions.service';
import { Joint } from './joint.model';
import { Member } from './member.model';

export class BridgeModel {
  public readonly version = 2024;
  public projectName: string = 'Dennis H. Mahan Memorial Bridge';
  public projectId: string = '';
  public designedBy: string = '';
  public iterationNumber: number = 1;
  public readonly joints: Joint[] = [];
  public readonly members: Member[] = [];

  constructor(public designConditions: DesignConditions) {
    designConditions.prescribedJoints.forEach(joint => this.joints.push(joint));
  }

  public getJointByNumber(n: number): Joint {
    return this.joints[n - 1];
  }

  clear() {
    this.joints.length = this.members.length = 0;
  }
}
