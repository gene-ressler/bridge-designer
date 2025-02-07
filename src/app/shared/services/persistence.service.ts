import { Injectable } from "@angular/core";
import { DesignGridService, DesignGrid } from "./design-grid.service";
import { BridgeModel } from "../classes/bridge.model";
import { Joint } from "../classes/joint.model";
import { Member } from "../classes/member.model";
import { DesignConditions, DesignConditionsService } from "./design-conditions.service";
import { InventoryService } from "./inventory.service";
import { AnalysisSummary } from "./analysis.service";
import { Utility } from "../classes/utility";

const DELIMITER = '|';
const JOINT_COORD_LENGTH = 3;
const MEMBER_JOINT_LENGTH = 2;
const MEMBER_MATERIAL_LENGTH = 1;
const MEMBER_SECTION_LENGTH = 1;
const MEMBER_SIZE_LENGTH = 2;
const JOINT_COUNT_LENGTH = 2;
const MEMBER_COUNT_LENGTH = 3;
const SCENARIO_CODE_LENGTH = 10;
const YEAR_LENGTH = 4;

@Injectable({ providedIn: 'root' })
export class PersistenceService {
  constructor(
    private readonly designConditionsService: DesignConditionsService,
    private readonly inventoryService: InventoryService) { }

  getSaveSetAsString(saveSet: SaveSet): string {
    const chunks: string[] = [];
    const grid: Readonly<DesignGrid> = DesignGridService.FINEST_GRID;
    chunks.push(saveSet.bridge.version.toString().padStart(YEAR_LENGTH));
    chunks.push(saveSet.bridge.designConditions.codeLong.toString().padStart(SCENARIO_CODE_LENGTH));
    chunks.push(saveSet.bridge.joints.length.toString().padStart(JOINT_COUNT_LENGTH));
    chunks.push(saveSet.bridge.members.length.toString().padStart(MEMBER_COUNT_LENGTH));
    for (const joint of saveSet.bridge.joints) {
      chunks.push(grid.xformWorldToGrid(joint.x).toString().padStart(JOINT_COORD_LENGTH));
      chunks.push(grid.xformWorldToGrid(joint.y).toString().padStart(JOINT_COORD_LENGTH));
    }
    for (const member of saveSet.bridge.members) {
      chunks.push(member.a.number.toString().padStart(MEMBER_JOINT_LENGTH));
      chunks.push(member.b.number.toString().padStart(MEMBER_JOINT_LENGTH));
      chunks.push(member.material.index.toString().padStart(MEMBER_MATERIAL_LENGTH));
      chunks.push(member.shape.section.index.toString().padStart(MEMBER_SECTION_LENGTH));
      chunks.push(member.shape.sizeIndex.toString().padStart(MEMBER_SIZE_LENGTH));
    }
    for (let i = 0; i < saveSet.bridge.members.length; ++i) {
      const ratios = saveSet.analysisSummary.forceStrengthRatios[i];
      if (ratios === undefined) {
        chunks.push('--', DELIMITER, '--', DELIMITER);
      }
      else {
        chunks.push(ratios.compression.toFixed(2), DELIMITER, ratios.tension.toFixed(2), DELIMITER);
      }
    }
    chunks.push(saveSet.bridge.designedBy, DELIMITER);
    chunks.push(saveSet.bridge.projectId, DELIMITER);
    chunks.push(saveSet.bridge.iterationNumber.toString(), DELIMITER);
    chunks.push(saveSet.draftingPanelState.yLabels.toFixed(3), DELIMITER);
    return chunks.join('');
  }

  /** Parse the input string, mutating the save set to match. */
  parseSaveSetText(text: string, saveSet: SaveSet): void {
    return new SaveSetParser(
      text,
      this.designConditionsService,
      DesignGridService.FINEST_GRID,
      this.inventoryService).parse(saveSet);
  }
}

/** A tuple of mutable objects persisted and read back together. */
export class SaveSet {
  private constructor(
    public readonly bridge: BridgeModel,
    public readonly analysisSummary: AnalysisSummary = new AnalysisSummary(),
    public readonly draftingPanelState: DraftingPanelState = new DraftingPanelState()) { }

  public static createNew(designConditions: DesignConditions = DesignConditionsService.PLACEHOLDER_CONDITIONS) {
    return this.createForBridge(new BridgeModel(designConditions));
  }

  public static createForBridge(bridge: BridgeModel) {
    return new SaveSet(bridge);
  }

  clear(): void {
    this.bridge.clear();  
    this.analysisSummary.clear();
    this.draftingPanelState.clear();
  }
}

export class DraftingPanelState {
  public yLabels: number = 2;

  clear(): void {
    this.yLabels = 2; // Default for new bridge.
  }
}

class SaveSetParser {
  private readPtr = 0;

  constructor(
    private readonly text: string,
    private readonly designConditionsService: DesignConditionsService,
    private readonly grid: Readonly<DesignGrid>,
    private readonly inventoryService: InventoryService) { }

  /** Parse the input text, mutating the save set to match. If the parse fails, the save set is clear. */
  parse(saveSet: SaveSet): void {
    try {
      this.parseOrThrow(saveSet);
    } catch (error) {
      saveSet.clear();
      throw error;
    }
  }

  private parseOrThrow(saveSet: SaveSet) {
    saveSet.bridge.joints.length = saveSet.bridge.members.length = 0; // We're replacing everything.
    if (this.scanNumber(false, YEAR_LENGTH, 'bridge designer version') !== saveSet.bridge.version) {
      throw new Error('bridge design file version is not ' + saveSet.bridge.version);
    }
    const scenarioCode = this.scanNumber(false, SCENARIO_CODE_LENGTH, 'scenariow code');
    saveSet.bridge.designConditions = this.designConditionsService.getConditionsForCodeLong(scenarioCode);
    const jointCount = this.scanNumber(false, JOINT_COUNT_LENGTH, 'number of joints');
    const memberCount = this.scanNumber(false, MEMBER_COUNT_LENGTH, 'number of members');
    let joint: Joint | undefined;
    for (let i: number = 0, n: number = 1; i < jointCount; i++, n++) {
      const x = this.scanNumber(true, JOINT_COORD_LENGTH, `joint ${n} x-coordinate`);
      const y = this.scanNumber(true, JOINT_COORD_LENGTH, `joint ${n} y-coordinate`);
      if (i < saveSet.bridge.designConditions.prescribedJoints.length) {
        joint = saveSet.bridge.designConditions.prescribedJoints[i];
        if (x != this.grid.xformWorldToGrid(joint.x) || y != this.grid.xformWorldToGrid(joint.y)) {
          throw new Error(`bad prescribed joint ${n}`);
        }
      } else {
         joint = new Joint(i, this.grid.xformGridToWorld(x), this.grid.xformGridToWorld(y), false);
      }
      saveSet.bridge.joints.push(joint);
    }
    for (let i: number = 0, n: number = 1; i < memberCount; i++) {
      const jointAnumber = this.scanNumber(false, MEMBER_JOINT_LENGTH, `first joint of member ${n}`);
      const jointA = saveSet.bridge.getJointByNumber(jointAnumber);
      const jointBnumber = this.scanNumber(false, MEMBER_JOINT_LENGTH, `second joint of member ${n}`);
      const jointB = saveSet.bridge.getJointByNumber(jointBnumber);
      const materialIndex = this.scanNumber(false, MEMBER_MATERIAL_LENGTH, `material index of member ${n}`);
      const sectionIndex = this.scanNumber(false, MEMBER_SECTION_LENGTH, `section index of member ${n}`);
      const sizeIndex = this.scanNumber(false, MEMBER_SIZE_LENGTH, `size index of member ${n}`);
      const member = new Member(
        i,
        jointA,
        jointB,
        this.inventoryService.materials[materialIndex],
        this.inventoryService.getShape(sectionIndex, sizeIndex));
      saveSet.bridge.members.push(member);
    }
    for (let i: number = 0; i < memberCount; i++) {
      const compressionRatioText = this.scanToDelimiter('compression/strength ratio');
      const compressionRatio = SaveSetParser.extractRatioFromText(compressionRatioText);
      const tensionRatioText = this.scanToDelimiter('compression/strength ratio');
      const tensionRatio = SaveSetParser.extractRatioFromText(tensionRatioText);
      if (compressionRatio !== undefined && tensionRatio !== undefined) {
        saveSet.analysisSummary.setForceStrengthRatio(i, compressionRatio, tensionRatio);
      }
    }
    saveSet.bridge.designedBy = this.scanToDelimiter('name of designer');
    saveSet.bridge.projectId = this.scanToDelimiter('project ID');
    saveSet.bridge.iterationNumber = parseInt(this.scanToDelimiter('iteration'));
    saveSet.draftingPanelState.yLabels = parseFloat(this.scanToDelimiter('label position'));
  }

  static extractRatioFromText(text: string): number | undefined {
    const value = parseInt(text);
    return isNaN(value) ? undefined : value;
  }

  scanToDelimiter(what: string): string {
    const start = this.readPtr;
    while (true) {
      const ch = Utility.assertNotUndefined(this.text[this.readPtr], what);
      if (ch === DELIMITER) {
        break;
      }
      this.readPtr++;
    }
    return this.text.slice(start, this.readPtr++);
  };

  scanNumber(allowSign: boolean, width: number, what: string): number {
    let val: number = 0;
    let isNegated = false;
    while (width > 0 && this.text[this.readPtr] === ' ') {
      width--;
      this.readPtr++;
    }
    if (allowSign && width >= 2 && this.text[this.readPtr] == '-') {
      width--;
      this.readPtr++;
      isNegated = true;
    }
    while (width > 0) {
      const digitVal = parseInt(this.text[this.readPtr]);
      if (Number.isNaN(digitVal)) {
        throw `Couldn't scan ${what}`;
      }
      val = val * 10 + digitVal;
      width--;
      this.readPtr++;
    }
    return isNegated ? -val : val;
  }
}
