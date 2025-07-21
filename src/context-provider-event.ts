/**
 * @fileoverview Context Provider Event
 * @author Google LLC
 * @license BSD-3-Clause
 * @source Unmodified copy from @lit/context@1.1.6
 * @see https://github.com/lit/lit/blob/43c6168a/packages/context/src/lib/controllers/context-provider.ts
 */

import type {Context} from './create-context.ts';

declare global {
  interface HTMLElementEventMap {
    /**
     * A 'context-provider' event can be emitted by any element which hosts
     * a context provider to indicate it is available for use.
     */
    'context-provider': ContextProviderEvent<Context<unknown, unknown>>;
  }
}

export class ContextProviderEvent<
  C extends Context<unknown, unknown>,
> extends Event {
  readonly context: C;
  readonly contextTarget: Element;

  /**
   *
   * @param context the context which this provider can provide
   * @param contextTarget the original context target of the provider
   */
  constructor(context: C, contextTarget: Element) {
    super('context-provider', { bubbles: true, composed: true });
    this.context = context;
    this.contextTarget = contextTarget;
  }
}