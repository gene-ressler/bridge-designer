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
 * All values are in world meters unless noted. Caller is responsible for
 * scaling to printer coordinates.
 */
export class Print3dGeometry {
  // Dimensions.
  public readonly bridgeWidth: number;
  public readonly roadwayWidth: number;

  // Polygons.
  public readonly abutment: Vec2[];
  public readonly abutmentShelfZ: number;
  public readonly abutmentWidth: number;
  public readonly abutmentWithAnchorage: Vec2[];
  public readonly abutmentWithAnchorageWidth: number;
  public readonly abutmentWithAnchorageXOffset: number;
  public readonly abutmentXOffset: number;
  public readonly anchorageX: number;
  public readonly centerDeckBeam: Vec2[];
  public readonly centerDeckBeamXOffset: number;
  public readonly deckBeamHalfWidth: number;
  public readonly deckPanelYOffset: number;
  public readonly deckPanelZipperX: number;
  public readonly deckPanelZOffset: number;
  public readonly endDeckPanel: Vec2[];
  public readonly endDeckPanelXOffset: number;
  public readonly gussets: Gusset[];
  public readonly pier: Vec2[];
  public readonly pierHeight: number;
  public readonly pierTaperX: number;
  public readonly pierTopZ: number;
  public readonly pierWidth: number;
  public readonly pierXOffset: number;
  public readonly pillow: Vec2[];
  public readonly pillowHeight: number;
  public readonly pillowXOffset: number;
  public readonly pin: Vec2[];
  public readonly pinHole: Vec2[];
  public readonly pinHoleSize: number;
  public readonly pinMember: Vec2[];
  public readonly pinMemberFoot: Polygons;
  public readonly pinMemberXOffset: number;
  public readonly pinMemberYOffset: number;
  public readonly standardDeckPanel: Vec2[];
  public readonly standardDeckPanelXOffset: number;
  public readonly tab: Vec2[];
  public readonly tabHole: Vec2[];
  public readonly tabThickness: number;
  public readonly zipper: Vec2[];
  public readonly zipperHole: Vec2[];
  public readonly zipperThickness: number;

  constructor(
    gussetsService: GussetsService,
    bridgeService: BridgeService,
    public readonly modelMmPerWorldM: number,
    public readonly minFeatureSize: number,
    public readonly wiggle: number,
  ) {
    const minFeatureSizeWorldM = minFeatureSize / modelMmPerWorldM;
    const wiggleWorldM = wiggle / modelMmPerWorldM;
    this.gussets = gussetsService.createGussets(minFeatureSizeWorldM * 1000);
    this.bridgeWidth = 2 * bridgeService.bridgeHalfWidth;
    this.roadwayWidth = 2 * SiteConstants.DECK_HALF_WIDTH;

    // The short variable names in this contructor
    // correspond to the pencil sketch in img/geometry.png.

    const pmhs = 0.75 * minFeatureSizeWorldM; // pin member half size (width and height)
    const dbhw = pmhs + minFeatureSizeWorldM; // deck beam half width
    const dt = bridgeService.designConditions.deckThickness;
    const fw = minFeatureSizeWorldM; // flange width
    const phs = 0.6; // pillow half size (all 3 sides)
    const dphw = 0.5; // Desired pier half width
    const aw = DesignConditions.PANEL_SIZE_WORLD; // approach width; must allow anchorage 45
    const pw = DesignConditions.PANEL_SIZE_WORLD; // panel width
    const pch = 0.3; // pier cusp hieght
    const bv = 0.05; // bevel
    const dah = 4; // display abutment height (below step)
    const cbh = 0.5; // Cross beam height including flange
    const pfh = 0.2 / modelMmPerWorldM; // Pin foot height (layer thickness)

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
    const x14 = pw - dbhw - fw - wiggleWorldM;
    const x15 = pw - dbhw - wiggleWorldM;
    const x17 = -SiteConstants.ANCHOR_OFFSET;
    const x18 = x17 - shw;
    const x19 = Math.max(x17 + shw, x0);

    const y0 = -bridgeService.bridgeHalfWidth;
    const y1 = bridgeService.bridgeHalfWidth;
    const y2 = y0 - pch;
    const y3 = y1 + pch;

    const fh = 1.5 * minFeatureSizeWorldM;
    const pmi = minFeatureSizeWorldM; // pin member inset (into cross member)

    const z0 = baseY;
    const z1 = cbh + pmhs - pmi + dt;
    const z2 = shelfY;
    const z3 = -pmhs;
    const z4 = pmhs - pmi;
    const z5 = pmhs;
    const z6 = cbh + pmhs - pmi - fh;
    const z7 = cbh + pmhs - pmi;
    const z8 = z2 - shw;
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

    // Pin coords. All wiggle is in the hole.
    const ww: Vec2 = [0, z5];
    const xx: Vec2 = [x8, 0];
    const yy: Vec2 = [0, z3];
    const zz: Vec2 = [x9, 0];
    const wwh: Vec2 = [0, z5 + wiggleWorldM];
    const xxh: Vec2 = [x8 - wiggleWorldM, 0];
    const yyh: Vec2 = [0, z3 - wiggleWorldM];
    const zzh: Vec2 = [x9 + wiggleWorldM, 0];

    // Pin foot coords.
    const fa: Vec2 = [-phs, z3];
    const fb: Vec2 = [phs, z3];
    const fc: Vec2 = [-phs, z3 + pfh];
    const fd: Vec2 = [x8 - pfh, z3 + pfh];
    const fe: Vec2 = [x9 + pfh, z3 + pfh];
    const fg: Vec2 = [phs, z3 + pfh];
    const ft: Vec2 = [x8 + pfh, z3];
    const fu: Vec2 = [x9 - pfh, z3];

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

    // Anchorage extension.
    const gb: Vec2 = [x19, z2];
    const gc: Vec2 = [x18, z2];
    const gd: Vec2 = [x18, z8];
    const ge: Vec2 = [x19, z1];

    // Pier coords.
    const r: Vec2 = [0, y2];
    const s: Vec2 = [x3, y0];
    const t: Vec2 = [x3, y1];
    const u: Vec2 = [0, y3];
    const v: Vec2 = [x2, y1];
    const w: Vec2 = [x2, y0];

    // Abutment.
    this.abutment = [p, q, k, l, m, n];
    this.abutmentWithAnchorage = [p, q, k, ge, gb, gc, gd, m, n];
    this.abutmentXOffset = -x0;
    this.abutmentWithAnchorageXOffset = -x18;
    this.anchorageX = x17;
    this.abutmentWidth = x1 - x0;
    this.abutmentWithAnchorageWidth = x1 - x18;

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

    // Pier
    this.pier = [r, s, t, u, v, w];
    this.pierTaperX = 2;
    this.pierXOffset = -this.pierTaperX * x2;
    this.pierWidth = x1 - x0;

    // Cross-member

    this.pillow = [i, j, O];
    this.pillowHeight = pht;
    this.pillowXOffset = phs;
    this.pin = [ww, xx, yy, zz];
    this.pinHole = [zzh, yyh, xxh, wwh]; // clockwise
    this.pinHoleSize = 2 * (pmhs + wiggleWorldM);
    this.pinMember = [tt, uu, jj, ii];
    this.pinMemberXOffset = pmhs;
    this.pinMemberYOffset = 0.5 * this.bridgeWidth;
    this.pinMemberFoot = [[fa, ft, fd, fc], [fu, fb, fg, fe]];

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

    // Zipper. Dimensions in mm.

    const ftd = 4 * minFeatureSizeWorldM; // full tooth depth
    const tht = minFeatureSizeWorldM; // tooth height
    const ol = minFeatureSizeWorldM; // tooth overlap
    const zx0 = -1.5 * ftd - ol;
    const zx1 = -0.5 * ftd - ol;
    const zx2 = -0.5 * ftd;
    const zx3 = 0.5 * ftd;
    const zx4 = 0.5 * ftd + ol;
    const zx5 = 1.5 * ftd + ol;
    const zy0 = -2 * tht;
    const zy1 = -tht;

    const za: Vec2 = [zx0, zy1];
    const zb: Vec2 = [zx1, zy1];
    const zc: Vec2 = [zx2, zy1];
    const zd: Vec2 = [zx3, zy1];
    const ze: Vec2 = [zx4, zy1];
    const zf: Vec2 = [zx5, zy1];

    const zg: Vec2 = [zx0, 0];
    const zh: Vec2 = [zx2, 0];
    const zi: Vec2 = [zx3, 0];
    const zj: Vec2 = [zx5, 0];

    const zk: Vec2 = [zx1, zy0];
    const zl: Vec2 = [zx4, zy0];

    this.zipper = [zb, zk, zl, ze, zf, zj, zi, zd, zc, zh, zg, za];

    const zha: Vec2 = [zx0 - wiggleWorldM, zy1 - wiggleWorldM];
    const zhb: Vec2 = [zx1 - wiggleWorldM, zy1 - wiggleWorldM];
    const zhc: Vec2 = [zx2 + wiggleWorldM, zy1 + wiggleWorldM];
    const zhd: Vec2 = [zx3 - wiggleWorldM, zy1 + wiggleWorldM];
    const zhe: Vec2 = [zx4 + wiggleWorldM, zy1 - wiggleWorldM];
    const zhf: Vec2 = [zx5 + wiggleWorldM, zy1 - wiggleWorldM];

    // Extend above deck for clean subtract.
    const zhg: Vec2 = [zx0 - wiggleWorldM, 1];
    const zhh: Vec2 = [zx2 + wiggleWorldM, 1];
    const zhi: Vec2 = [zx3 - wiggleWorldM, 1];
    const zhj: Vec2 = [zx5 + wiggleWorldM, 1];

    const zhk: Vec2 = [zx1 - wiggleWorldM, zy0 - 2 * wiggleWorldM];
    const zhl: Vec2 = [zx4 + wiggleWorldM, zy0 - 2 * wiggleWorldM];
    this.zipperHole = [zhb, zhk, zhl, zhe, zhf, zhj, zhi, zhd, zhc, zhh, zhg, zha];

    this.zipperThickness = minFeatureSizeWorldM;

    // Tab.

    const thw = 0.5 * minFeatureSizeWorldM; // tab half width
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
    const tah: Vec2 = [tx0 - wiggleWorldM, ty0 - wiggleWorldM];
    const tbh: Vec2 = [tx1 + wiggleWorldM, ty0 - wiggleWorldM];
    const tch: Vec2 = [tx1 + wiggleWorldM, ty1 + wiggleWorldM];
    const tdh: Vec2 = [tx0 - wiggleWorldM, ty1 + wiggleWorldM];
    this.tabHole = [tah, tbh, tch, tdh];
    this.tabThickness = 2 * thw;
  }
}

function bevelX(v: Vec2, dx: number): Vec2 {
  return [dx + v[0], v[1]];
}

function bevelY(v: Vec2, dy: number): Vec2 {
  return [v[0], dy + v[1]];
}
