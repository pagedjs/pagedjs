# Paged.js API Documentation

**AI-Optimized API Reference for Print-Ready Document Generation**

## Table of Contents

- [Overview](#overview)
- [Core Classes](#core-classes)
  - [Previewer](#previewer)
  - [Chunker](#chunker)
  - [Polisher](#polisher)
  - [Handler](#handler)
- [TypeScript Support](#typescript-support)
- [Design System](#design-system)
- [Validation](#validation)
- [Templates](#templates)
- [Configuration Schema](#configuration-schema)
- [Event System](#event-system)
- [Hooks](#hooks)

---

## Overview

Paged.js is a polyfill for W3C CSS Paged Media and Generated Content for Paged Media specifications. It enables professional print-ready PDF generation from HTML and CSS in the browser, with comprehensive support for features like page breaks, running headers, footnotes, and margin boxes.

### Key Features

- ✅ **TypeScript Definitions** - Full type support for IDE autocomplete and AI code assistance
- ✅ **Design Token System** - Programmatic control over typography, spacing, and colors
- ✅ **Strict Validation** - Validate page configurations against print service requirements
- ✅ **Template Library** - Ready-to-use layouts for workbooks and professional documents
- ✅ **Comprehensive JSDoc** - Detailed documentation for all public APIs
- ✅ **Event-Driven** - Hook into every stage of the rendering pipeline

---

## Core Classes

### Previewer

Main orchestrator for the paged.js rendering pipeline. Coordinates the interaction between the Polisher (CSS processing) and Chunker (content layout).

#### Constructor

```javascript
const previewer = new Previewer(options);
```

**Parameters:**

- `options` (Object, optional)
  - `maxPages` (number) - Maximum number of pages to render (useful for testing)
  - `handlers` (Object) - Enable/disable specific handlers
    - `footnotes` (boolean) - Enable footnote handler (default: true)
    - `runningHeaders` (boolean) - Enable running headers handler (default: true)
    - `counters` (boolean) - Enable CSS counters (default: true)

**Example:**

```javascript
// Basic usage
const previewer = new Previewer();
await previewer.preview();

// With custom settings
const previewer = new Previewer({
  maxPages: 100,
  handlers: {
    footnotes: true,
    runningHeaders: true
  }
});
```

#### Methods

##### preview(content, stylesheets, renderTo)

Main rendering method. Paginates HTML content and generates pages.

**Parameters:**

- `content` (string|Element|DocumentFragment, optional) - Content to paginate. If not provided, uses document body
- `stylesheets` (Array<string|CSSStyleSheet>, optional) - Stylesheets to apply. If not provided, extracts from document
- `renderTo` (HTMLElement, optional) - Container element to render pages into

**Returns:** `Promise<Object>` - Flow object containing:

- `pages` (Array) - Array of page objects
- `performance` (number) - Rendering time in milliseconds
- `size` (Object) - Page size information

**Example:**

```javascript
// Preview entire document
const flow = await previewer.preview();
console.log(`Created ${flow.pages.length} pages in ${flow.performance}ms`);

// Preview specific content
const content = document.getElementById('my-content');
const styles = ['styles/print.css', 'styles/layout.css'];
const container = document.getElementById('render-container');
const flow = await previewer.preview(content, styles, container);
```

#### Events

Listen to events emitted during the rendering process:

```javascript
// Emitted when a new page is created
previewer.on('page', (page) => {
  console.log(`Page ${page.number} created`);
});

// Emitted when rendering starts
previewer.on('rendering', (chunker) => {
  console.log('Rendering started');
});

// Emitted when all pages are rendered
previewer.on('rendered', (flow) => {
  console.log(`Rendered ${flow.pages.length} pages`);
});

// Emitted when page size is determined
previewer.on('size', (size) => {
  console.log(`Page size: ${size.width.value}${size.width.unit} x ${size.height.value}${size.height.unit}`);
});
```

#### Static Methods

##### registerHandlers(...handlers)

Register custom handler classes to extend functionality.

**Parameters:**

- `...handlers` (Function[]) - One or more handler classes

**Example:**

```javascript
class CustomHandler extends Handler {
  afterPageLayout(page, contents, breakToken) {
    // Custom page processing
    console.log(`Processing page ${page.number}`);
  }
}

Previewer.registerHandlers(CustomHandler);
```

---

### Chunker

Content layout engine that creates pages. Handles document pagination, break tokens, and overflow management.

#### Constructor

```javascript
const chunker = new Chunker(content, renderTo, settings);
```

**Parameters:**

- `content` (Element) - Content to paginate
- `renderTo` (HTMLElement, optional) - Container to render into
- `settings` (Object, optional) - Chunker settings

#### Methods

##### flow(content, renderTo)

Flow content through pages.

**Parameters:**

- `content` (Element) - Content to paginate
- `renderTo` (HTMLElement, optional) - Container element

**Returns:** `Promise<Object>` - Flow information with pages array

---

### Polisher

CSS processor that handles @page rules and transformations. Parses CSS using css-tree and applies Paged Media specifications.

#### Constructor

```javascript
const polisher = new Polisher(setup);
```

**Parameters:**

- `setup` (boolean, optional) - Whether to run setup immediately

#### Methods

##### setup()

Setup polisher and load default styles.

**Returns:** `Promise<void>`

##### add(...stylesheets)

Add and process stylesheets.

**Parameters:**

- `...stylesheets` (Array<string|HTMLStyleElement>) - Stylesheet URLs or style elements

**Returns:** `Promise<void>`

**Example:**

```javascript
const polisher = new Polisher(false);
await polisher.setup();
await polisher.add('styles/print.css', 'styles/layout.css');
```

---

### Handler

Base class for extending paged.js functionality. Handlers can implement lifecycle hooks to modify CSS or manipulate pages.

#### Constructor

```javascript
class MyHandler extends Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
  }
}
```

**Parameters:**

- `chunker` (Chunker) - Chunker instance
- `polisher` (Polisher) - Polisher instance
- `caller` (Previewer) - Previewer instance

#### Lifecycle Hooks

Handlers can implement any of these methods:

**Chunker Hooks:**

```javascript
class MyHandler extends Handler {
  // Called before content is parsed
  beforeParsed(content) {
    // Modify raw HTML content
  }

  // Filter hook for DOM manipulation after parsing
  filter(content) {
    // Modify parsed DOM
  }

  // Called after content is parsed
  afterParsed(content) {
    // Post-parse processing
  }

  // Called before layout of a page
  beforePageLayout(page, contents, breakToken, chunker) {
    // Pre-layout modifications
  }

  // Called during page layout
  onPageLayout(page, contents, breakToken, chunker) {
    // During layout processing
  }

  // Called after page layout completes
  afterPageLayout(page, contents, breakToken, chunker) {
    // Post-layout modifications
  }

  // Called to finalize page before rendering
  finalizePage(fragment, page, breakToken) {
    // Last chance to modify page content
  }

  // Called after entire document is rendered
  afterRendered(pages) {
    // Post-rendering processing
  }
}
```

**Polisher Hooks:**

```javascript
class MyHandler extends Handler {
  // Called when @page rule is parsed
  onAtPage(node) {
    // Process @page rule
  }

  // Called for each CSS rule
  onRule(node) {
    // Process CSS rule
  }

  // Called for each CSS declaration
  onDeclaration(declaration, dItem, dList, rule) {
    // Process CSS property
  }

  // Called for pseudo-selectors
  onPseudoSelector(node, item, list) {
    // Process pseudo-selector
  }
}
```

---

## TypeScript Support

Paged.js now includes comprehensive TypeScript definitions for better AI code assistance and developer experience.

### Type Definitions

```typescript
import { Previewer, Chunker, Polisher, Handler } from 'pagedjs';
import type { PagedConfig, PageDefinition, PageSize } from 'pagedjs';

// Configure with type checking
const config: PagedConfig = {
  auto: true,
  before: async () => {
    console.log('Loading fonts...');
  },
  after: async (flow) => {
    console.log(`Created ${flow.pages.length} pages`);
  },
  settings: {
    maxPages: 100
  }
};

// Type-safe previewer usage
const previewer = new Previewer(config.settings);
await previewer.preview();
```

### Available Types

- `PagedConfig` - Global configuration object
- `PageDefinition` - Page configuration from @page rules
- `PageSize` - Page size configuration
- `PageMargins` - Margin configuration
- `PageBleed` - Bleed configuration
- `BreakToken` - Pagination position tracker
- `ChunkerHooks` - Chunker lifecycle hooks interface
- `PolisherHooks` - Polisher lifecycle hooks interface

---

## Design System

Comprehensive design token system for programmatic control over workbook generation.

### Design Token System

```javascript
import { DesignSystemFactory } from 'pagedjs/design-system/design-tokens';

// Create a design system
const designSystem = DesignSystemFactory.create({
  pageSize: 'A4',
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
  printService: 'amazon-kdp'
});

// Export as CSS
const css = DesignSystemFactory.toCSS(designSystem);
console.log(css);

// Validate design system
const validation = DesignSystemFactory.validate(designSystem);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

### Standard Page Sizes

Available standard page sizes:

- `A4` (210mm x 297mm)
- `A5` (148mm x 210mm)
- `A6` (105mm x 148mm)
- `Letter` (8.5in x 11in)
- `Legal` (8.5in x 14in)
- `Tabloid` (11in x 17in)
- `Executive` (7.25in x 10.5in)

### Print Service Specifications

Built-in specifications for major print services:

- `amazon-kdp` - Amazon Kindle Direct Publishing
- `etsy` - Etsy digital products
- `lulu` - Lulu self-publishing

---

## Validation

Strict validation system for ensuring print-ready output.

### PageRuleValidator

Validates CSS @page rules and page configurations against W3C specifications and print service requirements.

```javascript
import { PageRuleValidator } from 'pagedjs/validation/page-rule-validator';

// Create validator
const validator = new PageRuleValidator({
  strict: true,
  printService: 'amazon-kdp'
});

// Validate page configuration
const pageConfig = {
  size: { width: '210mm', height: '297mm' },
  margins: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
  bleed: { top: '3mm', right: '3mm', bottom: '3mm', left: '3mm' }
};

const result = validator.validate(pageConfig);

if (!result.valid) {
  console.error('Validation errors:', result.errors);
}

if (result.warnings.length > 0) {
  console.warn('Warnings:', result.warnings);
}

// Format as human-readable report
const report = PageRuleValidator.formatReport(result);
console.log(report);
```

### Validation Features

- ✅ Page size validation (standard formats and custom sizes)
- ✅ Margin validation (minimum requirements, symmetry checks)
- ✅ Bleed validation (standard sizes, print service requirements)
- ✅ Print service compliance (Amazon KDP, Etsy, Lulu)
- ✅ Unit validation (mm, cm, in, pt, pc, px)
- ✅ Helpful error messages with suggestions

---

## Templates

Ready-to-use CSS templates for common workbook layouts.

### Using Templates

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="node_modules/pagedjs/templates/workbook-templates.css">
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    <h1 class="cover-title">My Workbook</h1>
    <p class="cover-subtitle">Comprehensive Guide</p>
  </div>

  <!-- Chapter -->
  <section class="chapter">
    <h1 class="chapter-title">Chapter 1</h1>

    <!-- Worksheet -->
    <div class="worksheet">
      <h3 class="worksheet-title">Exercise 1.1</h3>
      <p class="worksheet-instructions">Complete the following problems.</p>
      <!-- Content -->
    </div>

    <!-- Answer Key -->
    <div class="answer-key">
      <h4 class="answer-key-title">Answers</h4>
      <!-- Answers -->
    </div>
  </section>
</body>
</html>
```

### Available Components

- `.cover-page` - Full-page cover layout
- `.chapter` - Chapter container with page breaks
- `.worksheet` - Exercise/worksheet box
- `.answer-key` - Answer key box
- `.callout` - Note/callout box (with `.info`, `.success`, `.error` variants)
- `.infographic` - Infographic container
- `.code-block` - Code/formula block
- `.checklist` - Checkbox-style list

### Customization

Override CSS variables to customize the design:

```css
:root {
  --color-primary: #2563eb;
  --font-size-body: 12pt;
  --spacing-lg: 2em;
}
```

---

## Configuration Schema

JSON Schema for validating PagedConfig objects.

### Using the Schema

```javascript
import Ajv from 'ajv';
import configSchema from 'pagedjs/schemas/config.schema.json';

const ajv = new Ajv();
const validate = ajv.compile(configSchema);

const config = {
  auto: true,
  settings: {
    maxPages: 100,
    handlers: {
      footnotes: true
    }
  }
};

const valid = validate(config);
if (!valid) {
  console.error('Configuration errors:', validate.errors);
}
```

---

## Event System

Paged.js uses an event-driven architecture. All core classes emit events that you can listen to.

### Previewer Events

```javascript
const previewer = new Previewer();

// Page created
previewer.on('page', (page) => {
  console.log('Page:', page.number, page.position);
});

// Rendering started
previewer.on('rendering', (chunker) => {
  console.log('Rendering started');
});

// Rendering completed
previewer.on('rendered', (flow) => {
  console.log('Pages:', flow.pages.length);
  console.log('Performance:', flow.performance, 'ms');
});

// Page size determined
previewer.on('size', (size) => {
  console.log('Size:', size.width, 'x', size.height);
});

// @page rules processed
previewer.on('atpages', (pages) => {
  console.log('@page rules:', pages);
});
```

---

## Hooks

Hooks provide fine-grained control over the rendering pipeline.

### Previewer Hooks

```javascript
const previewer = new Previewer();

// Before preview starts
previewer.hooks.beforePreview.register(async (content, renderTo) => {
  console.log('Starting preview...');
  // Load fonts, prepare content, etc.
  await loadFonts();
});

// After preview completes
previewer.hooks.afterPreview.register(async (pages) => {
  console.log(`Finished rendering ${pages.length} pages`);
  // Generate TOC, add watermarks, etc.
});

await previewer.preview();
```

### Handler Hooks

See the [Handler](#handler) section for a complete list of chunker and polisher hooks.

---

## Best Practices

### For AI Code Generation

1. **Use TypeScript definitions** for accurate type inference
2. **Reference JSDoc comments** for understanding method behavior
3. **Use design tokens** for programmatic layout generation
4. **Validate configurations** before rendering
5. **Use templates** as starting points for custom layouts

### For Print-Ready Output

1. **Always validate page configurations** against target print service
2. **Use standard page sizes** when possible
3. **Include bleed** for professional printing (3mm standard)
4. **Set appropriate margins** (minimum 10mm recommended)
5. **Test with actual content** before finalizing design

### Performance Tips

1. **Limit page count** during development (`maxPages` option)
2. **Disable unused handlers** to reduce processing time
3. **Use hooks judiciously** - avoid heavy processing in frequently called hooks
4. **Profile rendering time** using the `performance` property in flow results

---

## Examples

### Generate a Workbook Programmatically

```javascript
import { Previewer } from 'pagedjs';
import { DesignSystemFactory } from 'pagedjs/design-system/design-tokens';
import { PageRuleValidator } from 'pagedjs/validation/page-rule-validator';

// 1. Create design system
const designSystem = DesignSystemFactory.create({
  pageSize: 'A4',
  printService: 'amazon-kdp',
  tokens: {
    typography: {
      body: '11pt',
      h1: '20pt'
    },
    colors: {
      primary: '#2563eb'
    }
  }
});

// 2. Validate configuration
const validator = new PageRuleValidator({
  strict: true,
  printService: 'amazon-kdp'
});

const validation = validator.validate(designSystem.pageLayout);
if (!validation.valid) {
  console.error('Configuration errors:', validation.errors);
  process.exit(1);
}

// 3. Generate CSS
const css = DesignSystemFactory.toCSS(designSystem);

// 4. Create previewer with custom handler
class CustomPageNumbers extends Handler {
  afterPageLayout(page) {
    // Add custom page number formatting
    const pageNumber = page.element.querySelector('.pagedjs_margin-bottom-center');
    if (pageNumber) {
      pageNumber.textContent = `Page ${page.number} of ${this.total}`;
    }
  }
}

Previewer.registerHandlers(CustomPageNumbers);

// 5. Render
const previewer = new Previewer({
  handlers: {
    footnotes: true,
    runningHeaders: true
  }
});

previewer.on('rendered', async (flow) => {
  console.log(`✓ Rendered ${flow.pages.length} pages in ${flow.performance}ms`);
  // Export to PDF using browser print or headless Chrome
});

await previewer.preview();
```

---

## Migration Guide

### From Previous Versions

If you're upgrading from an earlier version of Paged.js, here are the key changes:

1. **TypeScript Support**: Type definitions are now included - enable in your tsconfig.json
2. **New Modules**: Design system and validation modules are opt-in - import only what you need
3. **Templates**: New template library available in `templates/` directory
4. **Package Exports**: Use named imports for better tree-shaking

```javascript
// Old
import Paged from 'pagedjs';

// New (with tree-shaking)
import { Previewer, Handler } from 'pagedjs';
import { DesignSystemFactory } from 'pagedjs/design-system/design-tokens';
import { PageRuleValidator } from 'pagedjs/validation/page-rule-validator';
```

---

## Support

For issues, questions, or contributions:

- **Documentation**: https://pagedmedia.org
- **Repository**: https://gitlab.coko.foundation/pagedjs/pagedjs
- **Issues**: https://gitlab.coko.foundation/pagedjs/pagedjs/issues

---

## License

MIT License - see LICENSE file for details
