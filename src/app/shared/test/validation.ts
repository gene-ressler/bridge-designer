import { BridgeModel } from '../classes/bridge.model';
import { Joint } from '../classes/joint.model';

/** Returns a list of structure violations of the given bridge. Empthy is good. */
export function validateBridge(bridge: BridgeModel): string[] {
  const problems = [];
  const joints = bridge.joints;
  const jointSet = new Set<Joint>();
  const jointCount = joints.length;
  for (let i = 0; i < jointCount; ++i) {
    if (jointSet.has(joints[i])) {
      problems.push(`duplicate joint ${joints[i]}`);
    }
    jointSet.add(joints[i]);
  }
  const members = bridge.members;
  const memberCount = members.length;
  for (let i = 0; i < jointCount; ++i) {
    if (joints[i].index !== i) {
      problems.push(`joint at ${i} has .index ${joints[i].index}`);
    }
  }
  for (let i = 0; i < memberCount; ++i) {
    if (members[i].index !== i) {
      problems.push(`member at ${i} has .index ${members[i].index}`);
    }
  }
  const memberKeySet = new Set<string>();
  for (let i = 0; i < memberCount; ++i) {
    const key = members[i].key;
    if (memberKeySet.has(key)) {
      problems.push(`duplicate member key ${key}`);
    }
    memberKeySet.add(key);
    if (members[i].a === members[i].b) {
      problems.push(`member at ${i} has duplicate joints ${members[i].a}`);
    }
    if (!jointSet.has(members[i].a)) {
      problems.push(`member at ${i} .a refers to external joint ${members[i].a}`);
    }
    if (!jointSet.has(members[i].b)) {
      problems.push(`member at ${i} .b refers to external joint ${members[i].b}`);
    }
  }
  return problems;
}
