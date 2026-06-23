import { createFileRoute } from '@tanstack/react-router'

// Scratch route for iterating on the palette-composition card. Not wired into
// the journey yet — total freedom here. Navigate to /lab.
export const Route = createFileRoute('/lab')({ component: Lab })

type Chip = { name: string; hex: string }
// Six chips in template order: A (big left), B (big right), C + D (small pair),
// E + F (bottom pair). Mirrors the reference card's proportional grid.
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

const COASTAL: Palette = {
  id: 'coastal',
  name: 'Coastal',
  chips: [
    { name: 'Barley Corn', hex: '#A7A155' },
    { name: 'Botticelli', hex: '#345463' },
    { name: 'Gulf Stream', hex: '#79B4AE' },
    { name: 'Swans Down', hex: '#CFE6DF' },
    { name: 'Driftwood', hex: '#C9B79C' },
    { name: 'Slate Deep', hex: '#2F3B40' },
  ],
}

const AREAS = '"a a b b" "a a c d" "e e f f"'
const SLOTS = ['a', 'b', 'c', 'd', 'e', 'f']

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

/** The proportional composition card. Each cell carries its name (bold) and hex
 *  (regular) at one size, muted onto the swatch — text color picked by luminance,
 *  the contrast engine in miniature. */
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

/** Treatment 2 — the palette laid over the source image it came from. Minimal:
 *  a swatch + hex per color, no RGB/CMYK noise. */
function PaletteOverImage({
  image,
  palette,
}: {
  image: string
  palette: Palette
}) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-[var(--app-radius)]"
      style={{ aspectRatio: '5 / 6' }}
    >
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 flex flex-col justify-center gap-2 p-5">
        {palette.chips.map((chip, i) => {
          const light = luminance(chip.hex) > 0.6
          const muted = light ? 'rgba(31,36,33,0.5)' : 'rgba(246,245,243,0.55)'
          return (
            <div
              key={chip.name + i}
              className="flex items-baseline justify-between rounded-lg px-4 py-2.5"
              style={{
                background: chip.hex,
                boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
              }}
            >
              <span className="text-[10px] font-bold" style={{ color: muted }}>
                {chip.name}
              </span>
              <span
                className="text-[10px] tabular-nums"
                style={{ color: muted }}
              >
                {chip.hex}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Lab() {
  const hero = PALETTES[0]
  return (
    <main
      className="min-h-screen px-6 py-12"
      style={{ background: 'var(--app-bg)', color: 'var(--app-text)' }}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-12">
        <header>
          <h1 className="text-lg font-semibold">Card lab</h1>
          <p className="text-sm" style={{ color: 'var(--app-muted)' }}>
            Proportional palette composition — iterating on one card.
          </p>
        </header>

        <section className="flex flex-col gap-3">
          <span
            className="text-xs uppercase tracking-wide"
            style={{ color: 'var(--app-muted)' }}
          >
            One card
          </span>
          <div className="w-[360px] max-w-full">
            <PaletteCard palette={hero} />
          </div>
        </section>

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

        <section className="flex flex-col gap-3">
          <span
            className="text-xs uppercase tracking-wide"
            style={{ color: 'var(--app-muted)' }}
          >
            Same palette, two treatments
          </span>
          <div className="flex flex-wrap items-start gap-6">
            <div className="w-[320px] max-w-full">
              <PaletteCard palette={COASTAL} />
            </div>
            <div className="w-[320px] max-w-full">
              <PaletteOverImage image="/lab-sample.jpg" palette={COASTAL} />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
