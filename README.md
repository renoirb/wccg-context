# wccg-context

Minimal implementation of the [W3C Web Components Community Group Context Protocol](https://github.com/webcomponents-cg/community-protocols/blob/main/proposals/context.md) with complete late resolution support.

## Overview

The Context Protocol enables web components to request data from ancestor elements without prop drilling. Components fire `context-request` events, and providers respond with the requested data.

**This is data sharing, not dependency injection.** Components request simple data objects from their context, they do not receive services, loggers, or other dependencies.

## Features

- **Complete Protocol Compliance**: Full WCCG Context Protocol implementation
- **Late Resolution Support**: Handles providers registering after consumers
- **Framework Agnostic**: Works with any client side JavaScript as it is leveraging native browser events already part of how browsers work. Which can be used from any library or vanilla implementations
- **Zero Dependencies**: Pure JavaScript with no external requirements
- **Memory Safe**: WeakRef-based cleanup prevents memory leaks
- **TypeScript Native**: Full type definitions with JSR auto-transpilation

## Installation

```bash
# JSR (recommended)
deno add jsr:@jsr/wccg-context
npx jsr add wccg-context

# npm (auto-generated from JSR)
npm install @jsr/wccg-context
```

### HTTP Imports

```html
<html>
  <head>
    <script type="importmap">
      {
        "imports": {
          "wccg-context": "https://esm.sh/@jsr/wccg-context"
        }
      }
    </script>
    <script type="module">
      import {/* ... */} from 'wccg-context'
    </script>
  </head>
  <body></body>
</html>
```

Or direct import:

```javascript
import {
  /* ... */
} from 'https://esm.sh/@jsr/wccg-context'
```

## Basic Usage

### File basic-usage.html

```html
<html>
  <head>
    <script type="importmap">
      {
        "imports": {
          "wccg-context": "https://esm.sh/@jsr/wccg-context"
        }
      }
    </script>
    <script
      type="module"
      src="example-early-context-resolver.mjs"
    ></script>
    <script
      type="module"
      src="example-components.mjs"
    ></script>
  </head>
  <body>
    <!-- ... -->
    <jsonresume-basics></jsonresume-basics>
    <jsonresume-work-experience></jsonresume-work-experience>
  </body>
</html>
```

### File example-early-context-resolver.mjs

````javascript
/**
 * IMPORTANT: It is best to listen to context-request (a "Resolver")
 * as early as possible.
 * If you cannot, read more about ContextRoot and "late resolution".
 */

// Resume data (simple POJO)
const EXAMPLE_DATA_ALREADY_AVAILABLE = {
  basics: {
    name: 'Alex Developer',
    email: 'alex@example.com',
    phone: '+1-555-0123',
    summary: 'Full-stack developer with 5 years experience',
  },
  work: [{
    company: 'Tech Corp',
    position: 'Senior Developer',
    startDate: '2020-01-15',
    summary: 'Led frontend architecture initiatives',
  }],
  skills: [{
    name: 'JavaScript',
    level: 'Advanced',
  }, {
    name: 'TypeScript',
    level: 'Intermediate',
  }],
}

window.document.addEventListener('context-request', (event) => {
  // Filter only for the responsibility of that context-request
  if (event.context !== 'jsonresume-data') {
    return
  }
  // If you need to access the element that initiated the context-request
  const contextTarget = event.contextTarget
  // If all conditions for this resolver are met:
  event.stopImmediatePropagation()
  const payload = createTodaysDate()
  event.callback(EXAMPLE_DATA_ALREADY_AVAILABLE)
})
````

### File example-components.mjs

```javascript
import { ContextRequestEvent } from 'wccg-context'

class ResumeBasics extends HTMLElement {
  // ...

  connectedCallback() {
    this.dispatchEvent(
      new ContextRequestEvent(
        'jsonresume-data',
        this,
        (resume) => this.#render(resume.basics),
        false,
      ),
    )
  }

  #render = (basics) => {
    this.innerHTML = `
      <header>
        <h1>${basics.name}</h1>
        <p>${basics.email} | ${basics.phone}</p>
        <p>${basics.summary}</p>
      </header>
    `
  }
}

class ResumeWorkExperience extends HTMLElement {
  // ...

  connectedCallback() {
    this.dispatchEvent(
      new ContextRequestEvent(
        'jsonresume-data',
        this,
        (resume) => this.#render(resume.work),
        false,
      ),
    )
  }

  #render = (work) => {
    this.innerHTML = work.map((job) => `
      <article>
        <h3>${job.position} at ${job.company}</h3>
        <time>${job.startDate}</time>
        <p>${job.summary}</p>
      </article>
    `).join('')
  }
}

customElements.define('jsonresume-basics', ResumeBasics)
customElements.define('jsonresume-work-experience', ResumeWorkExperience)
```

## What This Is NOT

❌ **Dependency Injection**: Don’t pass services, loggers, or API clients
❌ **Data Fetching**: Components should not load their own data
❌ **State Management**: Use dedicated state libraries for complex state

✅ **Data Sharing**: Pass simple data objects down the component tree
✅ **Configuration**: Share application-level configuration
✅ **Static Resources**: Provide loaded content like JSONResume data

## API Reference

### Core Protocol

#### ContextRequestEvent

```javascript
new ContextRequestEvent(context, element, callback, subscribe?)
```

Dispatched by components to request contextual data.

- `context`: String identifier for the requested context
- `element`: The requesting element (usually `this`)
- `callback`: Function called with the context data
- `subscribe`: Optional boolean for ongoing updates

#### ContextRoot

```javascript
const root = new ContextRoot()
root.attach(element) // Begin intercepting context requests
root.detach(element) // Stop and cleanup
```

Buffers unsatisfied context requests and replays them when providers become available.

#### ContextProviderEvent

```javascript
element.dispatchEvent(
  new ContextProviderEvent(
    context,
    element,
  ),
)
```

Announces that a provider is available for a context.

## Implementation Notes

**Late Resolution**: `ContextRoot` buffers requests with `subscribe: true` and replays them when providers announce availability via `ContextProviderEvent`. This enables dynamic loading scenarios where data arrives after components are rendered.

**Memory Management**: Uses WeakRef patterns to ensure proper garbage collection when components are removed from the DOM.

**Event Propagation**: Providers call `stopImmediatePropagation()` to prevent multiple providers from handling the same request.

## Credits

- **Specification**: [W3C Web Components Community Group](https://github.com/webcomponents-cg/community-protocols/)
- **Reference Implementation**: Core patterns adapted from [Lit’s @lit/context](https://github.com/lit/lit/tree/main/packages/context) (BSD-3-Clause)
- **Development**: Created in collaboration with WCCG and Lit teams
