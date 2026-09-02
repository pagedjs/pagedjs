# Generated content

Paged.js implements the Generated Content for Paged Media features
([css-gcpm-3](https://www.w3.org/TR/css-gcpm-3/)) and the target functions of
[css-content-3 §5.3](https://www.w3.org/TR/css-content-3/#target) as layout
handlers. Each feature is one class in this directory, carrying both the CSS
rewrite it needs and the runtime that consumes it.

| Feature | CSS | Handler |
| --- | --- | --- |
| Named strings | `string-set`, `string(name, mode)` | `NamedStrings` |
| Running elements | `position: running(name)`, `content: element(name, mode)` | `RunningElements` |
| Target text | `target-text(<target>, <mode>)` | `TargetText` |
| Target counters | `target-counter()`, `target-counters()` | `TargetCounters` |
| Footnotes | `float: footnote`, `@footnote`, `::footnote-call`, `::footnote-marker` | `Footnote` |
| Page counter | `counter(page)`, `counter(pages)` | `PageCounter` |
| Source filters | — (removes `<script>` and comments) | `SourceFilters` |

Two modules here are shared helpers rather than handlers. `occurrences.js`
(`selectPerMode`, `exitValue`, `opensFragment`, `parseOccurrenceCall`) is shared
by named strings and running elements: both answer *which of a name's
occurrences applies to this page*, and differ only in what an occurrence
carries. `targets.js` is the equivalent for the two target features — target
resolution, reference collection, stamping, and warning deduplication.

`index.js` is the wiring list: it exports `pagedHandlers` and registers it into
`Fragmenter.handlers` at import.

## Hooks

A handler reaches the pipeline through the `LayoutHandler` methods it overrides.
The ones the generated-content handlers use, in the order a render calls them:

| Hook | When | Used for |
| --- | --- | --- |
| `init(options, context)` | Flow construction | Keep the `FlowContext`, which is how a handler reaches `flow.registerLayoutPass`. |
| `resetRules()` | Before each rule walk | Discard state accumulated from the previous walk. |
| `matchRule(rule)` | Once per leaf `CSSStyleRule` | Read what the rewrite left behind — `--string-set`, `--page-position`, `--paged-generated-<id>-source`. |
| `appendRules(rules)` | After the rule walk | Push default CSS (footnote call and marker styling). |
| `prepareContent(content)` | Before measurement, on the source tree | Mark, move, or remove source elements. The whole document is visible here and nowhere else. |
| `afterMeasurementSetup(root)` | Per measured segment, live DOM | Read computed style. Only the elements of the active segment are connected. |
| `afterLayoutPass(context)` | End of each layout pass | Stamp resolved values; return `{ invalidate }` to ask for another pass. |
| `afterCompose(element, fragment)` | Per composed `<fragment-container>` | Write per-page annotations. |
| `getFlow()` / `getFlowCap()` / `extractFlowChildren()` / `composeFlowFragment()` | Per page | Run a parallel flow, and cap how much of the page it may take (footnotes only). |
| `destroy()` | Flow teardown | Release measurers and flows. |

Two rules decide where a feature's work belongs:

- **Values that do not depend on pagination resolve before the first layout.**
  A named string is copied from the source element, not the composed clone,
  because an element that splits across fragmentainers leaves only part of its
  text on each. A counter's value likewise comes from a document-order walk of
  the source tree. Both are settled in `prepareContent` /
  `afterMeasurementSetup` and cost no extra layout.
- **Values that depend on where content landed resolve in the pass loop.**
  `target-counter(page)` needs the fragment its target reached, and
  `target-text(..., before|after)` needs a pseudo-element that only the live
  measurer materializes.

## The pass loop

A handler that cannot resolve everything before the first layout asks the flow
for a budget:

```js
this.#context?.flow?.registerLayoutPass(3);
```

The flow keeps the **largest** budget any handler requests, so asking once per
occurrence is the same as asking once. Three passes is what a stamped value
costs: one to discover it, one to stamp it and re-flow, one for the re-flow to
settle.

After each pass the flow calls `afterLayoutPass(context)`. A handler stamps its
values and reports the elements whose boxes changed:

```js
return invalidate.length > 0 ? { invalidate } : null;
```

Returning `null` means nothing changed. The loop stops as soon as no handler
reports an invalidation, so the budget is a ceiling, not a cost — a document
whose generated values do not shift pagination settles on the second pass. Only
the fragmentainers the invalidated elements landed on are laid out again, from
the earliest of them onward; returning `{ rebuild: true }` instead re-runs the
whole flow.

When the budget is exhausted with work still outstanding, the flow calls
`onPassLimit`. If no handler returns `{ accept: true }`, it throws
`LayoutPassLimitError` — an unsettled document is a bug, not a degraded
rendering.

`context.locate(element)` is how a handler asks where a source element ended up;
it returns one entry per fragmentainer the element reached, and target counters
take the first, since the page a cross-reference means is the page a target
*starts* on.

## The annotation contract

Handlers are handed a `<fragment-container>`, but `@page` rules style a
`<paged-page>`. Annotations bridge the two, and the bridge is a namespace:
`PagedPage` copies every custom property in the `--paged-` namespace from the
adopted container onto its own host, and nothing else. A document's own custom
properties are never copied.

Written by a handler onto the composed `<fragment-container>`:

| Property | Written by | Read by |
| --- | --- | --- |
| `--paged-page` | `PageCounter` | `counter-set: page var(--paged-page)` in the `<paged-page>` shadow root |
| `--paged-string-<mode>-<name>` | `NamedStrings` | `content: var(--paged-string-first-title, "")` in a margin box |
| `--paged-generated-<id>` | `TargetText`, `TargetCounters` (plural form) | `content: var(--paged-generated-text-0, "")` |
| `--paged-<id>` | `TargetCounters` (singular form), as an inline `counter-reset` | `content: counter(--paged-tc-0, lower-roman)` |

Running elements are the exception: an element cannot travel through a custom
property, so `RunningElements` sets a `runningElements` object on the container
and `<paged-page>` reads it directly, keyed by the
`--paged-running-element: <name> <mode>` request the cascade leaves on each
margin box.

Written by the stylesheet build, from extracted `@page` data
(`buildPagedVariableRules`): `--paged-width`, `--paged-height`,
`--paged-bleed`, `--paged-margin-{top,right,bottom,left}`, `--paged-marks`,
`--paged-page-orientation`. `<paged-document>` publishes `--paged-page-count`
once the flow completes, which is what makes `counter(pages)` a total rather
than a running number. `--paged-mark-color` is not an annotation but a
`<paged-page>` style knob, and can be set by author CSS.

Custom properties the rewrite introduces so a browser will keep a value it would
otherwise discard: `--float` (`float: footnote`), `--footnote-policy`,
`--string-set` (`string-set`), `--page-position` (`position: running()`), and
`--paged-generated-<id>-source`, which carries the original function tokens
through the sheet so the handler rediscovers its own occurrences without sharing
state with the build that rewrote them.

## Diagnostics

Malformed input warns and renders empty; it never aborts a flow. A missing
target, a target in another document, a `string-set` naming an unsupported
`content()` argument, and an unreadable source declaration each produce one
`console.warn`.

Warnings are deduplicated per flow — `createWarner()` in `targets.js`, and
`#warn` in `NamedStrings` — so a selector matching a thousand elements warns
once, not a thousand times. Nothing is logged at any other level: `no-console`
allows only `warn` and `error`.

## Support status

The [feature matrix on pagedjs.org](https://pagedjs.org/en/documentation/14-supported-feature-of-the-w3c-specifications/)
describes the released library. This engine is ahead of it in six places:

| Feature | pagedjs.org | Here |
| --- | --- | --- |
| Footnotes | not supported | `float: footnote`, `@footnote`, `::footnote-call`, `::footnote-marker`, `footnote-policy` |
| `target-counters()` | not supported | implemented, with separator and counter style |
| `target-counter(…, page)` | partial | implemented, resolved through `locate()` |
| `attr()` in `string-set` | not supported | implemented |
| `string()` modes | `first-except` only | all four of `first`, `start`, `last`, `first-except` |
| `element()` modes | not supported | all four |

It matches the published matrix on what is still missing: `content(before)`,
`content(after)` and `content(first-letter)` in `string-set`, leaders, and PDF
bookmarks.

`counter()` and `counters()` are not accepted as `string-set` values; each warns
once and contributes an empty string.

## Limitations

- **A page break never falls inside a generated value.** A stamped value has no
  text offsets, so it moves whole to the next fragmentainer. A `target-text()`
  long enough to need breaking will overflow instead.
- **`string-set: content(before)`, `content(after)` and `content(first-letter)`
  resolve empty.** Only `content()` and `content(text)` are implemented; the
  others need generated content the measurer collects for target text.
- **`target-text()` of a pseudo whose content includes a `counter()` resolves
  empty**, alone or joined with strings: computed style reports the function
  unresolved, and the string parts on their own are not the value.
- **`attr()` mixed with `var()` or `counter()` in one `content` value resolves
  empty.** The value relocates onto the materialized pseudo, where `attr()`
  resolves against the wrong element. Routing the attribute through a custom
  property is the workaround.
- **Running-element clones keep their subtree and direct styles**, but not their
  ancestors: a selector that depended on where the element used to sit may not
  match after projection.
- **`element()` is margin-box content only.**
- **Cross-document targets are not resolved.** A target URL with a path before
  its fragment warns and renders empty.
- **`target-counters()` formatting is implemented in JavaScript** for the
  predefined counter styles of
  [css-counter-styles-3 §6](https://www.w3.org/TR/css-counter-styles-3/#predefined-counters);
  an unknown style falls back to decimal. The singular `target-counter()` is
  formatted by the browser from a real counter and supports whatever the browser
  does.
- **A body-level `<style>` is dropped.** Under the polyfill it is invisible to
  `PrintStyleSheet.fromDocument`, which scans the document after the body's
  children have already moved into the content fragment.

## Not implemented

Out of scope for this implementation: leaders, bookmarks, GCPM 4,
`@counter-style`, and cross-flow targets.

## Tests

```bash
npm test      # test/ — behavior tests in Chromium, one page per case
npm run specs # specs/handlers + specs/preview — full-pipeline specs
npm run lint
```

Both suites load source modules directly through an import map; neither needs a
build. Feature coverage lives in `test/cases/` at the repository root:
`named-strings.case.js`, `running-elements.case.js`, `occurrences.case.js`,
`target-text.case.js`, `target-counters.case.js`, `source-filters.case.js`.
