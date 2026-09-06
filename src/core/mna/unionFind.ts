// ============================================================
// Union-Find — 導線聚合演算法
// 將畫布上的導線端點和元件引腳合併成電氣網路（Net）
// ============================================================

import { Point, Wire, Component, Net, NetlistResult } from './types';

const GRID = 20; // px

/** 格點座標轉字串 key */
export function pointKey(p: Point): string {
  return `${Math.round(p.x / GRID) * GRID},${Math.round(p.y / GRID) * GRID}`;
}

/** 吸附到格點 */
export function snapToGrid(p: Point): Point {
  return { x: Math.round(p.x / GRID) * GRID, y: Math.round(p.y / GRID) * GRID };
}

// ── Union-Find 資料結構 ───────────────────────────────────
class UnionFind {
  private parent: Map<string, string> = new Map();
  private rank: Map<string, number> = new Map();

  find(x: string): string {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.rank.set(x, 0);
    }
    if (this.parent.get(x) !== x) {
      this.parent.set(x, this.find(this.parent.get(x)!));
    }
    return this.parent.get(x)!;
  }

  union(x: string, y: string): void {
    const rx = this.find(x);
    const ry = this.find(y);
    if (rx === ry) return;
    const rankX = this.rank.get(rx) ?? 0;
    const rankY = this.rank.get(ry) ?? 0;
    if (rankX < rankY) {
      this.parent.set(rx, ry);
    } else if (rankX > rankY) {
      this.parent.set(ry, rx);
    } else {
      this.parent.set(ry, rx);
      this.rank.set(rx, rankX + 1);
    }
  }

  /** 取得所有根節點 */
  getRoots(): Set<string> {
    const roots = new Set<string>();
    for (const key of this.parent.keys()) {
      roots.add(this.find(key));
    }
    return roots;
  }
}

// ── 主函式：建立網路 ─────────────────────────────────────
/**
 * 輸入所有導線和元件引腳，回傳電氣網路清單
 * GND 引腳所在的 cluster → Net 0
 */
export function buildNets(
  wires: Wire[],
  components: Component[]
): NetlistResult {
  const uf = new UnionFind();
  const errors: string[] = [];

  // 1. 合併每條導線上的所有端點
  for (const wire of wires) {
    if (wire.points.length < 2) continue;
    const keys = wire.points.map(p => pointKey(p));
    for (let i = 0; i < keys.length - 1; i++) {
      uf.union(keys[i], keys[i + 1]);
    }
  }

  // 2. 找出所有 GND 引腳的格點 key
  const gndKeys: string[] = [];
  for (const comp of components) {
    if (comp.type === 'ground') {
      gndKeys.push(pointKey(comp.pins[0]));
    }
  }

  // 3. 把所有 GND 合併成同一個根（如果有多個 GND）
  if (gndKeys.length > 1) {
    for (let i = 1; i < gndKeys.length; i++) {
      uf.union(gndKeys[0], gndKeys[i]);
    }
  }

  // 4. 確保所有引腳格點存在於 Union-Find 中
  const compPinKeys: Map<string, string> = new Map(); // "compId:pinIdx" → pointKey
  for (const comp of components) {
    if (comp.type === 'ground') continue;
    const allPins = comp.pin3
      ? [comp.pins[0], comp.pins[1], comp.pin3]
      : [comp.pins[0], comp.pins[1]];
    for (let i = 0; i < allPins.length; i++) {
      const key = pointKey(allPins[i]);
      uf.find(key); // 確保 key 存在於 UF 中
      compPinKeys.set(`${comp.id}:${i}`, key);
    }
  }

  // 5. 建立 root → net id 映射
  //    GND root → 0，其餘按順序 1, 2, 3…
  const rootToNet: Map<string, number> = new Map();

  const gndRoot = gndKeys.length > 0 ? uf.find(gndKeys[0]) : null;
  if (gndRoot) {
    rootToNet.set(gndRoot, 0);
  } else {
    errors.push('電路缺少接地（GND）元件');
  }

  let nextNetId = 1;
  for (const root of uf.getRoots()) {
    if (!rootToNet.has(root)) {
      rootToNet.set(root, nextNetId++);
    }
  }

  // 6. 建立 Net 物件
  const netMap: Map<number, Net> = new Map();
  for (const [root, netId] of rootToNet) {
    netMap.set(netId, { id: netId, pinKeys: new Set() });
  }

  // 7. 建立 pinNetMap
  const pinNetMap = new Map<string, number>();
  for (const [pinKey, pointK] of compPinKeys) {
    const root = uf.find(pointK);
    const netId = rootToNet.get(root) ?? -1;
    pinNetMap.set(pinKey, netId);
    if (netMap.has(netId)) {
      netMap.get(netId)!.pinKeys.add(pointK);
    }
  }

  // 8. 驗證：是否有引腳沒連到任何導線或其他引腳
  for (const comp of components) {
    if (comp.type === 'ground') continue;
    const allPins = comp.pin3
      ? [comp.pins[0], comp.pins[1], comp.pin3]
      : [comp.pins[0], comp.pins[1]];
    for (let i = 0; i < allPins.length; i++) {
      const netId = pinNetMap.get(`${comp.id}:${i}`);
      if (netId === undefined || netId < 0) {
        errors.push(`元件 ${comp.label} 的引腳 ${i + 1} 未連接`);
      }
    }
  }

  const nets = [...netMap.values()].sort((a, b) => a.id - b.id);
  return { nets, pinNetMap, errors };
}
