/**
 * Icons the iOS bundle must carry besides the ones its source names: the defaults of Nuxt UI
 * (`icons` in its app config, which is not exported publicly) and the lucide icons it renders itself.
 * The icon scanner skips node_modules, so it never sees them.
 *
 * Copied from `@nuxt/ui` 4.5.1 (`dist/shared/ui.*.mjs`, the `icons` object). Review this list
 * whenever `@nuxt/ui` is upgraded. app.config.ts overrides none of them.
 */
export const NUXT_UI_DEFAULT_ICONS = [
  'arrow-down',
  'arrow-left',
  'arrow-right',
  'arrow-up',
  'circle-alert',
  'check',
  'chevrons-left',
  'chevrons-right',
  'chevron-down',
  'chevron-left',
  'chevron-right',
  'chevron-up',
  'x',
  'copy',
  'copy-check',
  'moon',
  'grip-vertical',
  'ellipsis',
  'circle-x',
  'arrow-up-right',
  'eye',
  'eye-off',
  'file',
  'folder',
  'folder-open',
  'hash',
  'info',
  'sun',
  'loader-circle',
  'menu',
  'minus',
  'panel-left-close',
  'panel-left-open',
  'plus',
  'rotate-ccw',
  'search',
  'square',
  'circle-check',
  'monitor',
  'lightbulb',
  'upload',
  'triangle-alert',
].map((name) => `lucide:${name}`)
