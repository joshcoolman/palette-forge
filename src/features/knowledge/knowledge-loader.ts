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

/**
 * Alternate generation personas — dev-only role experiments selectable from the eval
 * bar's role picker. Kept in a `roles/` subfolder so they can be listed on their own
 * (`ROLE_FILES`), but merged into the same basename map below so `getKnowledge` resolves
 * them like any other file. The shipped default (`color-theorist.md`) stays at the root.
 */
const roleFiles = import.meta.glob<string>('/knowledge/roles/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const basename = (path: string): string => path.split('/').pop() ?? path

/** Map of basename (e.g. `contrast.md`) -> raw markdown. */
export const knowledgeFiles: Record<string, string> = Object.fromEntries(
  Object.entries({ ...rawFiles, ...roleFiles }).map(([path, content]) => [
    basename(path),
    content,
  ]),
)

export function getKnowledge(name: string): string {
  return knowledgeFiles[name] ?? ''
}

/**
 * Basenames of the alternate personas in `/knowledge/roles/`, for the dev-only role
 * picker. The shipped default (`color-theorist.md`) is NOT in here — it lives at the
 * knowledge root; the picker prepends it.
 */
export const ROLE_FILES: readonly string[] = Object.keys(roleFiles)
  .map(basename)
  .sort()

/** Ordered knowledge for the system prompt: roles first, then taste, then policy prose. */
export const KNOWLEDGE_ORDER = [
  'roles.md',
  'palettes.md',
  'characters.md',
  'contrast.md',
] as const
