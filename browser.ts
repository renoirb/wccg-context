// deno-lint-ignore-file no-explicit-any

/**
 * @fileoverview wccg-context main entry point
 * @description DOM-dependent Web Components Context Protocol implementation
 */

if (typeof (globalThis as any).HTMLElement === 'undefined') {
  console.warn(
    '⚠️  wccg-context: This package requires DOM APIs (HTMLElement, Event, etc.)\n' +
      '   • This package is designed for browser/DOM environments',
  )
}

if (typeof globalThis.Event === 'undefined') {
  throw new Error('wccg-context requires Event API (browser/DOM environment)')
}

export * from './src/index.ts'

