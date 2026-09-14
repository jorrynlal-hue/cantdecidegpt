'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

export interface ThemePreset {
  id: string;
  name: string;
  accent: string;
  strong: string;
  hype?: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'royal-purple', name: 'Royal Purple', accent: '#8b5cf6', strong: '#7c3aed', hype: 'Default brand' },
  { id: 'cid-cyan', name: 'Digital Cyan', accent: '#19c9d6', strong: '#0e9aa8' },
  { id: 'miami-pink', name: 'Miami Pink', accent: '#ff5a91', strong: '#d63f6e' },
  { id: 'mint', name: 'Operator Mint', accent: '#00d9b2', strong: '#00a887' },
  { id: 'omega-blue', name: 'Omega Blue', accent: '#438bff', strong: '#2f6fe0' },
  { id: 'gold-amber', name: 'Executive Amber', accent: '#f5b544', strong: '#d9922e' },
  { id: 'rose', name: 'Power Rose', accent: '#fb7185', strong: '#e11d48' },
  { id: 'mint-chip', name: 'Alpine Lime', accent: '#a3e635', strong: '#84cc16' },
  { id: 'android', name: 'Android Green', accent: '#3ddc84', strong: '#22a55e' },
  { id: 'ghost', name: 'Ghost White', accent: '#d8d8e8', strong: '#b8b8cc' },
];

export function hexRgba(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export interface ThemeState {
  presetId: string;
  accent: string;
  strong: string;
  glass: number; // 0..100 surface opacity
  blur: number; // 0..24 blur px
  glow: number; // 0..100 accent glow intensity
  textBrightness: number; // 0..100
  animation: boolean;
}

const DEFAULT_THEME: ThemeState = { presetId: 'royal-purple', accent: '#8b5cf6', strong: '#7c3aed', glass: 82, blur: 18, glow: 55, textBrightness: 72, animation: true };

export function applyThemeVars(t: ThemeState, brand?: string): void {
  const accent = t.presetId === 'custom' ? t.accent : (THEME_PRESETS.find((p) => p.id === t.presetId)?.accent ?? t.accent);
  const strong = t.presetId === 'custom' ? t.strong : (THEME_PRESETS.find((p) => p.id === t.presetId)?.strong ?? t.strong);
  const bg = t.glass / 100;
  const aBg = hexRgba('#0b0d15', bg);
  const v = {
    '--c-accent': accent,
    '--c-accent-strong': strong,
    '--c-accent-soft': hexRgba(accent, 0.14),
    '--c-accent-border': hexRgba(accent, 0.32),
    '--c-accent-text': hexRgba(accent, 1),
    '--c-accent-contrast': '#ffffff',
    '--c-glow': `0 0 ${Math.round(t.glow / 6)}px ${hexRgba(accent, 0.45)}, 0 0 ${Math.round(t.glow / 3)}px ${hexRgba(accent, 0.22)}`,
    '--glass-bg': aBg,
    '--glass-bg-solid': hexRgba('#0d0f18', Math.min(1, bg + 0.06)),
    '--glass-bg-strong': hexRgba('#10121c', Math.min(1, bg + 0.1)),
    '--glass-border': hexRgba('#ffffff', 0.07 + (1 - bg) * 0.05),
    '--glass-blur': `${t.blur}px`,
    '--app-bg': '#04050a',
    '--surface': aBg,
    '--panel': hexRgba('#0b0d15', Math.min(1, bg + 0.03)),
    '--input-bg': hexRgba('#07080d', Math.min(1, bg + 0.02)),
    '--border': hexRgba('#ffffff', 0.08),
    '--muted': hexRgba('#ffffff', 0.38 + (t.textBrightness / 100) * 0.28),
    '--text-soft': hexRgba('#ffffff', 0.62 + (t.textBrightness / 100) * 0.3),
    '--text-main': hexRgba('#ffffff', 0.88 + (t.textBrightness / 100) * 0.12),
    '--dynamic-ring': hexRgba(accent, 0.5),
  };
  const root = document.documentElement;
  Object.entries(v).forEach(([k, val]) => root.style.setProperty(k, val));
  root.style.setProperty('--c-anim', t.animation ? '1' : '0');
  if (brand) {
    root.setAttribute('data-brand', brand);
    document.title = brand ? `${brand}` : 'CAN\'T DECIDE GPT';
  }
}

function loadTheme(): ThemeState {
  try {
    const raw = localStorage.getItem('cdg.theme');
    if (!raw) return DEFAULT_THEME;
    const p = { ...DEFAULT_THEME, ...(JSON.parse(raw) as Partial<ThemeState>) };
    return p;
  } catch {
    return DEFAULT_THEME;
  }
}

interface ThemeCtx {
  theme: ThemeState;
  setTheme: (patch: Partial<ThemeState>) => void;
  preset: ThemePreset | undefined;
  reset: () => void;
}

const Ctx = createContext<ThemeCtx>({ theme: DEFAULT_THEME, setTheme: () => {}, preset: THEME_PRESETS[0], reset: () => {} });

export function ThemeScope({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeState>(DEFAULT_THEME);
  useEffect(() => {
    const t = setTimeout(() => setThemeState(loadTheme()), 0);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    applyThemeVars(theme);
    try {
      localStorage.setItem('cdg.theme', JSON.stringify(theme));
    } catch {
      /* ignore */
    }
  }, [theme]);
  const setTheme = useCallback((patch: Partial<ThemeState>) => {
    setThemeState((prev) => (patch.presetId ? { ...prev, ...patch } : { ...prev, ...patch }));
  }, []);
  const reset = useCallback(() => setThemeState(DEFAULT_THEME), []);
  const preset = useMemo(() => THEME_PRESETS.find((p) => p.id === theme.presetId), [theme.presetId]);
  const value = useMemo(() => ({ theme, setTheme, preset, reset }), [theme, setTheme, preset, reset]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  return useContext(Ctx);
}

const BRAND_KEY = 'cdg.brand';

export function getBrand(): string {
  try {
    return localStorage.getItem(BRAND_KEY) ?? "CAN'T DECIDE GPT";
  } catch {
    return "CAN'T DECIDE GPT";
  }
}

export function setBrand(name: string): void {
  try {
    localStorage.setItem(BRAND_KEY, name);
  } catch {
    /* ignore */
  }
  document.documentElement.setAttribute('data-brand', name);
}