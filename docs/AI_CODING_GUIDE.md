# AI Coding Guide for Paged.js

**Optimized Reference for AI-Assisted Development**

This guide is specifically designed to help AI coding assistants understand and work effectively with the Paged.js codebase.

---

## Quick Start for AI Assistants

### Understanding the Codebase

Paged.js is a **CSS Paged Media polyfill** that converts HTML+CSS into paginated documents suitable for PDF generation. Think of it as a print preview engine that runs in the browser.

**Core Concept:**
- Input: HTML content + CSS stylesheets
- Process: Parse, chunk into pages, apply print styles
- Output: Rendered pages in the DOM ready for printing/PDF

### Architecture at a Glance

```
┌─────────────┐
│  Previewer  │ ← Main orchestrator (start here!)
└──────┬──────┘
       │
   ┌───┴────┐
   │        │
┌──▼───┐ ┌─▼──────┐
│Polisher│ │Chunker │
│(CSS)   │ │(Layout)│
└────────┘ └────────┘
       │        │
       └───┬────┘
           ▼
      ┌─────────┐
      │Handlers │ ← Extend functionality here
      └─────────┘
```

---

## File Structure Guide

### Where to Find Things

```
src/
├── polyfill/
│   └── previewer.js          ← START HERE - Main API
├── chunker/
│   ├── chunker.js            ← Layout engine
│   ├── layout.js             ← Complex layout algorithm
│   └── page.js               ← Page object
├── polisher/
│   ├── polisher.js           ← CSS processor
│   └── base.js               ← Default styles
├── modules/
│   ├── paged-media/          ← @page rules, breaks, counters
│   ├── generated-content/    ← Running headers, string-set
│   └── filters/              ← Content cleaning
├── design-system/
│   └── design-tokens.js      ← NEW: Design system API
├── validation/
│   └── page-rule-validator.js ← NEW: Validation system
└── utils/
    ├── hook.js               ← Plugin system
    └── handlers.js           ← Handler registration

types/
├── index.d.ts                ← NEW: TypeScript definitions
└── design-tokens.d.ts        ← NEW: Design system types

templates/
├── workbook-templates.css    ← NEW: Ready-to-use layouts
└── example-workbook.html     ← NEW: Usage examples

schemas/
└── config.schema.json        ← NEW: JSON Schema for validation
```

### Key Files by Task

**Want to understand the rendering pipeline?**
→ Read `src/polyfill/previewer.js` (now has extensive JSDoc)

**Want to create a custom handler?**
→ Look at `src/modules/handler.js` and existing handlers in `src/modules/paged-media/`

**Want to validate page configurations?**
→ Use `src/validation/page-rule-validator.js`

**Want to generate workbooks programmatically?**
→ Use `src/design-system/design-tokens.js` + `templates/workbook-templates.css`

---

## Common Patterns

### Pattern 1: Creating Custom Handlers

**When to use:** Extending Paged.js functionality (e.g., adding custom page numbers, watermarks, dynamic headers)

```javascript
import Handler from './src/modules/handler.js';

class MyCustomHandler extends Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    // Initialization
  }

  // Implement any lifecycle hooks you need
  afterPageLayout(page, contents, breakToken) {
    // Modify page after layout
    // page.element = the DOM element for this page
    // page.number = page number (1-indexed)
    console.log(`Processing page ${page.number}`);
  }

  finalizePage(fragment, page, breakToken) {
    // Last chance before page is rendered
  }

  afterRendered(pages) {
    // All pages are done
    console.log(`Total pages: ${pages.length}`);
  }
}

// Register the handler
import Previewer from './src/polyfill/previewer.js';
Previewer.registerHandlers(MyCustomHandler);
```

**Available Hooks:**

Chunker hooks (DOM manipulation):
- `beforeParsed(content)` - Before HTML parsing
- `filter(content)` - DOM filtering after parse
- `afterParsed(content)` - After parsing complete
- `beforePageLayout(page, contents, breakToken)` - Before laying out a page
- `onPageLayout(page, contents, breakToken)` - During layout
- `afterPageLayout(page, contents, breakToken)` - After layout complete
- `finalizePage(fragment, page, breakToken)` - Final modifications
- `afterRendered(pages)` - All pages complete

Polisher hooks (CSS manipulation):
- `onAtPage(node)` - Process @page rules
- `onRule(node)` - Process CSS rules
- `onDeclaration(declaration, dItem, dList, rule)` - Process CSS properties
- `onSelector(selector, sItem, sList)` - Process selectors

### Pattern 2: Using the Design System

**When to use:** Generating workbooks or documents with consistent design

```javascript
import { DesignSystemFactory } from './src/design-system/design-tokens.js';

// 1. Create a design system
const designSystem = DesignSystemFactory.create({
  pageSize: 'A4',  // or 'Letter', 'A5', etc.
  tokens: {
    typography: {
      body: '11pt',
      h1: '20pt',
      h2: '16pt'
    },
    colors: {
      primary: '#0066cc',
      accent: '#ff6600'
    },
    spacing: {
      md: '1em',
      lg: '1.5em'
    }
  },
  components: {
    worksheet: {
      backgroundColor: '#f9f9f9',
      borderColor: '#cccccc',
      padding: '12pt'
    }
  },
  printService: 'amazon-kdp'  // Validates against print service requirements
});

// 2. Export as CSS
const css = DesignSystemFactory.toCSS(designSystem);
// Inject into page or save to file

// 3. Validate
const validation = DesignSystemFactory.validate(designSystem);
if (!validation.valid) {
  console.error('Design system has errors:', validation.errors);
}
```

### Pattern 3: Validating Page Configurations

**When to use:** Ensuring print-ready output, checking against print service requirements

```javascript
import { PageRuleValidator } from './src/validation/page-rule-validator.js';

const validator = new PageRuleValidator({
  strict: true,
  printService: 'amazon-kdp'  // or 'etsy', 'lulu'
});

const pageConfig = {
  size: { width: '210mm', height: '297mm' },
  margins: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
  bleed: { top: '3mm', right: '3mm', bottom: '3mm', left: '3mm' }
};

const result = validator.validate(pageConfig);

if (!result.valid) {
  // Errors prevent printing
  result.errors.forEach(error => {
    console.error(`ERROR: ${error.message}`);
    if (error.suggestion) {
      console.log(`  → ${error.suggestion}`);
    }
  });
}

if (result.warnings.length > 0) {
  // Warnings are informational
  result.warnings.forEach(warning => {
    console.warn(`WARNING: ${warning.message}`);
  });
}

// Or get a formatted report
console.log(PageRuleValidator.formatReport(result));
```

### Pattern 4: Event-Driven Processing

**When to use:** Monitoring progress, collecting metrics, post-processing

```javascript
import Previewer from './src/polyfill/previewer.js';

const previewer = new Previewer();

// Track progress
let pageCount = 0;
previewer.on('page', (page) => {
  pageCount++;
  console.log(`Created page ${pageCount}: ${page.id}`);
});

// Rendering started
previewer.on('rendering', () => {
  console.log('Starting to render...');
});

// All done
previewer.on('rendered', (flow) => {
  console.log(`✓ Complete: ${flow.pages.length} pages in ${flow.performance}ms`);
  // Post-process, export to PDF, etc.
});

await previewer.preview();
```

### Pattern 5: Using Hooks for Setup/Teardown

**When to use:** Loading fonts, preparing content, cleanup

```javascript
const previewer = new Previewer();

// Before rendering starts
previewer.hooks.beforePreview.register(async (content, renderTo) => {
  console.log('Loading web fonts...');
  await document.fonts.ready;
  console.log('Fonts loaded');
});

// After rendering completes
previewer.hooks.afterPreview.register(async (pages) => {
  console.log('Generating table of contents...');
  generateTOC(pages);
  console.log('Adding watermarks...');
  addWatermarks(pages);
});

await previewer.preview();
```

---

## Type Information for AI Assistants

### TypeScript Definitions Location

All types are defined in `types/index.d.ts` and `types/design-tokens.d.ts`

### Key Type Interfaces

```typescript
// Configuration
interface PagedConfig {
  auto?: boolean;
  before?: () => void | Promise<void>;
  after?: (flow: any) => void | Promise<void>;
  settings?: ChunkerSettings;
}

// Page configuration
interface PageDefinition {
  name?: string;
  pseudo?: 'first' | 'left' | 'right' | 'blank' | null;
  size?: PageSize;
  margin?: PageMargins;
  bleed?: PageBleed;
}

// Design system
interface WorkbookDesignSystem {
  tokens: WorkbookDesignTokens;
  components: WorkbookComponentTokens;
  pageLayout: PageLayoutConfig;
  printSpecs?: PrintServiceSpecs;
}
```

### JSDoc is Your Friend

Every major method now has comprehensive JSDoc comments. Use them!

Example from `previewer.js`:

```javascript
/**
 * Preview content - main rendering pipeline
 *
 * @param {string|Element|DocumentFragment} [content] - Content to paginate
 * @param {Array<string|CSSStyleSheet>} [stylesheets] - Stylesheets to apply
 * @param {HTMLElement} [renderTo] - Container element
 * @returns {Promise<Object>} Flow object with pages array
 *
 * @example
 * const flow = await previewer.preview();
 * console.log(`Created ${flow.pages.length} pages`);
 */
async preview(content, stylesheets, renderTo) { ... }
```

---

## Data Flow Understanding

### How Content Becomes Pages

```
1. HTML Content (string or DOM)
   ↓
2. Previewer.preview() called
   ↓
3. beforePreview hooks execute
   ↓
4. Polisher processes CSS (@page rules, etc.)
   ↓
5. Chunker.flow() starts
   ↓
6. Content parsed into DOM (beforeParsed hook)
   ↓
7. Filters clean up DOM (filter hook)
   ↓
8. Layout engine creates pages iteratively:
   - Create blank page
   - beforePageLayout hook
   - Layout content (may overflow)
   - afterPageLayout hook
   - If overflow: create break token, repeat
   ↓
9. finalizePage hook for each page
   ↓
10. afterRendered hook
    ↓
11. afterPreview hooks execute
    ↓
12. Flow object returned with pages array
```

### Important Objects

**Page Object:**
```javascript
{
  id: "page-1",
  number: 1,
  element: HTMLElement,
  wrapper: HTMLElement,
  position: "left" | "right" | "center",
  width: 612,  // pixels
  height: 792,
  name: "chapter"  // if named page
}
```

**Flow Object:**
```javascript
{
  pages: Array<Page>,
  performance: 1234,  // milliseconds
  size: {
    width: { value: 8.5, unit: "in" },
    height: { value: 11, unit: "in" }
  }
}
```

**Break Token:**
```javascript
{
  node: DOMNode,      // Where break occurred
  offset: 123,        // Character/child offset
  overflow: true      // Whether it's an overflow break
}
```

---

## Common Tasks & Solutions

### Task: Add custom page numbers

```javascript
class CustomPageNumbers extends Handler {
  afterPageLayout(page) {
    // Find the bottom-center margin box
    const marginBox = page.element.querySelector('.pagedjs_margin-bottom-center');
    if (marginBox) {
      marginBox.innerHTML = `<span>Page ${page.number}</span>`;
    }
  }
}

Previewer.registerHandlers(CustomPageNumbers);
```

### Task: Add a watermark to every page

```javascript
class WatermarkHandler extends Handler {
  finalizePage(fragment, page) {
    const watermark = document.createElement('div');
    watermark.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 72pt;
      color: rgba(0, 0, 0, 0.1);
      pointer-events: none;
      z-index: 9999;
    `;
    watermark.textContent = 'DRAFT';
    page.element.appendChild(watermark);
  }
}
```

### Task: Generate a table of contents

```javascript
const toc = [];

class TOCHandler extends Handler {
  afterPageLayout(page, contents) {
    // Find all h1 elements on this page
    const headings = contents.querySelectorAll('h1');
    headings.forEach(heading => {
      toc.push({
        title: heading.textContent,
        page: page.number
      });
    });
  }

  afterRendered(pages) {
    console.log('Table of Contents:', toc);
    // Generate TOC page
  }
}
```

### Task: Validate before rendering

```javascript
import { PageRuleValidator } from './src/validation/page-rule-validator.js';

async function renderWithValidation(config) {
  // 1. Validate
  const validator = new PageRuleValidator({
    strict: true,
    printService: 'amazon-kdp'
  });

  const result = validator.validate(config.pageLayout);

  if (!result.valid) {
    throw new Error(`Invalid configuration:\n${PageRuleValidator.formatReport(result)}`);
  }

  if (result.warnings.length > 0) {
    console.warn('Configuration warnings:', result.warnings);
  }

  // 2. Render
  const previewer = new Previewer();
  const flow = await previewer.preview();

  return flow;
}
```

---

## Debugging Tips

### Enable Verbose Logging

```javascript
class DebugHandler extends Handler {
  beforePageLayout(page, contents, breakToken) {
    console.log(`[BEFORE LAYOUT] Page ${page.number}`, {
      contents: contents.innerHTML.length,
      breakToken
    });
  }

  afterPageLayout(page, contents, breakToken) {
    console.log(`[AFTER LAYOUT] Page ${page.number}`, {
      overflow: !!breakToken,
      pageHeight: page.element.offsetHeight
    });
  }

  finalizePage(fragment, page, breakToken) {
    console.log(`[FINALIZE] Page ${page.number}`, {
      hasMore: !!breakToken
    });
  }
}

Previewer.registerHandlers(DebugHandler);
```

### Inspect Page Elements

All rendered pages have the class `.pagedjs_page`. Inspect them:

```javascript
previewer.on('rendered', () => {
  const pages = document.querySelectorAll('.pagedjs_page');
  console.log(`Rendered ${pages.length} pages`);

  pages.forEach((page, i) => {
    console.log(`Page ${i + 1}:`, {
      width: page.offsetWidth,
      height: page.offsetHeight,
      classes: page.className
    });
  });
});
```

### Check CSS Processing

```javascript
class CSSDebugHandler extends Handler {
  onAtPage(node) {
    console.log('[CSS] @page rule:', node);
  }

  onRule(node) {
    console.log('[CSS] Rule:', node);
  }
}
```

---

## Best Practices for AI Code Generation

### DO:
✅ Use TypeScript type definitions for accurate parameter types
✅ Reference JSDoc comments for method behavior
✅ Use design tokens for consistent styling
✅ Validate configurations before rendering
✅ Use handlers for extending functionality (don't modify core files)
✅ Use events to monitor progress
✅ Use hooks for setup/teardown
✅ Check the templates directory for ready-to-use layouts

### DON'T:
❌ Modify core Paged.js files (`src/chunker/`, `src/polisher/`) directly
❌ Skip validation for production print jobs
❌ Use pixel units for print dimensions (use mm, in, pt)
❌ Ignore warnings from the validator
❌ Create handlers without extending the Handler base class
❌ Use synchronous operations in async hooks

---

## Understanding CSS Paged Media

### Supported @page Features

```css
@page {
  /* Page size */
  size: A4;  /* or Letter, Legal, or custom "210mm 297mm" */
  size: A4 landscape;

  /* Margins */
  margin: 20mm;
  margin-top: 25mm;
  margin-bottom: 20mm;

  /* Bleed */
  bleed: 3mm;

  /* Marks */
  marks: crop cross;
}

/* Named pages */
@page chapter {
  margin: 30mm;
}

.chapter {
  page: chapter;
}

/* Page selectors */
@page :first {
  margin-top: 0;
}

@page :left {
  margin-left: 30mm;
}

@page :right {
  margin-right: 30mm;
}

@page :blank {
  /* Blank pages in double-sided printing */
}

/* Margin boxes */
@page {
  @top-center {
    content: string(chapter-title);
  }

  @bottom-center {
    content: counter(page);
  }
}
```

### Supported Generated Content Features

```css
/* Running headers */
h1 {
  string-set: chapter-title content();
}

@page {
  @top-center {
    content: string(chapter-title);
  }
}

/* Page counters */
@page {
  @bottom-center {
    content: "Page " counter(page) " of " counter(pages);
  }
}

/* Target counters */
a::after {
  content: " (page " target-counter(attr(href), page) ")";
}

/* Footnotes */
.footnote {
  float: footnote;
}

::footnote-call {
  content: counter(footnote);
}

::footnote-marker {
  content: counter(footnote) ". ";
}
```

### Page Break Control

```css
h1, h2, h3 {
  page-break-after: avoid;
  break-after: avoid;
}

.chapter {
  page-break-before: always;
  break-before: always;
}

table, figure {
  page-break-inside: avoid;
  break-inside: avoid;
}

p {
  orphans: 3;  /* Min lines at bottom of page */
  widows: 3;   /* Min lines at top of next page */
}
```

---

## Reference Links

- **W3C CSS Paged Media Spec**: https://www.w3.org/TR/css-page-3/
- **W3C Generated Content for Paged Media**: https://www.w3.org/TR/css-gcpm-3/
- **Paged.js Homepage**: https://pagedmedia.org
- **API Documentation**: See `docs/API.md`

---

## Quick Reference Card

```
MAIN API:
  Previewer.preview(content, stylesheets, renderTo) → Promise<flow>

EXTEND FUNCTIONALITY:
  class MyHandler extends Handler { ... }
  Previewer.registerHandlers(MyHandler)

DESIGN SYSTEM:
  DesignSystemFactory.create(options) → designSystem
  DesignSystemFactory.toCSS(designSystem) → string

VALIDATION:
  new PageRuleValidator(options)
  validator.validate(pageConfig) → {valid, errors, warnings}

EVENTS:
  previewer.on('page', handler)
  previewer.on('rendered', handler)

HOOKS:
  previewer.hooks.beforePreview.register(fn)
  previewer.hooks.afterPreview.register(fn)

HANDLER LIFECYCLE:
  beforeParsed → filter → afterParsed
  → beforePageLayout → onPageLayout → afterPageLayout
  → finalizePage → afterRendered
```

---

This guide should give you everything you need to work effectively with Paged.js. Remember: when in doubt, check the TypeScript definitions and JSDoc comments - they're comprehensive and up-to-date!
