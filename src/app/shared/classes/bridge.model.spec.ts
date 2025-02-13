import { BridgeModel } from './bridge.model';
import { DesignConditions } from '../services/design-conditions.service';
import { Joint } from './joint.model';
import { Member } from './member.model';
import { InventoryService } from '../services/inventory.service';

describe('BridgeModel', () => {
  const inventoryService = new InventoryService();

  describe('createClone', () => {
    it('should create a clone of the bridge model', () => {
      const originalBridge = new BridgeModel(DesignConditions.createPlaceholderConditions());
      originalBridge.projectName = 'Original Bridge';
      originalBridge.projectId = '123';
      originalBridge.designedBy = 'Engineer';
      originalBridge.iteration = 2;
      originalBridge.joints.push(new Joint(0, 6, 7, false));
      originalBridge.joints.push(new Joint(1, 8, 9, false));
      originalBridge.joints.push(new Joint(2, 4, 5, false));
      const material = inventoryService.materials[0];
      const shape = inventoryService.getShape(0, 0);
      originalBridge.members.push(new Member(0, originalBridge.joints[0], originalBridge.joints[1], material, shape));
      originalBridge.members.push(new Member(1, originalBridge.joints[1], originalBridge.joints[2], material, shape));
      originalBridge.members.push(new Member(2, originalBridge.joints[2], originalBridge.joints[0], material, shape));

      const clonedBridge = BridgeModel.createClone(originalBridge);

      expect(clonedBridge.projectName).toBe(originalBridge.projectName);
      expect(clonedBridge.projectId).toBe(originalBridge.projectId);
      expect(clonedBridge.designedBy).toBe(originalBridge.designedBy);
      expect(clonedBridge.iteration).toBe(originalBridge.iteration);
      expect(clonedBridge.joints.length).toBe(originalBridge.joints.length);
      expect(clonedBridge.members.length).toBe(originalBridge.members.length);
      for (const member of clonedBridge.members) {
        expect(clonedBridge.joints.findIndex(joint => joint === member.a)).toBe(member.a.index);
        expect(clonedBridge.joints.findIndex(joint => joint === member.b)).toBe(member.b.index);
      }
    });
  });
});