/**
 * Design Token System for Paged.js
 * AI-optimized design system for print-ready workbook generation
 * @module pagedjs/design-tokens
 */

/**
 * Typography scale for consistent text sizing
 */
export interface TypographyScale {
  /**
   * Display text (large headings)
   * @example "24pt"
   */
  display: string;

  /**
   * Heading level 1
   * @example "20pt"
   */
  h1: string;

  /**
   * Heading level 2
   * @example "16pt"
   */
  h2: string;

  /**
   * Heading level 3
   * @example "14pt"
   */
  h3: string;

  /**
   * Heading level 4
   * @example "12pt"
   */
  h4: string;

  /**
   * Body text
   * @example "11pt"
   */
  body: string;

  /**
   * Small text (captions, footnotes)
   * @example "9pt"
   */
  small: string;

  /**
   * Tiny text (legal, copyright)
   * @example "8pt"
   */
  tiny: string;
}

/**
 * Spacing scale for consistent layout
 */
export interface SpacingScale {
  /**
   * Extra small spacing
   * @example "0.25em"
   */
  xs: string;

  /**
   * Small spacing
   * @example "0.5em"
   */
  sm: string;

  /**
   * Medium spacing (default)
   * @example "1em"
   */
  md: string;

  /**
   * Large spacing
   * @example "1.5em"
   */
  lg: string;

  /**
   * Extra large spacing
   * @example "2em"
   */
  xl: string;

  /**
   * Extra extra large spacing
   * @example "3em"
   */
  xxl: string;
}

/**
 * Color palette for print design
 */
export interface ColorPalette {
  /**
   * Primary text color
   * @example "#000000"
   */
  text: string;

  /**
   * Secondary text color (muted)
   * @example "#333333"
   */
  textSecondary: string;

  /**
   * Light text color
   * @example "#666666"
   */
  textLight: string;

  /**
   * Primary brand color
   * @example "#0066cc"
   */
  primary: string;

  /**
   * Secondary brand color
   * @example "#6699cc"
   */
  secondary: string;

  /**
   * Accent color
   * @example "#ff6600"
   */
  accent: string;

  /**
   * Background color
   * @example "#ffffff"
   */
  background: string;

  /**
   * Border color
   * @example "#cccccc"
   */
  border: string;

  /**
   * Success color
   * @example "#00cc66"
   */
  success: string;

  /**
   * Warning color
   * @example "#ffcc00"
   */
  warning: string;

  /**
   * Error color
   * @example "#cc0000"
   */
  error: string;
}

/**
 * Page layout configuration for standard sizes
 */
export interface PageLayoutConfig {
  /**
   * Page size
   */
  size: {
    width: string;
    height: string;
  };

  /**
   * Page margins
   */
  margins: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };

  /**
   * Page padding (inside margins)
   */
  padding?: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };

  /**
   * Bleed areas for print
   */
  bleed?: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };

  /**
   * Gutter for spread pages
   */
  gutter?: string;

  /**
   * Whether to show crop marks
   */
  cropMarks?: boolean;

  /**
   * Whether to show bleed marks
   */
  bleedMarks?: boolean;
}

/**
 * Standard page sizes (ISO and US)
 */
export type StandardPageSize =
  | 'A4'
  | 'A5'
  | 'A6'
  | 'Letter'
  | 'Legal'
  | 'Tabloid'
  | 'Executive';

/**
 * Predefined page layout templates
 */
export interface PageLayoutTemplates {
  /**
   * A4 page (210mm x 297mm) - ISO standard
   */
  A4: PageLayoutConfig;

  /**
   * A5 page (148mm x 210mm) - Half of A4
   */
  A5: PageLayoutConfig;

  /**
   * A6 page (105mm x 148mm) - Quarter of A4
   */
  A6: PageLayoutConfig;

  /**
   * US Letter (8.5in x 11in)
   */
  Letter: PageLayoutConfig;

  /**
   * US Legal (8.5in x 14in)
   */
  Legal: PageLayoutConfig;

  /**
   * US Tabloid (11in x 17in)
   */
  Tabloid: PageLayoutConfig;

  /**
   * US Executive (7.25in x 10.5in)
   */
  Executive: PageLayoutConfig;
}

/**
 * Workbook-specific design tokens
 */
export interface WorkbookDesignTokens {
  /**
   * Typography scale
   */
  typography: TypographyScale;

  /**
   * Spacing scale
   */
  spacing: SpacingScale;

  /**
   * Color palette
   */
  colors: ColorPalette;

  /**
   * Line height values
   */
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
    loose: number;
  };

  /**
   * Font families
   */
  fontFamily: {
    body: string;
    heading: string;
    monospace: string;
  };

  /**
   * Border radius values
   */
  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    full: string;
  };

  /**
   * Border width values
   */
  borderWidth: {
    thin: string;
    medium: string;
    thick: string;
  };

  /**
   * Shadow values (for boxes/callouts)
   */
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };

  /**
   * Z-index scale
   */
  zIndex: {
    base: number;
    overlay: number;
    modal: number;
    tooltip: number;
  };
}

/**
 * Component-specific design tokens for workbooks
 */
export interface WorkbookComponentTokens {
  /**
   * Worksheet/exercise box styling
   */
  worksheet: {
    backgroundColor: string;
    borderColor: string;
    borderWidth: string;
    borderRadius: string;
    padding: string;
  };

  /**
   * Answer key styling
   */
  answerKey: {
    backgroundColor: string;
    borderColor: string;
    fontSize: string;
    padding: string;
  };

  /**
   * Icon container styling
   */
  iconContainer: {
    size: string;
    backgroundColor: string;
    borderRadius: string;
    padding: string;
  };

  /**
   * Infographic container styling
   */
  infographic: {
    backgroundColor: string;
    borderColor: string;
    padding: string;
    marginTop: string;
    marginBottom: string;
  };

  /**
   * Callout/note box styling
   */
  callout: {
    backgroundColor: string;
    borderLeftWidth: string;
    borderLeftColor: string;
    padding: string;
    fontSize: string;
  };

  /**
   * Code block styling
   */
  codeBlock: {
    backgroundColor: string;
    borderColor: string;
    borderRadius: string;
    padding: string;
    fontFamily: string;
    fontSize: string;
  };

  /**
   * Table styling
   */
  table: {
    borderColor: string;
    borderWidth: string;
    headerBackgroundColor: string;
    cellPadding: string;
    stripedRowBackground: string;
  };
}

/**
 * Complete design system for workbook generation
 */
export interface WorkbookDesignSystem {
  /**
   * Core design tokens
   */
  tokens: WorkbookDesignTokens;

  /**
   * Component-specific tokens
   */
  components: WorkbookComponentTokens;

  /**
   * Page layout configuration
   */
  pageLayout: PageLayoutConfig;

  /**
   * Print service specifications (Amazon KDP, Etsy, etc.)
   */
  printSpecs?: PrintServiceSpecs;
}

/**
 * Print service specifications
 */
export interface PrintServiceSpecs {
  /**
   * Service name
   */
  service: 'amazon-kdp' | 'etsy' | 'lulu' | 'blurb' | 'custom';

  /**
   * Required bleed size
   */
  bleed: string;

  /**
   * Required margins
   */
  minMargins: {
    top: string;
    right: string;
    bottom: string;
    left: string;
    gutter?: string;
  };

  /**
   * Color mode requirements
   */
  colorMode: 'cmyk' | 'rgb' | 'grayscale';

  /**
   * DPI requirements
   */
  dpi: number;

  /**
   * PDF version requirements
   */
  pdfVersion?: string;

  /**
   * Additional specifications
   */
  notes?: string;
}

/**
 * Factory function to create design system
 */
export interface DesignSystemFactory {
  /**
   * Create a design system from tokens
   */
  create(options: {
    pageSize: StandardPageSize;
    tokens?: Partial<WorkbookDesignTokens>;
    components?: Partial<WorkbookComponentTokens>;
    printService?: PrintServiceSpecs['service'];
  }): WorkbookDesignSystem;

  /**
   * Export design system as CSS custom properties
   */
  toCSS(system: WorkbookDesignSystem): string;

  /**
   * Export design system as JSON
   */
  toJSON(system: WorkbookDesignSystem): string;

  /**
   * Validate design system against print specifications
   */
  validate(system: WorkbookDesignSystem): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}
