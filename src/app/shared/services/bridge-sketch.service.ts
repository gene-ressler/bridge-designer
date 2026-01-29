/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { Injectable } from '@angular/core';
import { BridgeSketchModel } from '../classes/bridge-sketch.model';
import { Point2D } from '../classes/graphics';
import { DesignConditions } from './design-conditions.service';
import { BridgeSketchDataService } from './bridge-sketch-data.service';
import { Utility } from '../classes/utility';

@Injectable({ providedIn: 'root' })
export class BridgeSketchService {
  private readonly cache = new Map<string, BridgeSketchModel[]>();

  constructor(private readonly bridgeSketchDataService: BridgeSketchDataService) {}

  public getSketchList(conditions: DesignConditions): BridgeSketchModel[] {
    const key = conditions.tagGeometryOnly;
    const models = this.cache.get(key);
    if (models) {
      return models;
    }
    const newModels = this.createModelList(conditions);
    this.cache.set(key, newModels);
    return newModels;
  }

  /** Returns sketch for given conditions and sketch name or absent if none found. */
  public getSketch(conditions: DesignConditions, name: string): BridgeSketchModel {
    return this.getSketchList(conditions).find(sketch => sketch.name === name) || BridgeSketchModel.ABSENT;
  }

  private createModelList(conditions: DesignConditions): BridgeSketchModel[] {
    const models = [BridgeSketchModel.ABSENT];
    // Add all available computed sketches.
    if (conditions.isArch) {
      if (conditions.underClearance <= 16) {
        // Standard arches.
        models.push(
          this.populatePrattContinuousArch(new BridgeSketchModel('Continuous arch - Pratt', conditions)),
          this.populateHoweContinuousArch(new BridgeSketchModel('Continuous arch - Howe', conditions)),
          this.populateWarrenContinuousArch(new BridgeSketchModel('Continuous arch - Warren', conditions)),
        );
        // 3-hinge arches if odd number of deck joints.
        if (conditions.loadedJointCount % 2 === 1) {
          models.push(
            this.populatePratt3HingeArch(new BridgeSketchModel('3-hinge arch - Pratt', conditions)),
            this.populateHowe3HingeArch(new BridgeSketchModel('3-hinge arch - Howe', conditions)),
            this.populateWarren3HingeArch(new BridgeSketchModel('3-hinge arch - Warren', conditions)),
          );
        }
      }
    } else if (conditions.anchorageCount === 0 && !conditions.isPier) {
      if (conditions.overClearance >= DesignConditions.PANEL_SIZE_WORLD) {
        // Through trusses.
        models.push(
          this.populatePrattThruTruss(new BridgeSketchModel('Through truss - Pratt', conditions)),
          this.populateHoweThruTruss(new BridgeSketchModel('Through truss - Howe', conditions)),
          this.populateWarrenThruTruss(new BridgeSketchModel('Through truss - Warren', conditions)),
        );
      }
      if (conditions.underClearance >= DesignConditions.PANEL_SIZE_WORLD) {
        // Deck trusses
        models.push(
          this.populatePrattDeckTruss(new BridgeSketchModel('Deck truss - Pratt', conditions)),
          this.populateHoweDeckTruss(new BridgeSketchModel('Deck truss - Howe', conditions)),
          this.populateWarrenDeckTruss(new BridgeSketchModel('Deck truss - Warren', conditions)),
        );
      }
    } else if (
      conditions.anchorageCount > 0 &&
      !conditions.isPier &&
      conditions.underClearance >= DesignConditions.PANEL_SIZE_WORLD / 2
    ) {
      // Anchored cable bridges.
      models.push(
        this.populateCableStayedWarrenTruss(new BridgeSketchModel('Cable-stayed Warren truss', conditions)),
        this.populateSuspendedWarrenTruss(new BridgeSketchModel('Suspended Warren truss', conditions)),
      );
    }
    this.bridgeSketchDataService.addSketchesFromDataForConditions(models, conditions);
    return models;
  }

  private populatePrattThruTruss(sketch: BridgeSketchModel): BridgeSketchModel {
    return this.populatePrattThruTrussGeometry(sketch, DesignConditions.PANEL_SIZE_WORLD);
  }

  private populatePrattDeckTruss(sketch: BridgeSketchModel): BridgeSketchModel {
    // Pratt deck geometry is inverted Howe thru.
    return this.populateHoweThruTrussGeometry(sketch, -DesignConditions.PANEL_SIZE_WORLD);
  }

  private populateHoweThruTruss(sketch: BridgeSketchModel): BridgeSketchModel {
    return this.populateHoweThruTrussGeometry(sketch, DesignConditions.PANEL_SIZE_WORLD);
  }

  private populateHoweDeckTruss(sketch: BridgeSketchModel): BridgeSketchModel {
    // Howe deck geometry is inverted Pratt thru.
    return this.populatePrattThruTrussGeometry(sketch, -DesignConditions.PANEL_SIZE_WORLD);
  }

  private populateWarrenThruTruss(sketch: BridgeSketchModel): BridgeSketchModel {
    return this.populateWarrenTrussGeometry(sketch, DesignConditions.PANEL_SIZE_WORLD);
  }

  private populateWarrenDeckTruss(sketch: BridgeSketchModel): BridgeSketchModel {
    // Warren deck is inverted Warren thru.
    return this.populateWarrenTrussGeometry(sketch, -DesignConditions.PANEL_SIZE_WORLD);
  }

  private populatePrattContinuousArch(sketch: BridgeSketchModel): BridgeSketchModel {
    this.populateDeck(sketch);
    const conditions = sketch.designConditions;
    const joints = sketch.joints;
    const members = sketch.members;
    const abutmentArchJointsIndex = conditions.archJointIndex;
    const firstDeckJoint = 0;
    const lastDeckJoint = conditions.panelCount;

    // p1 and p2 are used to find a parabolic arc
    const p1 = joints[abutmentArchJointsIndex];
    const p2 = joints[Math.trunc((firstDeckJoint + lastDeckJoint) / 2)];
    const p3 = joints[abutmentArchJointsIndex + 1];

    const xMid = 0.5 * (p1.x + p3.x);
    const x1 = p1.x - xMid;
    const y1 = p1.y;
    const x2 = p2.x - xMid;
    // Peak of arc is 1/4 of arch height below deck
    const y2 = p2.y - 0.25 * (p2.y - p1.y);

    // Find coefficients for y = a * x^2 + b
    const a = (y2 - y1) / (x2 * x2 - x1 * x1);
    const b = y1 - a * x1 * x1;

    // Add joints on the parabola, one beneath each deck joint
    const firstArchJoint = joints.length;
    for (let i: number = firstDeckJoint + 1; i < lastDeckJoint; i++) {
      const x = joints[i].x - xMid;
      const y = a * x * x + b;
      joints.push(new Point2D(joints[i].x, BridgeSketchService.roundToGridIncrement(y)));
    }
    const lastArchJoint = joints.length - 1;

    // Add arch members and also the two verticals between deck and arch at each abutment
    members.push(
      { a: joints[firstDeckJoint], b: joints[abutmentArchJointsIndex] },
      { a: joints[abutmentArchJointsIndex], b: joints[firstArchJoint] },
    );

    for (let i: number = firstArchJoint; i < lastArchJoint; i++) {
      members.push({ a: joints[i], b: joints[i + 1] });
    }

    members.push(
      { a: joints[lastArchJoint], b: joints[abutmentArchJointsIndex + 1] },
      { a: joints[abutmentArchJointsIndex + 1], b: joints[lastDeckJoint] },
    );

    // Add the remaining verticals and diagonals
    let leftTop: number = firstDeckJoint + 1;
    let rightTop: number = lastDeckJoint - 1;
    let leftBottom: number = firstArchJoint;
    let rightBottom: number = lastArchJoint;

    while (leftTop < rightTop) {
      members.push(
        { a: joints[leftTop], b: joints[leftBottom] },
        { a: joints[leftTop - 1], b: joints[leftBottom] },
        { a: joints[rightTop], b: joints[rightBottom] },
        { a: joints[rightTop + 1], b: joints[rightBottom] },
      );
      leftTop++;
      rightTop--;
      leftBottom++;
      rightBottom--;
    }

    // Final two diagonals
    members.push(
      { a: joints[leftTop - 1], b: joints[leftBottom] },
      { a: joints[rightTop + 1], b: joints[rightBottom] },
    );

    // Center vertical, if any
    if (leftTop === rightTop) {
      members.push({ a: joints[leftTop], b: joints[leftBottom] });
    }
    return sketch;
  }

  private populateHoweContinuousArch(sketch: BridgeSketchModel): BridgeSketchModel {
    this.populateDeck(sketch);
    const conditions = sketch.designConditions;
    const joints = sketch.joints;
    const members = sketch.members;
    const abutmentArchJointsIndex = conditions.archJointIndex;
    const firstDeckJoint = 0;
    const lastDeckJoint = conditions.panelCount;

    // p1 and p2 are used to find a parabolic arc
    const p1 = joints[abutmentArchJointsIndex];
    const p2 = joints[Math.trunc((firstDeckJoint + lastDeckJoint) / 2)];
    const p3 = joints[abutmentArchJointsIndex + 1];

    const xMid = 0.5 * (p1.x + p3.x);
    const x1 = p1.x - xMid;
    const y1 = p1.y;
    const x2 = p2.x - xMid;
    // Peak of arc is 3/4 of arch height
    const y2 = p2.y - 0.25 * (p2.y - p1.y);

    // Find coefficients for y = a * x^2 + b
    const a = (y2 - y1) / (x2 * x2 - x1 * x1);
    const b = y1 - a * x1 * x1;

    // Add joints on the parabola, one beneath each deck joint
    const firstArchJoint = joints.length;
    for (let i: number = firstDeckJoint + 1; i < lastDeckJoint; i++) {
      const x = joints[i].x - xMid;
      const y = a * x * x + b;
      joints.push(new Point2D(joints[i].x, BridgeSketchService.roundToGridIncrement(y)));
    }
    const lastArchJoint = joints.length - 1;

    // Add arch members and also the two verticals between deck and arch at each abutment
    members.push(
      { a: joints[firstDeckJoint], b: joints[abutmentArchJointsIndex] },
      { a: joints[firstDeckJoint + 1], b: joints[abutmentArchJointsIndex] },
      { a: joints[firstArchJoint], b: joints[abutmentArchJointsIndex] },
    );

    for (let i: number = firstArchJoint; i < lastArchJoint; i++) {
      members.push({ a: joints[i], b: joints[i + 1] });
    }

    members.push(
      { a: joints[lastArchJoint], b: joints[abutmentArchJointsIndex + 1] },
      { a: joints[lastDeckJoint - 1], b: joints[abutmentArchJointsIndex + 1] },
      { a: joints[lastDeckJoint], b: joints[abutmentArchJointsIndex + 1] },
    );

    // Add the remaining verticals and diagonals
    let leftTop: number = firstDeckJoint + 1;
    let rightTop: number = lastDeckJoint - 1;
    let leftBottom: number = firstArchJoint;
    let rightBottom: number = lastArchJoint;

    while (leftTop < rightTop) {
      members.push(
        { a: joints[leftTop], b: joints[leftBottom] },
        { a: joints[leftTop + 1], b: joints[leftBottom] },
        { a: joints[rightTop - 1], b: joints[rightBottom] },
        { a: joints[rightTop], b: joints[rightBottom] },
      );
      leftTop++;
      rightTop--;
      leftBottom++;
      rightBottom--;
    }

    // Center vertical, if any
    if (leftTop === rightTop) {
      members.push({ a: joints[leftTop], b: joints[leftBottom] });
    }
    return sketch;
  }

  private populateWarrenContinuousArch(sketch: BridgeSketchModel): BridgeSketchModel {
    this.populateDeck(sketch);
    const conditions = sketch.designConditions;
    const joints = sketch.joints;
    const members = sketch.members;
    const abutmentArchJointsIndex = conditions.archJointIndex;
    const firstDeckJoint = 0;
    const lastDeckJoint = conditions.panelCount;

    // p1 and p2 are used to find a parabolic arc
    const p1 = joints[abutmentArchJointsIndex];
    const p2 = joints[Math.trunc((firstDeckJoint + lastDeckJoint) / 2)];
    const p3 = joints[abutmentArchJointsIndex + 1];

    const xMid = 0.5 * (p1.x + p3.x);
    const x1 = p1.x - xMid;
    const y1 = p1.y;
    const x2 = p2.x - xMid;
    // Peak of arc is 1/4 of arch height below deck
    const y2 = p2.y - 0.25 * (p2.y - p1.y);

    // Find coefficients for y = a * x^2 + b
    const a = (y2 - y1) / (x2 * x2 - x1 * x1);
    const b = y1 - a * x1 * x1;

    // Add joints on the parabola, one beneath each deck joint
    const firstArchJoint = joints.length;
    for (let i: number = firstDeckJoint; i < lastDeckJoint; i++) {
      const x0 = joints[i].x + 0.5 * DesignConditions.PANEL_SIZE_WORLD;
      const x = x0 - xMid;
      const y = a * x * x + b;
      joints.push(new Point2D(x0, BridgeSketchService.roundToGridIncrement(y)));
    }
    const lastArchJoint = joints.length - 1;

    // Add arch members and also the two verticals between deck and arch at each abutment
    members.push(
      { a: joints[firstDeckJoint], b: joints[abutmentArchJointsIndex] },
      { a: joints[abutmentArchJointsIndex], b: joints[firstArchJoint] },
    );

    for (let i: number = firstArchJoint; i < lastArchJoint; i++) {
      members.push({ a: joints[i], b: joints[i + 1] });
    }

    members.push(
      { a: joints[lastArchJoint], b: joints[abutmentArchJointsIndex + 1] },
      { a: joints[abutmentArchJointsIndex + 1], b: joints[lastDeckJoint] },
    );

    let deckIndex: number = firstDeckJoint;
    let archIndex: number = firstArchJoint;
    while (deckIndex < lastDeckJoint) {
      members.push({ a: joints[deckIndex], b: joints[archIndex] }, { a: joints[deckIndex + 1], b: joints[archIndex] });
      deckIndex++;
      archIndex++;
    }

    return sketch;
  }

  private populatePratt3HingeArch(sketch: BridgeSketchModel): BridgeSketchModel {
    this.populateDeck(sketch);
    const conditions = sketch.designConditions;
    const joints = sketch.joints;
    const members = sketch.members;
    const abutmentArchJointsIndex = conditions.archJointIndex;
    const firstDeckJoint = 0;
    const lastDeckJoint = conditions.panelCount;

    // p1 and p2 are used to find a parabolic arc
    const p1 = joints[abutmentArchJointsIndex];
    const p2 = joints[Math.trunc((firstDeckJoint + lastDeckJoint) / 2)];
    const p3 = joints[abutmentArchJointsIndex + 1];

    const xMid = 0.5 * (p1.x + p3.x);
    const x1 = p1.x - xMid;
    const y1 = p1.y;
    const x2 = p2.x - xMid;
    // Peak of arc is 1/4 of arch height below deck
    const y2 = p2.y - 0.25 * (p2.y - p1.y);

    // Find coefficients for y = a * x^2 + b
    const a = (y2 - y1) / (x2 * x2 - x1 * x1);
    const b = y1 - a * x1 * x1;

    // Add joints on the parabola, one beneath each deck joint
    const firstArchJoint = joints.length;
    let archJointLeftOfHinge = 0;
    const hinge = Math.trunc((firstDeckJoint + lastDeckJoint) / 2);

    for (let i: number = firstDeckJoint + 1; i < lastDeckJoint; i++) {
      if (i === hinge) {
        archJointLeftOfHinge = joints.length - 1;
      } else {
        const x = joints[i].x - xMid;
        const y = a * x * x + b;
        joints.push(new Point2D(joints[i].x, BridgeSketchService.roundToGridIncrement(y)));
      }
    }
    const lastArchJoint = joints.length - 1;

    // Add arch members and also the two verticals between deck and arch at each abutment
    members.push(
      { a: joints[firstDeckJoint], b: joints[abutmentArchJointsIndex] },
      { a: joints[abutmentArchJointsIndex], b: joints[firstArchJoint] },
    );

    for (let i: number = firstArchJoint; i < archJointLeftOfHinge; i++) {
      members.push({ a: joints[i], b: joints[i + 1] });
    }

    members.push(
      { a: joints[archJointLeftOfHinge], b: joints[hinge] },
      { a: joints[hinge], b: joints[archJointLeftOfHinge + 1] },
    );

    for (let i: number = archJointLeftOfHinge + 1; i < lastArchJoint; i++) {
      members.push({ a: joints[i], b: joints[i + 1] });
    }

    members.push(
      { a: joints[lastArchJoint], b: joints[abutmentArchJointsIndex + 1] },
      { a: joints[abutmentArchJointsIndex + 1], b: joints[lastDeckJoint] },
    );

    // Add the remaining verticals and diagonals
    let leftTop: number = firstDeckJoint + 1;
    let rightTop: number = lastDeckJoint - 1;
    let leftBottom: number = firstArchJoint;
    let rightBottom: number = lastArchJoint;

    while (leftTop < rightTop) {
      members.push(
        { a: joints[leftTop], b: joints[leftBottom] },
        { a: joints[leftTop - 1], b: joints[leftBottom] },
        { a: joints[rightTop], b: joints[rightBottom] },
        { a: joints[rightTop + 1], b: joints[rightBottom] },
      );
      leftTop++;
      rightTop--;
      leftBottom++;
      rightBottom--;
    }

    return sketch;
  }

  private populateHowe3HingeArch(sketch: BridgeSketchModel): BridgeSketchModel {
    this.populateDeck(sketch);
    const conditions = sketch.designConditions;
    const joints = sketch.joints;
    const members = sketch.members;
    const abutmentArchJointsIndex = conditions.archJointIndex;
    const firstDeckJoint = 0;
    const lastDeckJoint = conditions.panelCount;

    // p1 and p2 are used to find a parabolic arc
    const p1 = joints[abutmentArchJointsIndex];
    const p2 = joints[Math.trunc((firstDeckJoint + lastDeckJoint) / 2)];
    const p3 = joints[abutmentArchJointsIndex + 1];

    const xMid = 0.5 * (p1.x + p3.x);
    const x1 = p1.x - xMid;
    const y1 = p1.y;
    const x2 = p2.x - xMid;
    // Peak of arc is 3/4 of arch height
    const y2 = p2.y - 0.25 * (p2.y - p1.y);

    // Find coefficients for y = a * x^2 + b
    const a = (y2 - y1) / (x2 * x2 - x1 * x1);
    const b = y1 - a * x1 * x1;

    // Add joints on the parabola, one beneath each deck joint
    const firstArchJoint = joints.length;
    for (let i: number = firstDeckJoint + 1; i < lastDeckJoint; i++) {
      if (i !== Math.trunc((firstDeckJoint + lastDeckJoint) / 2)) {
        const x = joints[i].x - xMid;
        const y = a * x * x + b;
        joints.push(new Point2D(joints[i].x, BridgeSketchService.roundToGridIncrement(y)));
      }
    }
    const lastArchJoint = joints.length - 1;

    // Add arch members and also the two verticals between deck and arch at each abutment
    members.push(
      { a: joints[firstDeckJoint], b: joints[abutmentArchJointsIndex] },
      { a: joints[firstDeckJoint + 1], b: joints[abutmentArchJointsIndex] },
      { a: joints[firstArchJoint], b: joints[abutmentArchJointsIndex] },
    );

    let leftArch: number = firstArchJoint + 1;
    let rightArch: number = lastArchJoint - 1;
    while (leftArch < rightArch) {
      members.push(
        { a: joints[leftArch - 1], b: joints[leftArch] },
        { a: joints[rightArch + 1], b: joints[rightArch] },
      );
      leftArch++;
      rightArch--;
    }

    members.push(
      { a: joints[lastArchJoint], b: joints[abutmentArchJointsIndex + 1] },
      { a: joints[lastDeckJoint - 1], b: joints[abutmentArchJointsIndex + 1] },
      { a: joints[lastDeckJoint], b: joints[abutmentArchJointsIndex + 1] },
    );

    // Add the remaining verticals and diagonals
    let leftTop: number = firstDeckJoint + 1;
    let rightTop: number = lastDeckJoint - 1;
    let leftBottom: number = firstArchJoint;
    let rightBottom: number = lastArchJoint;

    while (leftTop < rightTop) {
      members.push(
        { a: joints[leftTop], b: joints[leftBottom] },
        { a: joints[leftTop + 1], b: joints[leftBottom] },
        { a: joints[rightTop - 1], b: joints[rightBottom] },
        { a: joints[rightTop], b: joints[rightBottom] },
      );
      leftTop++;
      rightTop--;
      leftBottom++;
      rightBottom--;
    }

    return sketch;
  }

  private populateWarren3HingeArch(sketch: BridgeSketchModel): BridgeSketchModel {
    this.populateDeck(sketch);
    const conditions = sketch.designConditions;
    const joints = sketch.joints;
    const members = sketch.members;
    const abutmentArchJointsIndex = conditions.archJointIndex;
    const firstDeckJoint = 0;
    const lastDeckJoint = conditions.panelCount;

    // p1 and p2 are used to find a parabolic arc
    const p1 = joints[abutmentArchJointsIndex];
    const p2 = joints[Math.trunc((firstDeckJoint + lastDeckJoint) / 2)];
    const p3 = joints[abutmentArchJointsIndex + 1];

    const xMid = 0.5 * (p1.x + p3.x);
    const x1 = p1.x - xMid;
    const y1 = p1.y;
    const x2 = p2.x - xMid;
    // Peak of arc is 1/4 of arch height below deck
    const y2 = p2.y - 0.25 * (p2.y - p1.y);

    // Find coefficients for y = a * x^2 + b
    const a = (y2 - y1) / (x2 * x2 - x1 * x1);
    const b = y1 - a * x1 * x1;

    // Add joints on the parabola, one beneath each deck joint
    const firstArchJoint = joints.length;
    for (let i: number = firstDeckJoint; i < lastDeckJoint; i++) {
      const x0 = joints[i].x + 0.5 * DesignConditions.PANEL_SIZE_WORLD;
      const x = x0 - xMid;
      const y = a * x * x + b;
      joints.push(new Point2D(x0, BridgeSketchService.roundToGridIncrement(y)));
    }
    const lastArchJoint = joints.length - 1;

    // Add arch members and also the two verticals between deck and arch at each abutment
    members.push(
      { a: joints[firstDeckJoint], b: joints[abutmentArchJointsIndex] },
      { a: joints[abutmentArchJointsIndex], b: joints[firstArchJoint] },
    );

    for (let i: number = firstArchJoint; i < lastArchJoint; i++) {
      // Skip the middle member to make the hinge
      const iMiddle = Math.trunc((firstArchJoint + lastArchJoint) / 2);
      if (i !== iMiddle) {
        members.push({ a: joints[i], b: joints[i + 1] });
      }
    }

    members.push(
      { a: joints[lastArchJoint], b: joints[abutmentArchJointsIndex + 1] },
      { a: joints[abutmentArchJointsIndex + 1], b: joints[lastDeckJoint] },
    );

    let deckIndex: number = firstDeckJoint;
    let archIndex: number = firstArchJoint;
    while (deckIndex < lastDeckJoint) {
      members.push({ a: joints[deckIndex], b: joints[archIndex] }, { a: joints[deckIndex + 1], b: joints[archIndex] });
      deckIndex++;
      archIndex++;
    }

    return sketch;
  }

  private populateCableStayedWarrenTruss(sketch: BridgeSketchModel): BridgeSketchModel {
    this.populateDeck(sketch);
    this.populateWarrenTrussGeometry(sketch, -DesignConditions.PANEL_SIZE_WORLD / 2);
    const conditions = sketch.designConditions;
    const joints = sketch.joints;
    const members = sketch.members;
    if (conditions.anchorageCount > 0) {
      const leftAbutmentJoint = joints[0];
      const leftAnchorageJoint = joints[conditions.panelCount + 1];
      const mastJoint = new Point2D(leftAbutmentJoint.x, leftAbutmentJoint.y + 2 * DesignConditions.PANEL_SIZE_WORLD);
      joints.push(mastJoint);
      members.push({ a: mastJoint, b: leftAbutmentJoint }, { a: mastJoint, b: leftAnchorageJoint });
      for (let i: number = 1; i <= conditions.panelCount / 2; i++) {
        members.push({ a: mastJoint, b: joints[i] });
      }
    }
    if (conditions.anchorageCount > 1) {
      const rightAbutmentJoint = joints[conditions.panelCount];
      const rightAnchorageJoint = joints[conditions.panelCount + 2];
      const mastJoint = new Point2D(rightAbutmentJoint.x, rightAbutmentJoint.y + 2 * DesignConditions.PANEL_SIZE_WORLD);
      joints.push(mastJoint);
      members.push({ a: mastJoint, b: rightAbutmentJoint }, { a: mastJoint, b: rightAnchorageJoint });
      for (let i: number = 1; i <= conditions.panelCount / 2; i++) {
        members.push({ a: mastJoint, b: joints[conditions.panelCount - i] });
      }
    }
    return sketch;
  }

  private populateSuspendedWarrenTruss(sketch: BridgeSketchModel): BridgeSketchModel {
    this.populateDeck(sketch);
    this.populateWarrenTrussGeometry(sketch, -DesignConditions.PANEL_SIZE_WORLD / 2);
    const conditions = sketch.designConditions;
    const joints = sketch.joints;
    const members = sketch.members;

    const leftAbutmentJoint = joints[0];
    const leftAnchorageJoint = joints[conditions.panelCount + 1];
    const leftMastJoint = new Point2D(leftAbutmentJoint.x, leftAbutmentJoint.y + 2 * DesignConditions.PANEL_SIZE_WORLD);
    joints.push(leftMastJoint);
    members.push({ a: leftMastJoint, b: leftAbutmentJoint }, { a: leftMastJoint, b: leftAnchorageJoint });
    const rightAbutmentJoint = joints[conditions.panelCount];
    if (conditions.anchorageCount === 2) {
      const rightAnchorageJoint = joints[conditions.loadedJointCount + 1];
      const rightMastJoint = new Point2D(
        rightAbutmentJoint.x,
        rightAbutmentJoint.y + 2 * DesignConditions.PANEL_SIZE_WORLD,
      );
      joints.push(rightMastJoint);
      members.push({ a: rightMastJoint, b: rightAbutmentJoint }, { a: rightMastJoint, b: rightAnchorageJoint });

      const x0 = 0.5 * (leftMastJoint.x + rightMastJoint.x);
      const xb = rightMastJoint.x - x0;
      const yb = rightMastJoint.y;
      const aPt = joints[Math.trunc((conditions.panelCount + 1) / 2)];
      const xa = aPt.x - x0;
      const ya = aPt.y + 1.0;
      const a = (ya - yb) / (xa * xa - xb * xb);
      const b = ya - a * xa * xa;
      let x: number = xb - DesignConditions.PANEL_SIZE_WORLD;
      let lastJoint = rightMastJoint;

      for (let i: number = conditions.panelCount - 1; i > 0; i--) {
        const y = a * x * x + b;
        const currentJoint = new Point2D(x0 + x, BridgeSketchService.roundToGridIncrement(y));
        joints.push(currentJoint);
        members.push({ a: joints[i], b: currentJoint }, { a: lastJoint, b: currentJoint });
        x -= DesignConditions.PANEL_SIZE_WORLD;
        lastJoint = currentJoint;
      }
      members.push({ a: lastJoint, b: leftMastJoint });
    }
    if (conditions.anchorageCount === 1) {
      const x0 = rightAbutmentJoint.x;
      const xa = leftMastJoint.x;
      const a = leftMastJoint.y / Utility.sqr(xa - x0);
      let x: number = x0 - DesignConditions.PANEL_SIZE_WORLD;
      let lastJoint = rightAbutmentJoint;
      for (let i: number = conditions.panelCount - 1; i > 0; i--) {
        const y = BridgeSketchService.roundToGridIncrement(a * Utility.sqr(x - x0));
        if (y === joints[i].y) {
          lastJoint = joints[i]; // Low end of curve is on the deck.
        } else {
          const currentJoint = new Point2D(x, y);
          joints.push(currentJoint);
          members.push({ a: joints[i], b: currentJoint }, { a: lastJoint, b: currentJoint });
          lastJoint = currentJoint;
        }
        x -= DesignConditions.PANEL_SIZE_WORLD;
      }
      members.push({ a: lastJoint, b: leftMastJoint });
    }
    return sketch;
  }

  // -------- Parameterized populators for symmetric variants.

  private populatePrattThruTrussGeometry(sketch: BridgeSketchModel, jointY: number): BridgeSketchModel {
    this.populateDeck(sketch);
    const conditions = sketch.designConditions;
    const joints = sketch.joints;
    const members = sketch.members;
    const iFirstBottomJoint = 0;
    const iLastBottomJoint = conditions.panelCount;
    const iFirstTopJoint = joints.length;
    for (let i: number = iFirstBottomJoint + 1; i < iLastBottomJoint; i++) {
      sketch.joints.push(new Point2D(joints[i].x, jointY));
    }
    const iLastTopJoint = joints.length - 1;
    members.push({ a: joints[iFirstBottomJoint], b: joints[iFirstTopJoint] });
    for (let i: number = iFirstTopJoint; i < iLastTopJoint; i++) {
      members.push({ a: joints[i], b: joints[i + 1] });
    }
    members.push({ a: joints[iLastBottomJoint], b: joints[iLastTopJoint] });
    let iLeftTop: number = iFirstTopJoint;
    let iRightTop: number = iLastTopJoint;
    let iLeftBottom: number = iFirstBottomJoint + 1;
    let iRightBottom: number = iLastBottomJoint - 1;
    while (iLeftTop < iRightTop) {
      members.push({ a: joints[iLeftTop], b: joints[iLeftBottom] });
      members.push({ a: joints[iLeftTop], b: joints[iLeftBottom + 1] });
      members.push({ a: joints[iRightTop], b: joints[iRightBottom] });
      members.push({ a: joints[iRightTop], b: joints[iRightBottom - 1] });
      iLeftTop++;
      iRightTop--;
      iLeftBottom++;
      iRightBottom--;
    }
    if (iLeftTop === iRightTop) {
      members.push({ a: joints[iLeftTop], b: joints[iLeftBottom] });
    }
    return sketch;
  }

  private populateHoweThruTrussGeometry(sketch: BridgeSketchModel, jointY: number): BridgeSketchModel {
    this.populateDeck(sketch);
    const conditions = sketch.designConditions;
    const joints = sketch.joints;
    const members = sketch.members;
    const iFirstBottomJoint = 0;
    const iLastBottomJoint = conditions.panelCount;
    const iFirstTopJoint = joints.length;
    for (let i: number = iFirstBottomJoint + 1; i < iLastBottomJoint; i++) {
      sketch.joints.push(new Point2D(joints[i].x, jointY));
    }
    const iLastTopJoint = joints.length - 1;
    members.push({ a: joints[iFirstBottomJoint], b: joints[iFirstTopJoint] });
    for (let i: number = iFirstTopJoint; i < iLastTopJoint; i++) {
      members.push({ a: joints[i], b: joints[i + 1] });
    }
    members.push({ a: joints[iLastBottomJoint], b: joints[iLastTopJoint] });
    let iLeftTop: number = iFirstTopJoint;
    let iRightTop: number = iLastTopJoint;
    let iLeftBottom: number = iFirstBottomJoint + 1;
    let iRightBottom: number = iLastBottomJoint - 1;
    while (iLeftTop < iRightTop) {
      members.push(
        { a: joints[iLeftTop], b: joints[iLeftBottom] },
        { a: joints[iLeftTop + 1], b: joints[iLeftBottom] },
        { a: joints[iRightTop], b: joints[iRightBottom] },
        { a: joints[iRightTop - 1], b: joints[iRightBottom] },
      );
      iLeftTop++;
      iRightTop--;
      iLeftBottom++;
      iRightBottom--;
    }
    if (iLeftTop === iRightTop) {
      members.push({ a: joints[iLeftTop], b: joints[iLeftBottom] });
    }
    return sketch;
  }

  private populateWarrenTrussGeometry(sketch: BridgeSketchModel, jointY: number): BridgeSketchModel {
    this.populateDeck(sketch);
    const conditions = sketch.designConditions;
    const joints = sketch.joints;
    const members = sketch.members;
    const iFirstBottomJoint = 0;
    const iLastBottomJoint = conditions.panelCount;
    const iFirstTopJoint = joints.length;
    for (let i: number = iFirstBottomJoint; i < iLastBottomJoint; i++) {
      joints.push(new Point2D(joints[i].x + DesignConditions.PANEL_SIZE_WORLD / 2, jointY));
    }
    const iLastTopJoint = joints.length - 1;
    for (let i: number = iFirstTopJoint; i < iLastTopJoint; i++) {
      members.push({ a: joints[i], b: joints[i + 1] });
    }
    members.push(
      { a: joints[iFirstBottomJoint], b: joints[iFirstTopJoint] },
      { a: joints[iLastBottomJoint], b: joints[iLastTopJoint] },
    );
    let iTop: number = iFirstTopJoint;
    let iBottom: number = iFirstBottomJoint;
    while (iTop <= iLastTopJoint) {
      members.push({ a: joints[iTop], b: joints[iBottom] }, { a: joints[iTop], b: joints[iBottom + 1] });
      iTop++;
      iBottom++;
    }
    return sketch;
  }

  // -------- End parameterized populators for symmetric variants.

  private static roundToGridIncrement(x: number) {
    return Math.round(x * 4) * 0.25;
  }

  private populateDeck(sketch: BridgeSketchModel): void {
    const conditions = sketch.designConditions;
    const joints = sketch.joints;
    const members = sketch.members;
    conditions.prescribedJoints.forEach(joint => joints.push(joint));
    for (let i: number = 0; i < conditions.panelCount; ++i) {
      members.push({ a: joints[i], b: joints[i + 1] });
    }
  }
}
