import { createFileRoute } from '@tanstack/react-router'

import type { ColorRow, Mode, Role } from '#/features/palette/types'
import { hexToHsl, hslToHex } from '#/features/color/color-utils'
import { SquareCard } from '#/components/square-card'
import type { SquareSwatch } from '#/components/square-card'

// Scratch route for iterating on the palette-composition card. Not wired into
// the journey yet — total freedom here. Navigate to /lab.
export const Route = createFileRoute('/lab')({ component: Lab })

type Chip = { name: string; hex: string }
type Palette = { id: string; name: string; chips: Chip[] }

const PALETTES: Palette[] = [
  {
    id: 'warm-neutral',
    name: 'Warm Neutral',
    chips: [
      { name: 'Alabaster Grey', hex: '#CFDBD5' },
      { name: 'Soft Linen', hex: '#E8EDDF' },
      { name: 'Tuscan Sun', hex: '#F5CB5C' },
      { name: 'Carbon Black', hex: '#242423' },
      { name: 'Coral Glow', hex: '#FF7247' },
      { name: 'Graphite', hex: '#333533' },
    ],
  },
  {
    id: 'indigo-flame',
    name: 'Indigo Flame',
    chips: [
      { name: 'Indigo Velvet', hex: '#3D348B' },
      { name: 'Medium Slate Blue', hex: '#7678ED' },
      { name: 'Amber Flame', hex: '#F7B801' },
      { name: 'Tiger Orange', hex: '#F18701' },
      { name: 'Brick Rust', hex: '#C2C4C3' },
      { name: 'Cayenne Red', hex: '#F35B04' },
    ],
  },
  {
    id: 'prussian',
    name: 'Prussian',
    chips: [
      { name: 'Black', hex: '#000000' },
      { name: 'Prussian Blue', hex: '#14213D' },
      { name: 'Orange', hex: '#FCA311' },
      { name: 'Alabaster Grey', hex: '#E5E5E5' },
      { name: 'Brick Rust', hex: '#C2C4C3' },
      { name: 'White', hex: '#FFFFFF' },
    ],
  },
]

const AREAS = '"a a b b" "a a c d" "e e f f"'
const SLOTS = ['a', 'b', 'c', 'd', 'e', 'f']

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

/** The proportional composition card (name + hex per cell). */
function PaletteCard({ palette }: { palette: Palette }) {
  return (
    <div
      className="grid w-full overflow-hidden rounded-[var(--app-radius)]"
      style={{
        gridTemplateAreas: AREAS,
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateRows: '2.4fr 1fr 1fr',
        aspectRatio: '5 / 6',
      }}
    >
      {palette.chips.map((chip, i) => {
        const light = luminance(chip.hex) > 0.6
        const muted = light ? 'rgba(31,36,33,0.5)' : 'rgba(246,245,243,0.55)'
        return (
          <div
            key={chip.name + i}
            className="flex flex-col p-3"
            style={{ gridArea: SLOTS[i], background: chip.hex }}
          >
            <div
              className="text-[10px] font-bold leading-tight"
              style={{ color: muted }}
            >
              {chip.name}
            </div>
            <div
              className="text-[10px] leading-tight tabular-nums"
              style={{ color: muted }}
            >
              {chip.hex}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Official reference palettes (Josh's agreed values). The 7th role (secondary)
// is derived analogously to the ground hue (~+35°), quieter than the 10% accent.

/** A minimal palette for the lab cards — just the named role colors. */
type CardPalette = { id: string; name: string; colors: ColorRow[] }

/** Build a CardPalette from a flat role→{light,dark} map. */
function makePalette(
  id: string,
  name: string,
  roles: Partial<Record<Role, { light: string; dark: string }>>,
): CardPalette {
  return {
    id,
    name,
    colors: (Object.keys(roles) as Role[]).map((role) => ({
      role,
      light: roles[role]!.light,
      dark: roles[role]!.dark,
    })),
  }
}

const OFFICIAL: CardPalette[] = [
  makePalette('set1', 'Set 1 · teal + gold', {
    background: { light: '#c2d7e0', dark: '#254b5b' },
    surface: { light: '#b3cdd8', dark: '#2f6074' },
    text: { light: '#233a43', dark: '#e8eced' },
    muted: { light: '#5b8090', dark: '#92b1be' },
    accent: { light: '#ba852c', dark: '#d6a85c' },
    border: { light: '#a1bac4', dark: '#406e81' },
  }),
  makePalette('set2', 'Set 2 · blue + red', {
    background: { light: '#bed6e4', dark: '#145c85' },
    surface: { light: '#aeccde', dark: '#1972a4' },
    text: { light: '#233843', dark: '#e8ebed' },
    muted: { light: '#537f98', dark: '#82b3cf' },
    accent: { light: '#e81734', dark: '#e6566a' },
    border: { light: '#9cb9c9', dark: '#2d80af' },
  }),
  makePalette('set3', 'Set 3 · green + red', {
    background: { light: '#c2e0d2', dark: '#255b41' },
    surface: { light: '#b3d8c7', dark: '#2f7454' },
    text: { light: '#234334', dark: '#e8edeb' },
    muted: { light: '#5b9077', dark: '#92beaa' },
    accent: { light: '#ba2c3f', dark: '#d65c6c' },
    border: { light: '#a1c4b4', dark: '#408163' },
  }),
]

function roleHex(p: CardPalette, role: Role, mode: Mode): string {
  return p.colors.find((c) => c.role === role)?.[mode] ?? '#888888'
}

/** The proposed 30% secondary: an analogous relative of the ground hue. */
function secondaryHex(groundHex: string, mode: Mode): string {
  const g = hexToHsl(groundHex)
  return hslToHex({
    h: (g.h + 35) % 360,
    s: 0.5,
    l: mode === 'light' ? 0.4 : 0.56,
  })
}

const ROLE_LABEL: Record<Role | 'secondary', string> = {
  background: 'Background',
  surface: 'Surface',
  text: 'Text',
  muted: 'Muted',
  accent: 'Accent',
  border: 'Border',
  secondary: 'Secondary',
}

/** Ordered swatches for the SquareCard at a given color count. */
function squareSwatches(
  p: CardPalette,
  mode: Mode,
  count: 5 | 6 | 7,
): SquareSwatch[] {
  const sw = (role: Role): SquareSwatch => ({
    label: ROLE_LABEL[role],
    hex: roleHex(p, role, mode),
  })
  const secondary: SquareSwatch = {
    label: 'Secondary',
    hex: secondaryHex(roleHex(p, 'background', mode), mode),
  }
  if (count === 5) {
    return [sw('background'), sw('surface'), sw('muted'), sw('text'), sw('accent')]
  }
  if (count === 6) {
    return [
      sw('background'),
      sw('surface'),
      sw('border'),
      sw('muted'),
      sw('text'),
      sw('accent'),
    ]
  }
  return [
    sw('background'),
    sw('surface'),
    sw('border'),
    sw('muted'),
    sw('text'),
    secondary,
    sw('accent'),
  ]
}

const MODES: Mode[] = ['light', 'dark']

function Lab() {
  return (
    <main
      className="min-h-screen px-6 py-12"
      style={{ background: 'var(--app-bg)', color: 'var(--app-text)' }}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-12">
        <header>
          <h1 className="text-lg font-semibold">Card lab</h1>
        </header>

        {([7, 6, 5] as const).map((count) => (
          <section key={count} className="flex flex-col gap-3">
            <span className="text-sm font-medium">{count}-color</span>
            {MODES.map((mode) => (
              <div key={mode} className="flex flex-col gap-1.5">
                <span
                  className="text-[11px] capitalize"
                  style={{ color: 'var(--app-muted)' }}
                >
                  {mode} mode
                </span>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {OFFICIAL.map((p) => (
                    <SquareCard
                      key={p.id}
                      swatches={squareSwatches(p, mode, count)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}

        <hr style={{ borderColor: 'var(--app-border)' }} />

        <section className="flex flex-col gap-3">
          <span
            className="text-xs uppercase tracking-wide"
            style={{ color: 'var(--app-muted)' }}
          >
            Together
          </span>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PALETTES.map((p) => (
              <PaletteCard key={p.id} palette={p} />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
