/**
 * @fileoverview Context provider registration utilities for the W3C Context Protocol.
 *
 * Simplifies the registration of context providers and handles late provider resolution
 * by automatically announcing provider availability. Supports both static values and
 * dynamic handlers, eliminating boilerplate for the common pattern of listening for
 * context requests and announcing provider readiness.
 *
 * Key features:
 * - Automatic provider announcement via ContextProviderEvent
 * - Support for both static values and async handlers
 * - Bulk registration of multiple contexts
 * - Proper cleanup with removal functions
 * - AbortSignal support for lifecycle management
 *
 * @example <caption>Manual approach (without this module)</caption>
 * ```js
 * // Early in document <head>
 * new ContextRoot().attach(document.body)
 *
 * // Later in document, register provider manually
 *
 * // Example of a Context for jsonresume-data payload
 * const contextName = 'jsonresume-data'
 * const basics = {
 *   name: 'Renoir Boulanger',
 *   email: 'contribs@renoirboulanger.com',
 * }
 * const jsonResumeData = {
 *   basics,
 * }
 *
 * document.addEventListener('context-request', (event) => {
 *   if (event.context === contextName) {
 *     event.stopImmediatePropagation()
 *     event.callback(jsonResumeData)
 *   }
 * })
 *
 * // Must manually announce provider
 * document.body.dispatchEvent(
 *   new ContextProviderEvent(contextName, document.body)
 * )
 * // Which will replay anything the ContextRoot had for the present context-request
 * ```
 *
 * @example <caption>With this module</caption>
 * ```js
 * // Same setup, but simpler provider registration
 * const cleanup = registerContextProvider('jsonresume-data', jsonResumeData);
 * // That's it! Announcement handled automatically
 * ```
 *
 * @author Renoir Boulanger <contribs@renoirboulanger.com>
 * @since 2025-07-21
 * @license BSD-3-Clause
 */

import type { Context, ContextType } from './create-context.ts'
import type { ContextRequestEvent } from './context-request-event.ts'
import { ContextProviderEvent } from './context-provider-event.ts'

/**
 * Configuration options for context providers
 */
export interface ProviderOptions extends AddEventListenerOptions {
  /** Target element for provider (defaults to document.body) */
  target?: Element
  /** Whether to stop event propagation (defaults to true) */
  stopPropagation?: boolean
  /** AbortSignal for cleanup */
  signal?: AbortSignal
}

/**
 * Handler function that can provide context values dynamically
 */
export type ContextHandler<C extends Context<unknown, unknown>> = (
  event: ContextRequestEvent<Context<unknown, unknown>>,
) => ContextType<C> | Promise<ContextType<C>>

/**
 * Registers a context provider and announces its availability.
 * Simplifies the common pattern of listening for context requests and providing values.
 *
 * @param contextName - The context identifier to provide
 * @param handlerOrValue - Either a handler function or a static value
 * @param options - Configuration options
 * @returns Cleanup function to remove the provider
 *
 * @example
 * ```js
 * // Static value
 * const cleanup = registerContextProvider(
 *   'user-theme',
 *   { mode: 'dark', primary: '#000' },
 * )
 * ```
 *
 * @example
 * ```js
 * // Dynamic handler
 * const cleanup = registerContextProvider(
 *   'user-data',
 *   async (event) => {
 *     const userId = event.contextTarget.getAttribute('data-user-id')
 *     return await fetchUserData(userId)
 *   },
 * )
 * ```
 *
 * @example
 * ```js
 * // With options
 * const cleanup = registerContextProvider(
 *   'app-config',
 *   getConfig(),
 *   { target: myCustomElement }
 * )
 * ```
 */
export const registerContextProvider = <C extends Context<unknown, unknown>>(
  context: C,
  handlerOrValue: ContextType<C> | ContextHandler<C>,
  options: ProviderOptions = {},
): () => void => {
  const {
    target = document.body,
    stopPropagation = true,
    // Extract provider-specific options
    ...addEventListenerOptions
  } = options

  const isHandler = typeof handlerOrValue === 'function'

  const contextListener = async (event: Event) => {
    const contextEvent = event as ContextRequestEvent<C>

    if (contextEvent.context !== context) {
      return void 0
    }

    if (stopPropagation) {
      contextEvent.stopImmediatePropagation()
    }

    try {
      const value = isHandler
        ? await (handlerOrValue as ContextHandler<C>)(contextEvent)
        : (handlerOrValue as ContextType<C>)

      if (value !== undefined) {
        contextEvent.callback(value as ContextType<C>)
      }
    } catch (error) {
      console.error(`Context provider error for "${String(context)}":`, error)
    }
  }

  const listenerTarget = target.getRootNode() || document?.body
  listenerTarget.addEventListener(
    'context-request',
    contextListener,
    addEventListenerOptions,
  )

  target.dispatchEvent(new ContextProviderEvent(context, target))

  return () => {
    listenerTarget.removeEventListener('context-request', contextListener)
  }
}

/**
 * Registers multiple context providers at once.
 *
 * @param providers - Map of context names to handlers/values
 * @param options - Configuration options applied to all providers
 * @returns Cleanup function to remove all providers
 *
 * @example
 * ```js
 * const cleanup = registerContextProviders({
 *   'user-theme': { mode: 'dark' },
 *   'user-profile': async (event) => await fetchProfile(),
 *   'app-config': getConfig()
 * })
 * ```
 */
export const registerContextProviders = (
  providers: Record<string, unknown> | Map<Context<unknown, unknown>, unknown>,
  options: ProviderOptions = {},
): () => void => {
  const cleanups: Array<() => void> = []

  if (providers instanceof Map) {
    // Handle Map with Context keys
    for (const [context, handlerOrValue] of providers) {
      const cleanup = registerContextProvider(
        context,
        handlerOrValue as
          | ContextType<typeof context>
          | ContextHandler<typeof context>,
        options,
      )
      cleanups.push(cleanup)
    }
  } else {
    // Handle Record with string keys
    for (const [contextName, handlerOrValue] of Object.entries(providers)) {
      const context = contextName as Context<string, unknown>
      const cleanup = registerContextProvider(context, handlerOrValue, options)
      cleanups.push(cleanup)
    }
  }

  return () => cleanups.forEach((cleanup) => cleanup())
}

/**
 * Creates a typed context provider factory for better type safety.
 *
 * @param context - The context identifier
 * @returns Factory object with provide method
 *
 * @example
 * ```js
 * const ThemeContext = createContextProvider('app-theme')
 *
 * // Later...
 * const cleanup = ThemeContext.provide({ mode: 'dark', primary: '#000' })
 * ```
 */
export const createContextProvider = <C extends Context<unknown, unknown>>(
  context: C,
): {
  context: C
  provide: (
    value: ContextType<C> | ContextHandler<C>,
    options?: ProviderOptions,
  ) => () => void
} => {
  return {
    context,
    provide: (valueOrHandler, options = {}) =>
      registerContextProvider(context, valueOrHandler, options),
  }
}
