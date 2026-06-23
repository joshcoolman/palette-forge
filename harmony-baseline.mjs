// Throwaway baseline experiment (safe to delete).
// New direction: forget color-theory types. From an image, ask the model for
// FOUR distinct, usable UI palettes — each a different MOOD it reads from the
// image. This is the "the image tells the story; show me something" test.
//
// Run with YOUR key (it never leaves this process):
//   ANTHROPIC_API_KEY=sk-... node harmony-baseline.mjs [imagePath] [model]
//   e.g. ANTHROPIC_API_KEY=sk-... node harmony-baseline.mjs ~/Desktop/portrait.jpg
// Defaults: image=/tmp/pf-test.png, model=claude-opus-4-8 (MODEL= to override).
// Writes /tmp/harmony-baseline.json; prints each palette's name, mood, accent.

import { readFileSync, writeFileSync } from 'node:fs'
import { extname } from 'node:path'
import Anthropic from '@anthropic-ai/sdk'

const imagePath = process.argv[2] ?? '/tmp/pf-test.png'
const model = process.argv[3] ?? process.env.MODEL ?? 'claude-opus-4-8'
const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  console.error('Set ANTHROPIC_API_KEY (your own key) to run this.')
  process.exit(1)
}

const MEDIA = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
}
const mediaType = MEDIA[extname(imagePath).toLowerCase()]
if (!mediaType) {
  console.error('Unsupported image type:', imagePath)
  process.exit(1)
}

const data = readFileSync(imagePath).toString('base64')
const client = new Anthropic({ apiKey })

const ROLES = ['background', 'surface', 'muted', 'border', 'accent', 'text']
const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['palettes'],
  properties: {
    palettes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'mood', 'colors'],
        properties: {
          name: { type: 'string' },
          mood: {
            type: 'string',
            description: 'one short line — the mood/character',
          },
          colors: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['role', 'light', 'dark'],
              properties: {
                role: { type: 'string', enum: ROLES },
                light: { type: 'string' },
                dark: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
}

const text = [
  'From this image, produce FOUR distinct UI color palettes — each a different mood you read from the image',
  '(e.g. bright & punchy, muted & professional, dark & intense, soft & calm — whatever the image actually suggests).',
  'Each palette is for a real interface: six roles (background, surface, muted, border, accent, text), each with a light AND a dark hex.',
  'Make the four genuinely distinct in mood and energy, not minor tweaks of one idea. Give each a short name and a one-line mood.',
].join(' ')

const res = await client.messages.create({
  model,
  max_tokens: 2000,
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data },
        },
        { type: 'text', text },
      ],
    },
  ],
  output_config: { format: { type: 'json_schema', schema } },
})

const out = res.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
let parsed
try {
  parsed = JSON.parse(out)
} catch {
  console.error('Could not parse model output:\n', out)
  process.exit(1)
}

for (const p of parsed.palettes ?? []) {
  const accent = p.colors.find((c) => c.role === 'accent')
  console.log(
    `${(p.name || '').padEnd(22)} ${accent?.light ?? '?'} / ${accent?.dark ?? '?'}  — ${p.mood || ''}`,
  )
}
writeFileSync(
  '/tmp/harmony-baseline.json',
  JSON.stringify({ model, image: imagePath, ...parsed }, null, 2),
)
console.log('\nwrote /tmp/harmony-baseline.json')
