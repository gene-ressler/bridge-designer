/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { Polygons, Vec2 } from 'manifold-3d';
import { SiteConstants } from '../../shared/classes/site-constants';
import { BridgeService } from '../../shared/services/bridge.service';
import { DesignConditions } from '../../shared/services/design-conditions.service';
import { Gusset, GussetsService } from '../../shared/services/gussets.service';

/**
 * Container for geometry of printed objects.  Must be created per current bridge.
 *
 * All values are  in world meters. Caller is responsible for scaling to printer coordinates.
 */
export class Print3dGeometry {
  // Dimensions.
  public readonly bridgeWidth: number;
  public readonly roadwayWidth: number;

  // Polygons.
  public readonly abutment: Vec2[];
  public readonly abutmentXOffset: number;
  public readonly abutmentShelfZ: number;
  public readonly anchorage: Vec2[];
  public readonly anchorageXOffset: number;
  public readonly anchorageTopZ: number;
  public readonly centerDeckBeam: Vec2[];
  public readonly centerDeckBeamXOffset: number;
  public readonly deckBeamHalfWidth: number;
  public readonly deckPanelYOffset: number;
  public readonly deckPanelZOffset: number;
  public readonly deckPanelZipperX: number;
  public readonly endDeckPanel: Vec2[];
  public readonly endDeckPanelXOffset: number;
  public readonly gussets: Gusset[];
  public readonly pier: Vec2[];
  public readonly pierHeight: number;
  public readonly pierXOffset: number;
  public readonly pierTopZ: number;
  public readonly pierTaperX: number;
  public readonly pillow: Vec2[];
  public readonly pillowXOffset: number;
  public readonly pillowHeight: number;
  public readonly pin: Vec2[];
  public readonly pinSize: number;
  public readonly pinMember: Vec2[];
  public readonly pinMemberXOffset: number;
  public readonly pinMemberYOffset: number;
  public readonly standardDeckPanel: Vec2[];
  public readonly standardDeckPanelXOffset: number;
  public readonly tab: Vec2[];
  public readonly tabThickness: number;
  public readonly zipper: Polygons;
  public readonly zipperThickness: number;

  constructor(
    gussetsService: GussetsService,
    bridgeService: BridgeService,
    public readonly modelMmPerWorldM: number,
    public readonly minFeatureSize: number,
    public readonly wiggle: number,
  ) {
    const minFeatureSizeWorldM = minFeatureSize / modelMmPerWorldM;
    this.gussets = gussetsService.createGussets(minFeatureSizeWorldM * 1000);
    this.bridgeWidth = 2 * bridgeService.bridgeHalfWidth;
    this.roadwayWidth = 2 * SiteConstants.DECK_HALF_WIDTH;

    const pmhs = 0.75 * minFeatureSizeWorldM; // pin member half size (width and height)
    const dbhw = pmhs + minFeatureSizeWorldM; // deck beam half width
    const dt = bridgeService.designConditions.deckThickness;
    const fw = minFeatureSizeWorldM; // flange width
    const phs = 0.4; // pillow half size (all 3 sides)
    const dphw = 0.5; // Desired pier half width
    const aw = 4; // approach width
    const pw = DesignConditions.PANEL_SIZE_WORLD; // panel width
    const pch = 0.3; // pier cusp hieght
    const bv = 0.05; // bevel
    const dah = 4; // display abutment height (below step)
    const cbh = 0.4; // Cross beam height including flange

    const pht = Math.sqrt(3) * phs; // pillow height
    const shw = Math.max(phs, dbhw + fw); // step half width
    const phw = Math.max(phs, dphw); // pier half width

    const conditions = bridgeService.designConditions;
    const archHeight = conditions.isArch ? conditions.underClearance : 0;
    const shelfY = -(pht + archHeight);
    let baseY = shelfY - dah; // world y-coord, printer z-coord of abutment, pier, and anchorage bottom.
    if (conditions.isPier) {
      const pierJointY = conditions.prescribedJoints[conditions.pierJointIndex].y;
      // Lower base for pier if necessary.
      baseY = Math.min(baseY, pierJointY - dah);
      this.pierTopZ = pierJointY - pht;
      this.pierHeight = pierJointY - pht - baseY;
    } else {
      this.pierTopZ = this.pierHeight = 0;
    }
    this.abutmentShelfZ = shelfY;
    this.anchorageTopZ = -pht;

    const x0 = -aw - shw;
    const x1 = shw;
    const x2 = -phw;
    const x3 = phw;
    const x4 = -shw;
    const x5 = -phs;
    const x6 = phs;
    const x8 = -pmhs;
    const x9 = pmhs;
    const x10 = -dbhw;
    const x11 = dbhw;
    const x12 = -dbhw - fw;
    const x13 = dbhw + fw;
    const x14 = pw - dbhw - fw;
    const x15 = pw - dbhw;

    const y0 = -bridgeService.bridgeHalfWidth;
    const y1 = bridgeService.bridgeHalfWidth;
    const y2 = y0 - pch;
    const y3 = y1 + pch;

    const fh = minFeatureSizeWorldM;
    const pmi = minFeatureSizeWorldM; // pin member inset (into cross member)

    const z0 = baseY;
    const z1 = cbh + pmhs - pmi + dt;
    const z2 = shelfY;
    const z3 = -pmhs;
    const z4 = pmhs - pmi;
    const z5 = pmhs;
    const z6 = cbh + pmhs - pmi - fh;
    const z7 = cbh + pmhs - pmi;
    const O: Vec2 = [0, 0];

    // Panel coords
    const aa: Vec2 = [x10, z1];
    const bb: Vec2 = [x4, z1];
    const cc: Vec2 = [x4, z7];
    const dd: Vec2 = [x12, z7];
    const ee: Vec2 = [x12, z6];
    const ff: Vec2 = [x10, z6];
    const gg: Vec2 = [x10, z4];
    const hh: Vec2 = [x8, z4];
    const ii: Vec2 = [x8, z5];
    const jj: Vec2 = [x9, z5];
    const kk: Vec2 = [x9, z4];
    const ll: Vec2 = [x11, z4];
    const mm: Vec2 = [x11, z6];
    const nn: Vec2 = [x13, z6];
    const oo: Vec2 = [x13, z7];
    const pp: Vec2 = [x14, z7];
    const qq: Vec2 = [x14, z6];
    const rr: Vec2 = [x15, z6];
    const ss: Vec2 = [x15, z1];
    const tt: Vec2 = [x8, z3];
    const uu: Vec2 = [x9, z3];
    const vv: Vec2 = [x11, z1];

    // Pin coords
    const ww: Vec2 = [0, z5];
    const xx: Vec2 = [x8, 0];
    const yy: Vec2 = [0, z3];
    const zz: Vec2 = [x9, 0];

    // Pillow coords. In own coords, not bridge.
    const i: Vec2 = [x5, -pht];
    const j: Vec2 = [x6, -pht];

    // Abutment coords
    const k: Vec2 = [x4, z1];
    const l: Vec2 = [x0, z1];
    const m: Vec2 = [x0, z0];
    const n: Vec2 = [x1, z0];
    const p: Vec2 = [x1, z2];
    const q: Vec2 = [x4, z2];

    // Pier coords.
    const r: Vec2 = [0, y2];
    const s: Vec2 = [x3, y0];
    const t: Vec2 = [x3, y1];
    const u: Vec2 = [0, y3];
    const v: Vec2 = [x2, y1];
    const w: Vec2 = [x2, y0];

    // Abutment.

    this.abutment = [p, q, k, l, m, n];
    this.abutmentXOffset = -x0;

    this.anchorage = [p, q, m, n];
    this.anchorageXOffset = -x0;

    // Deck panels.
    this.deckBeamHalfWidth = dbhw;
    this.deckPanelYOffset = 0.5 * this.roadwayWidth;
    this.deckPanelZOffset = z1;
    this.deckPanelZipperX = x15;

    // prettier-ignore
    this.endDeckPanel = [
      bevelY(aa, -bv), bevelX(aa, bv), 
      bb, cc, dd, ee, ff, gg, hh, ii, jj, kk, ll, mm, nn, oo, pp, qq, rr, 
      bevelY(ss, -bv), bevelX(ss, -bv),
      bevelX(vv, bv), bevelY(vv, -bv), bevelX(vv, -bv),
      bevelX(aa, bv),
    ];
    this.endDeckPanelXOffset = shw;

    this.pier = [r, s, t, u, v, w];
    this.pierTaperX = 2;
    this.pierXOffset = -this.pierTaperX * x2;

    this.pillow = [i, j, O];
    this.pillowHeight = pht;
    this.pillowXOffset = phs;
    this.pin = [ww, xx, yy, zz];
    this.pinSize = 2 * pmhs;
    this.pinMember = [tt, uu, jj, ii];
    this.pinMemberXOffset = pmhs;
    this.pinMemberYOffset = 0.5 * this.bridgeWidth;

    // prettier-ignore
    this.standardDeckPanel = [
      bevelY(aa, -bv), 
      gg, hh, ii, jj, kk, ll, mm, nn, oo, pp, qq, rr, 
      bevelY(ss, -bv), bevelX(ss, -bv),
      bevelX(vv, bv), bevelY(vv, -bv), bevelX(vv, -bv),
      bevelX(aa, bv),
    ];
    this.standardDeckPanelXOffset = dbhw;

    // prettier-ignore
    this.centerDeckBeam = [
      bevelX(aa, bv), bevelY(aa, -bv), 
      gg, hh, ii, jj, kk, ll,
      bevelY(vv, -bv), bevelX(vv, -bv),
    ];
    this.centerDeckBeamXOffset = dbhw;

    // Zipper.

    const ftd = 4 * minFeatureSizeWorldM; // full tooth depth
    const tht = 1 * minFeatureSizeWorldM; // tooth height
    const zx0 = -1.5 * ftd;
    const zx1 = -0.5 * ftd;
    const zx2 = 0.5 * ftd;
    const zx3 = 1.5 * ftd;
    const zy0 = -2 * tht;
    const zy1 = -tht;

    const za: Vec2 = [zx0, zy1];
    const zb: Vec2 = [zx1, zy1];
    const zc: Vec2 = [zx2, zy1];
    const zd: Vec2 = [zx3, zy1];

    const ze: Vec2 = [zx0, 0];
    const zf: Vec2 = [zx1, 0];
    const zg: Vec2 = [zx2, 0];
    const zh: Vec2 = [zx3, 0];

    const zi: Vec2 = [zx1, zy0];
    const zj: Vec2 = [zx2, zy0];

    this.zipper = [
      [za, zb, zf, ze],
      [zb, zi, zj, zc],
      [zc, zd, zh, zg],
    ];
    this.zipperThickness = minFeatureSizeWorldM;

    // Tab.

    const thw = 0.75 * minFeatureSizeWorldM; // tab half width
    const thd = 8 * minFeatureSizeWorldM; // tab half depth
    const tx0 = -thw;
    const tx1 = thw;
    const ty0 = -thd;
    const ty1 = thd;
    const ta: Vec2 = [tx0, ty0];
    const tb: Vec2 = [tx1, ty0];
    const tc: Vec2 = [tx1, ty1];
    const td: Vec2 = [tx0, ty1];
    this.tab = [ta, tb, tc, td];
    this.tabThickness = 2 * thw;
  }
}

function bevelX(v: Vec2, dx: number): Vec2 {
  return [dx + v[0], v[1]];
}

function bevelY(v: Vec2, dy: number): Vec2 {
  return [v[0], dy + v[1]];
}
