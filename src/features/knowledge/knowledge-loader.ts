/**
 * Bundles `/knowledge/*.md` into the build at compile time. Editing a markdown
 * file changes the bundle and therefore the output — the legible knowledge
 * layer the whole product turns on.
 */

const rawFiles = import.meta.glob<string>('/knowledge/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

/** Map of basename (e.g. `contrast.md`) -> raw markdown. */
export const knowledgeFiles: Record<string, string> = Object.fromEntries(
  Object.entries(rawFiles).map(([path, content]) => [
    path.split('/').pop() ?? path,
    content,
  ]),
)

export function getKnowledge(name: string): string {
  return knowledgeFiles[name] ?? ''
}

/** Ordered knowledge for the system prompt: roles first, then taste, then policy prose. */
export const KNOWLEDGE_ORDER = [
  'roles.md',
  'palettes.md',
  'harmony.md',
  'contrast.md',
] as const
