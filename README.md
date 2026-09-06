# CircuitWhitebox ⚡

> **教學型互動電路計算機** — 不只計算，更讓你看懂 Modified Nodal Analysis（MNA）的每一步。

[![GitHub Pages](https://img.shields.io/badge/Demo-GitHub%20Pages-blue?logo=github)](https://your-name.github.io/circuit-whitebox)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite)](https://vite.dev/)

---

## 🎯 什麼是 CircuitWhitebox？

大多數電路模擬器（LTspice、Falstad）是「黑盒」— 給你答案，但不說為什麼。

**CircuitWhitebox** 把黑盒打開：

1. **畫電路** — 拖曳元件、連導線，支援觸控
2. **看矩陣** — 即時產生 MNA 矩陣 $[A \cdot x = b]$，符號與數字模式切換
3. **看推導** — 每個節點的 KCL 方程式，自然語言 + LaTeX 對照
4. **看求解** — Gaussian 消去的每一步，可用滑桿慢速回放
5. **看結果** — 每個元件的電壓、電流、功率，含 Bode Plot（AC 分析）

---

## ✨ 功能特色

### 電路元件（13 種）
| 類別 | 元件 |
|---|---|
| 被動 | R 電阻、C 電容、L 電感 |
| 獨立電源 | Vdc、Vac、Idc、Iac |
| 接地 | GND（Net 0 = 0V）|
| 主動 | 理想 Op-Amp（nullor 模型）|
| 相依電源 | VCVS、CCCS、VCCS、CCVS（菱形符號）|

### 分析模式
- **DC 分析** — 節點電壓、支路電流、功率
- **AC 分析** — 相量法，含 Bode Plot（增益 dB + 相位）

### 教學 Inspector 面板（4 Tab）
- **MNA Matrix** — KaTeX 渲染的增廣矩陣，可在符號/數字間切換
- **Step-by-Step** — KCL/KVL 推導過程，LaTeX 方程式 + 中文說明
- **Telemetry** — 每元件詳細數據表格（V₊、V₋、ΔV、I、P）
- **Bode Plot** — 頻率響應圖（AC 模式）

---

## 🚀 快速開始

### 本地開發
```bash
git clone https://github.com/your-name/circuit-whitebox.git
cd circuit-whitebox
npm install
npm run dev
# 打開 http://localhost:5173
```

### 建置
```bash
npm run build
npm run preview
```

---

## 🎮 操作說明

| 操作 | 說明 |
|---|---|
| 點工具列元件 → 點畫布 | 放置元件 |
| 「導線」模式 → 兩次點擊 | 畫正交導線 |
| Shift + 畫線 | 斜線模式 |
| 點元件 | 彈出屬性編輯框（含旋轉/刪除）|
| Alt + 拖曳 / 中鍵拖曳 | 平移畫布 |
| ⚡ Solve | 計算並展開 Inspector |
| `Esc` | 取消操作 |
| `Delete` | 刪除選取 |
| `Ctrl+Z` | 復原（20 步）|

---

## 🔬 基準測試驗證

**10V 分壓器（R1=1kΩ，R2=2kΩ）**

| 節點 | 預期電壓 |
|---|---|
| Node 1 | **10.000 V** |
| Node 2 | **6.667 V** |
| GND | **0 V** |

MNA 矩陣：

$$\begin{bmatrix} \frac{1}{R_1} & -\frac{1}{R_1} & 1 \\ -\frac{1}{R_1} & \frac{1}{R_1}+\frac{1}{R_2} & 0 \\ 1 & 0 & 0 \end{bmatrix} \begin{bmatrix} V_1 \\ V_2 \\ I_{V1} \end{bmatrix} = \begin{bmatrix} 0 \\ 0 \\ 10 \end{bmatrix}$$

---

## 🛠 技術堆疊

| 層次 | 技術 |
|---|---|
| 框架 | React 19 + TypeScript 5 |
| 建置 | Vite 8 |
| 樣式 | Tailwind CSS v4 |
| 數學渲染 | KaTeX + react-katex |
| 狀態管理 | Zustand v5（含 localStorage 自動儲存）|
| 圖表 | Recharts |
| 畫布 | Pure SVG（無 canvas 依賴）|

---

## 📁 專案結構

```
src/
├── core/mna/          # 純 TypeScript 計算引擎
│   ├── types.ts       # 型別定義
│   ├── unionFind.ts   # 導線聚合演算法
│   ├── mnaEngine.ts   # MNA 矩陣建立（符號+數字）
│   ├── gaussSolver.ts # Gaussian 消去（含步驟記錄）
│   ├── acAnalysis.ts  # AC 頻率掃描
│   └── netlist.ts     # 求解協調器
├── store/
│   └── circuitStore.ts # Zustand 全域狀態
├── components/
│   ├── canvas/         # SVG 畫布元件
│   ├── inspector/      # 教學 Inspector 面板
│   └── toolbar/        # 可拖曳浮動工具列
└── examples/
    └── circuits.ts     # 預建範例電路
```

---

## 📄 授權

MIT License © 2026
