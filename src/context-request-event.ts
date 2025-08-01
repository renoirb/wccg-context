/**
 * @fileoverview Context request event implementation (modifications: without declare global)
 * @author Google LLC
 * @license BSD-3-Clause
 * @source Copy of @lit/context@1.1.6
 * @see https://github.com/lit/lit/blob/%40lit/context%401.1.6/packages/context/src/lib/context-request-event.ts#L19-L79
 */

import {ContextType, Context} from './create-context.ts';

/**
 * A callback which is provided by a context requester and is called with the value satisfying the request.
 * This callback can be called multiple times by context providers as the requested value is changed.
 */
export type ContextCallback<ValueType> = (
  value: ValueType,
  unsubscribe?: () => void
) => void;

/**
 * Interface definition for a ContextRequest
 */
export interface ContextRequest<C extends Context<unknown, unknown>> {
  readonly context: C;
  readonly contextTarget: Element;
  readonly callback: ContextCallback<ContextType<C>>;
  readonly subscribe?: boolean;
}

/**
 * An event fired by a context requester to signal it desires a specified context with the given key.
 *
 * A provider should inspect the `context` property of the event to determine if it has a value that can
 * satisfy the request, calling the `callback` with the requested value if so.
 *
 * If the requested context event contains a truthy `subscribe` value, then a provider can call the callback
 * multiple times if the value is changed, if this is the case the provider should pass an `unsubscribe`
 * method to the callback which consumers can invoke to indicate they no longer wish to receive these updates.
 *
 * If no `subscribe` value is present in the event, then the provider can assume that this is a 'one time'
 * request for the context and can therefore not track the consumer.
 */
export class ContextRequestEvent<C extends Context<unknown, unknown>>
  extends Event
  implements ContextRequest<C>
{
  readonly context: C;
  readonly contextTarget: Element;
  readonly callback: ContextCallback<ContextType<C>>;
  readonly subscribe?: boolean;

  /**
   *
   * @param context the context key to request
   * @param contextTarget the original context target of the requester
   * @param callback the callback that should be invoked when the context with the specified key is available
   * @param subscribe when, true indicates we want to subscribe to future updates
   */
  constructor(
    context: C,
    contextTarget: Element,
    callback: ContextCallback<ContextType<C>>,
    subscribe?: boolean
  ) {
    super('context-request', {bubbles: true, composed: true});
    this.context = context;
    this.contextTarget = contextTarget;
    this.callback = callback;
    this.subscribe = subscribe ?? false;
  }
}
