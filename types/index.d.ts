/**
 * Paged.js Type Definitions
 * AI-friendly type system for print-ready document generation
 * @module pagedjs
 */

import { EventEmitter } from 'event-emitter';

/**
 * Configuration options for PagedConfig
 * Used to configure the global paged.js polyfill behavior
 */
export interface PagedConfig {
  /**
   * Automatically initialize the polyfill on DOMContentLoaded
   * @default true
   */
  auto?: boolean;

  /**
   * Hook called before preview starts
   * Useful for setup, loading fonts, or preparing content
   */
  before?: () => void | Promise<void>;

  /**
   * Hook called after preview completes
   * @param flow - The completed flow object with page information
   */
  after?: (flow: any) => void | Promise<void>;

  /**
   * Custom settings for chunker behavior
   */
  settings?: ChunkerSettings;
}

/**
 * Chunker configuration settings
 */
export interface ChunkerSettings {
  /**
   * Maximum number of pages to render (for testing/debugging)
   */
  maxPages?: number;

  /**
   * Enable/disable specific handlers
   */
  handlers?: {
    [handlerName: string]: boolean;
  };
}

/**
 * Page size configuration
 */
export interface PageSize {
  /**
   * Page width (e.g., "210mm", "8.5in")
   */
  width: string | number;

  /**
   * Page height (e.g., "297mm", "11in")
   */
  height: string | number;

  /**
   * Page orientation
   */
  orientation?: 'portrait' | 'landscape';
}

/**
 * Page margins configuration
 */
export interface PageMargins {
  /**
   * Top margin (e.g., "20mm", "1in")
   */
  top?: string | number;

  /**
   * Right margin
   */
  right?: string | number;

  /**
   * Bottom margin
   */
  bottom?: string | number;

  /**
   * Left margin
   */
  left?: string | number;
}

/**
 * Bleed configuration for print output
 */
export interface PageBleed {
  /**
   * Top bleed area
   */
  top?: string | number;

  /**
   * Right bleed area
   */
  right?: string | number;

  /**
   * Bottom bleed area
   */
  bottom?: string | number;

  /**
   * Left bleed area
   */
  left?: string | number;
}

/**
 * Printer marks configuration
 */
export interface PrinterMarks {
  /**
   * Enable crop marks
   */
  crop?: boolean;

  /**
   * Enable cross marks
   */
  cross?: boolean;
}

/**
 * Page configuration from @page rule
 */
export interface PageDefinition {
  /**
   * Named page identifier (e.g., "chapter", "cover")
   */
  name?: string;

  /**
   * Page pseudo-selector (:first, :left, :right, :blank)
   */
  pseudo?: 'first' | 'left' | 'right' | 'blank' | null;

  /**
   * Page size
   */
  size?: PageSize;

  /**
   * Page margins
   */
  margin?: PageMargins;

  /**
   * Page padding
   */
  padding?: PageMargins;

  /**
   * Bleed areas
   */
  bleed?: PageBleed;

  /**
   * Printer marks
   */
  marks?: PrinterMarks;

  /**
   * Margin box definitions
   */
  marginBoxes?: {
    [boxName: string]: MarginBoxDefinition;
  };
}

/**
 * Margin box definition (e.g., @top-left, @bottom-center)
 */
export interface MarginBoxDefinition {
  /**
   * Content for the margin box
   */
  content?: string;

  /**
   * Custom styles for the margin box
   */
  styles?: {
    [property: string]: string;
  };
}

/**
 * Break token - tracks pagination position for content continuation
 */
export interface BreakToken {
  /**
   * DOM node where the break occurred
   */
  node: Node;

  /**
   * Offset within the node
   */
  offset?: number;

  /**
   * Whether this is an overflow break
   */
  overflow?: boolean;
}

/**
 * Layout result from rendering content to a page
 */
export interface RenderResult {
  /**
   * The fragment that was rendered
   */
  fragment?: DocumentFragment;

  /**
   * Break token if content overflowed
   */
  breakToken?: BreakToken;

  /**
   * Whether overflow occurred
   */
  overflow?: boolean;
}

/**
 * Page object representing a single rendered page
 */
export interface Page {
  /**
   * Unique page identifier
   */
  id: string;

  /**
   * Page number (1-indexed)
   */
  number: number;

  /**
   * Page element in DOM
   */
  element: HTMLElement;

  /**
   * Page wrapper/sheet element
   */
  wrapper: HTMLElement;

  /**
   * Page position (left/right for spreads)
   */
  position: 'left' | 'right' | 'center';

  /**
   * Named page type
   */
  name?: string;

  /**
   * Page size in pixels
   */
  width: number;
  height: number;

  /**
   * Whether this is a blank page
   */
  blank?: boolean;
}

/**
 * Hook function signatures for chunker lifecycle
 */
export interface ChunkerHooks {
  /**
   * Called before content is parsed into DOM
   * @param content - Raw HTML content string
   * @returns Modified content or void
   */
  beforeParsed?: (content: string) => string | void | Promise<string | void>;

  /**
   * Filter hook for DOM manipulation after parsing
   * @param content - Parsed DOM content
   * @returns Modified content or void
   */
  filter?: (content: Element) => Element | void | Promise<Element | void>;

  /**
   * Called after content is parsed
   * @param content - Parsed DOM content
   */
  afterParsed?: (content: Element) => void | Promise<void>;

  /**
   * Called before layout of a page
   * @param page - Page object being laid out
   * @param contents - Content to be laid out
   * @param breakToken - Break token from previous page
   * @param chunker - Chunker instance
   */
  beforePageLayout?: (
    page: Page,
    contents: Element,
    breakToken?: BreakToken,
    chunker?: Chunker
  ) => void | Promise<void>;

  /**
   * Called during page layout
   * Similar parameters to beforePageLayout
   */
  onPageLayout?: (
    page: Page,
    contents: Element,
    breakToken?: BreakToken,
    chunker?: Chunker
  ) => void | Promise<void>;

  /**
   * Called after page layout completes
   */
  afterPageLayout?: (
    page: Page,
    contents: Element,
    breakToken?: BreakToken,
    chunker?: Chunker
  ) => void | Promise<void>;

  /**
   * Called to finalize page before rendering
   * Last chance to modify page content
   * @param fragment - Document fragment with page content
   * @param page - Page object
   * @param breakToken - Break token if content continues
   */
  finalizePage?: (
    fragment: DocumentFragment,
    page: Page,
    breakToken?: BreakToken
  ) => void | Promise<void>;

  /**
   * Called after entire document is rendered
   * @param pages - Array of all rendered pages
   */
  afterRendered?: (pages: Page[]) => void | Promise<void>;
}

/**
 * Hook function signatures for polisher lifecycle
 */
export interface PolisherHooks {
  /**
   * Called when a URL is encountered in CSS
   * @param url - The URL string
   */
  onUrl?: (url: string) => string | void;

  /**
   * Called when @page rule is parsed
   * @param node - CSS AST node for @page rule
   */
  onAtPage?: (node: any) => void;

  /**
   * Called when @media rule is parsed
   */
  onAtMedia?: (node: any) => void;

  /**
   * Called for each CSS rule
   */
  onRule?: (node: any) => void;

  /**
   * Called for each CSS declaration (property: value)
   */
  onDeclaration?: (node: any) => void;

  /**
   * Called for content property values
   */
  onContent?: (node: any) => void;

  /**
   * Called for each selector
   */
  onSelector?: (node: any) => void;

  /**
   * Called for pseudo-selectors (:before, :after, etc.)
   */
  onPseudoSelector?: (node: any) => void;

  /**
   * Called when @import is encountered
   */
  onImport?: (node: any) => void;

  /**
   * Called before CSS tree is parsed
   */
  beforeTreeParse?: (text: string, sheet: any) => void;

  /**
   * Called before walking CSS AST
   */
  beforeTreeWalk?: (ast: any, sheet: any) => void;

  /**
   * Called after walking CSS AST
   */
  afterTreeWalk?: (ast: any, sheet: any) => void;
}

/**
 * Main Previewer class - orchestrates the paging process
 */
export class Previewer extends EventEmitter {
  /**
   * Register custom handlers
   * @param handlers - Handler class or array of handler classes
   */
  static registerHandlers(...handlers: Array<typeof Handler>): void;

  /**
   * Create a new Previewer instance
   * @param options - Configuration options
   */
  constructor(options?: {
    settings?: ChunkerSettings;
  });

  /**
   * Preview content and generate pages
   * @param content - HTML content to paginate (string or DOM element)
   * @param stylesheets - Array of stylesheet URLs or inline styles
   * @param renderTo - Container element to render pages into
   * @returns Promise that resolves when preview is complete
   */
  preview(
    content: string | Element,
    stylesheets?: Array<string | CSSStyleSheet>,
    renderTo?: HTMLElement
  ): Promise<any>;

  /**
   * Event: Emitted when a new page is created
   */
  on(event: 'page', listener: (page: Page) => void): this;

  /**
   * Event: Emitted when rendering starts
   */
  on(event: 'rendering', listener: () => void): this;

  /**
   * Event: Emitted when rendering completes
   */
  on(event: 'rendered', listener: (pages: Page[]) => void): this;

  /**
   * Event: Emitted when page size changes
   */
  on(event: 'size', listener: (size: PageSize) => void): this;
}

/**
 * Chunker class - handles document pagination
 */
export class Chunker {
  /**
   * Create a new Chunker instance
   * @param content - Content to paginate
   * @param renderTo - Container to render into
   * @param settings - Chunker settings
   */
  constructor(
    content: Element,
    renderTo?: HTMLElement,
    settings?: ChunkerSettings
  );

  /**
   * Flow content through pages
   * @param content - Content to paginate
   * @param renderTo - Container element
   * @returns Promise resolving to flow information
   */
  flow(content: Element, renderTo?: HTMLElement): Promise<any>;

  /**
   * Register hook functions
   */
  hooks: ChunkerHooks;
}

/**
 * Polisher class - handles CSS transformations
 */
export class Polisher {
  /**
   * Create a new Polisher instance
   * @param setup - Whether to run setup immediately
   */
  constructor(setup?: boolean);

  /**
   * Setup polisher and load default styles
   */
  setup(): Promise<void>;

  /**
   * Add and process stylesheets
   * @param stylesheets - Array of stylesheet URLs or style elements
   */
  add(...stylesheets: Array<string | HTMLStyleElement>): Promise<void>;

  /**
   * Register hook functions
   */
  hooks: PolisherHooks;
}

/**
 * Base Handler class for extending paged.js functionality
 */
export class Handler {
  /**
   * Create a new handler
   * @param chunker - Chunker instance
   * @param polisher - Polisher instance
   * @param caller - Caller instance (usually Previewer)
   */
  constructor(chunker: Chunker, polisher: Polisher, caller: Previewer);

  /**
   * Chunker hooks are automatically registered if methods match hook names
   * Implement any of the ChunkerHooks methods
   */

  /**
   * Polisher hooks are automatically registered if methods match hook names
   * Implement any of the PolisherHooks methods
   */
}

/**
 * Main export - Paged.js module
 */
declare const Paged: {
  Previewer: typeof Previewer;
  Chunker: typeof Chunker;
  Polisher: typeof Polisher;
  Handler: typeof Handler;
};

export default Paged;

/**
 * Global PagedConfig for polyfill mode
 */
declare global {
  interface Window {
    PagedConfig?: PagedConfig;
    PagedPolyfill?: Previewer;
  }
}
