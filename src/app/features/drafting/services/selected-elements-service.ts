import { Injectable } from '@angular/core';
import { BridgeModel } from '../../../shared/classes/bridge.model';
import { Joint } from '../../../shared/classes/joint.model';
import { Member } from '../../../shared/classes/member.model';

export type SelectedSet = Set<number>;

export type SelectedElements = {
  selectedJoints: SelectedSet; // Always zero or one joint. The set simplifies undo/redo.
  selectedMembers: SelectedSet;
};

/** Container for the drafting panel's element selection and hot element. */
@Injectable({ providedIn: 'root' })
export class SelectedElementsService {
  public readonly selectedElements: SelectedElements = {
    selectedJoints: new Set<number>(),
    selectedMembers: new Set<number>(),
  };

  public getSelectedJoint(bridge: BridgeModel): Joint | undefined {
    if (this.selectedElements.selectedJoints.size === 0) {
      return undefined;
    }
    for (const jointIndex of this.selectedElements.selectedJoints) {
      return bridge.joints[jointIndex];
    }
    return undefined; // never reached
  }

  public isJointSelected(joint: Joint): boolean {
    return this.selectedElements.selectedJoints.has(joint.index);
  }

  public isMemberSelected(member: Member): boolean {
    return this.selectedElements.selectedMembers.has(member.index);
  }
}
