/**
 * Pasteable exports of a palette. The headline is the AI prompt — the common
 * case is handing a palette to someone else's coding agent — alongside the
 * hand-coder formats. Tailwind is intentionally complete (CSS variables for
 * light/dark + the config/@theme), not a stub.
 */

import type { Palette, Role } from '#/features/palette/types'
import { ROLES } from '#/features/palette/types'

function rowsOf(
  palette: Palette,
): { role: Role; light: string; dark: string }[] {
  return ROLES.map((role) => {
    const row = palette.colors.find((c) => c.role === role)
    return {
      role,
      light: row?.light ?? '#000000',
      dark: row?.dark ?? '#000000',
    }
  })
}

function cssVarBlock(palette: Palette, mode: 'light' | 'dark'): string {
  return rowsOf(palette)
    .map((r) => `  --${r.role}: ${r[mode]};`)
    .join('\n')
}

export function toHexList(palette: Palette): string {
  return rowsOf(palette)
    .map((r) => `${r.role.padEnd(11)} light ${r.light}   dark ${r.dark}`)
    .join('\n')
}

export function toCssVars(palette: Palette): string {
  return `:root {\n${cssVarBlock(palette, 'light')}\n}\n\n.dark {\n${cssVarBlock(palette, 'dark')}\n}`
}

export function toTailwindV4(palette: Palette): string {
  const theme = rowsOf(palette)
    .map((r) => `  --color-${r.role}: var(--${r.role});`)
    .join('\n')
  return [
    '/* Tailwind v4 — paste into your CSS entry */',
    '@import "tailwindcss";',
    '',
    '@custom-variant dark (&:where(.dark, .dark *));',
    '',
    '@theme {',
    theme,
    '}',
    '',
    ':root {',
    cssVarBlock(palette, 'light'),
    '}',
    '',
    '.dark {',
    cssVarBlock(palette, 'dark'),
    '}',
  ].join('\n')
}

export function toTailwindV3(palette: Palette): string {
  const colors = rowsOf(palette)
    .map((r) => `        ${r.role}: 'var(--${r.role})',`)
    .join('\n')
  return [
    '/* In your global CSS */',
    ':root {',
    cssVarBlock(palette, 'light'),
    '}',
    '.dark {',
    cssVarBlock(palette, 'dark'),
    '}',
    '',
    '// tailwind.config.js',
    'module.exports = {',
    "  darkMode: 'class',",
    '  theme: {',
    '    extend: {',
    '      colors: {',
    colors,
    '      },',
    '    },',
    '  },',
    '}',
  ].join('\n')
}

export const EXPORT_FORMATS = [
  { id: 'hex', label: 'Hex' },
  { id: 'css', label: 'CSS' },
  { id: 'tailwind', label: 'Tailwind' },
] as const

export type ExportFormatId = (typeof EXPORT_FORMATS)[number]['id']
export type TailwindVersion = 'v3' | 'v4'

export function buildExport(
  palette: Palette,
  format: ExportFormatId,
  tailwindVersion: TailwindVersion = 'v4',
): string {
  switch (format) {
    case 'tailwind':
      return tailwindVersion === 'v4'
        ? toTailwindV4(palette)
        : toTailwindV3(palette)
    case 'css':
      return toCssVars(palette)
    case 'hex':
      return toHexList(palette)
  }
}
