import { TestBed } from '@angular/core/testing';
import { UndoManagerSessionStateService } from './undo-manager-session-state.service';
import { UndoManagerService } from './undo-manager.service';
import { SessionStateService } from '../../../shared/services/session-state.service';
import { BridgeService } from '../../../shared/services/bridge.service';
import { SelectedElementsService } from './selected-elements-service';
import { InventoryService } from '../../../shared/services/inventory.service';
import { AddJointCommand } from '../../controls/edit-command/add-joint.command';
import { Joint } from '../../../shared/classes/joint.model';
import { validateBridge } from '../../../shared/test/validation';
import { Member } from '../../../shared/classes/member.model';
import { AddMemberCommand } from '../../controls/edit-command/add-member.command';

describe('UndoManagerSessionStateService', () => {
  let service: UndoManagerSessionStateService;
  let bridgeService: BridgeService;
  let inventoryService: InventoryService;
  let selectedElementsService: SelectedElementsService;
  let undoManagerService: UndoManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UndoManagerSessionStateService,
        BridgeService,
        InventoryService,
        SelectedElementsService,
        SessionStateService,
        UndoManagerService,
      ],
    });
    service = TestBed.inject(UndoManagerSessionStateService);
    bridgeService = TestBed.inject(BridgeService);
    inventoryService = TestBed.inject(InventoryService);
    undoManagerService = TestBed.inject(UndoManagerService);
    selectedElementsService = TestBed.inject(SelectedElementsService);
  });

  it('services should be created', () => {
    expect(service).toBeTruthy();
    expect(bridgeService).toBeTruthy();
    expect(selectedElementsService).toBeTruthy();
    expect(undoManagerService).toBeTruthy();
  });

  it('should manage add joint correctly', () => {
    const originalJointCount = bridgeService.bridge.joints.length;
    const originalMemberCount = bridgeService.bridge.members.length;

    // Add joint A
    const jointA = new Joint(originalJointCount, 0, -2, false);
    const addJointA = AddJointCommand.create(jointA, bridgeService.bridge, selectedElementsService.selectedElements);
    undoManagerService.do(addJointA);

    checkBridge('joint A');

    // Add joint B
    const jointB = new Joint(originalJointCount + 1, 8, -2, false);
    const addJointB = AddJointCommand.create(jointB, bridgeService.bridge, selectedElementsService.selectedElements);

    undoManagerService.do(addJointB);

    checkBridge('joint B');
    expect(undoManagerService.done.length).toBe(2);
    expect(undoManagerService.undone.length).toBe(0);
    expect(bridgeService.bridge.joints.length).toBe(originalJointCount + 2);

    // Add a member between A and B
    const member = new Member(0, jointA, jointB, inventoryService.materials[0], inventoryService.getShape(0, 0));
    const addMember = AddMemberCommand.create(member, bridgeService.bridge, selectedElementsService.selectedElements);
    undoManagerService.do(addMember);

    checkBridge('member');
    expect(undoManagerService.done.length).toBe(3);
    expect(undoManagerService.undone.length).toBe(0);
    expect(bridgeService.bridge.members.length).toBe(originalMemberCount + 1);

    // Add joint C, which transects the member.
    const addJointC = new Joint(originalJointCount + 2, 4, -2, false);
    const commandC = AddJointCommand.create(addJointC, bridgeService.bridge, selectedElementsService.selectedElements);

    undoManagerService.do(commandC);

    checkBridge('joint C');
    expect(undoManagerService.done.length).toBe(4);
    expect(undoManagerService.undone.length).toBe(0);
    expect(bridgeService.bridge.joints.length).toBe(originalJointCount + 3);
    expect(bridgeService.bridge.members.length).toBe(originalMemberCount + 2);

    // Verify dehdrated service looks reasonable.
    const dehydrated = service.dehydrate();
    expect(dehydrated.done.length).toBe(4);
    expect(dehydrated.undone.length).toBe(0);

    // Undo the final splitting joint insertion.
    undoManagerService.undo();

    checkBridge('undo');
    expect(undoManagerService.done.length).toBe(3);
    expect(undoManagerService.undone.length).toBe(1);
    expect(bridgeService.bridge.joints.length).toBe(originalJointCount + 2);
    expect(bridgeService.bridge.members.length).toBe(originalMemberCount + 1);

    const dehydratedUndo = service.dehydrate();

    expect(dehydratedUndo.done.length).toBe(3);
    expect(dehydratedUndo.undone.length).toBe(1);

    // Clear and restore undo manager.
    undoManagerService.clear();
    service.rehydrate(dehydratedUndo);

    // Redo the joint add with splitting.
    undoManagerService.redo();

    checkBridge('redo');
    expect(undoManagerService.done.length).toBe(4);
    expect(undoManagerService.undone.length).toBe(0);
    expect(bridgeService.bridge.joints.length).toBe(originalJointCount + 3);
    expect(bridgeService.bridge.members.length).toBe(originalMemberCount + 2);
  });

  function checkBridge(tag: string) {
    const problems = validateBridge(bridgeService.bridge);
    expect(problems.length).withContext(`For '${tag}': ${problems}`).toBe(0);
  }
});
