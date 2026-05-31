
export const SHELL_COLORS = [
  0x00d4ff,
  0xff6b35,
  0xa259ff,
  0x00ff99,
  0xffc832,
  0xff4488,
  0x44ddff,
];

export const SHELL_CSS = [
  '#00d4ff',
  '#ff6b35',
  '#a259ff',
  '#00ff99',
  '#ffc832',
  '#ff4488',
  '#44ddff',
];

export const SHELL_NAMES = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];

export const ORBIT_LABELS = [
  'r₁ = 10⁻¹⁴ м',
  'r₂ = 5·10⁻¹⁴ м',
  'r₃ = 10⁻¹³ м',
  'r₄', 'r₅', 'r₆', 'r₇',
];

export const TILT_AXES = [
  { rx:  0.26, rz:  0.00 },
  { rx:  0.96, rz:  0.52 },
  { rx: -0.70, rz:  1.22 },
  { rx:  0.40, rz: -0.80 },
  { rx: -0.30, rz:  1.80 },
  { rx:  1.20, rz: -0.40 },
  { rx: -0.90, rz:  0.70 },
];

export const PERIODS = [
  { label: 'Період 1',        zRange: [1,   2]   },
  { label: 'Період 2',        zRange: [3,   10]  },
  { label: 'Період 3',        zRange: [11,  18]  },
  { label: 'Період 4',        zRange: [19,  36]  },
  { label: 'Період 5',        zRange: [37,  54]  },
  { label: 'Більші елементи', zRange: [55,  999] },
];

export const PHYSICS = {
  nucleonRadius:  0.13,   // радіус одного нуклону
  nucleonCap:     92,     // макс. нуклонів для рендеру
  nucGlowMult:    1.15,   // множник ореолу ядра
  nucGlowOpacity: 0.08,
  gapMult:        2.2,    // відстань між краєм ядра та першою орбітою
  electronRadius: 0.13,
  electronHalo:   2.1,    // множник ореолу електрона
  electronHaloOp: 0.18,
  orbitSpread:    1.4,    // розкид орбіт
  orbitOuter:     0.9,    // коеф. приросту зовнішньої орбіти
  cameraFitMult:  2.6,
  cameraMinZ:     5,
};