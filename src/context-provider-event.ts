/**
 * @fileoverview Context Provider Event (modifications: without declare global)
 * @author Google LLC
 * @license BSD-3-Clause
 * @source Copy of @lit/context@1.1.6
 * @see https://github.com/lit/lit/blob/%40lit/context%401.1.6/packages/context/src/lib/controllers/context-provider.ts#L15-L41
 */

import type {Context} from './create-context.ts';

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
  constructor(
    context: C,
    contextTarget: Element,
  ) {
    super('context-provider', { bubbles: true, composed: true });
    this.context = context;
    this.contextTarget = contextTarget;
  }
}
