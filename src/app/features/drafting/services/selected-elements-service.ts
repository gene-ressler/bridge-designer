import { Injectable } from '@angular/core';
import { BridgeModel } from '../../../shared/classes/bridge.model';
import { Joint } from '../../../shared/classes/joint.model';
import { Member } from '../../../shared/classes/member.model';

export type SelectedSet = Set<number>;

export type SelectedElements = {
  selectedJoints: SelectedSet;  // Always zero or one joint. The set simplifies undo/redo.
  selectedMembers: SelectedSet;
};

export type SelectableBridge = {
  bridge: BridgeModel;
  selectedElements: SelectedElements;
};

/** Container for the drafting panel's element selection and hot element. */
@Injectable({ providedIn: 'root' })
export class SelectedElementsService {
  public readonly selectedElements: SelectedElements = {
    selectedJoints: new Set<number>(),
    selectedMembers: new Set<number>(),
  };

  public isJointSelected(joint: Joint): boolean {
    return this.selectedElements.selectedJoints.has(joint.index);
  }

  public isMemberSelected(member: Member): boolean {
    return this.selectedElements.selectedMembers.has(member.index);
  }
}
