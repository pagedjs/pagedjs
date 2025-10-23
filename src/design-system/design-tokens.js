/**
 * Design Token System for Paged.js
 * Provides a comprehensive design system for print-ready workbook generation
 * @module pagedjs/design-system
 */

/**
 * Default typography scale
 * @type {import('../../types/design-tokens').TypographyScale}
 */
export const defaultTypography = {
	display: '24pt',
	h1: '20pt',
	h2: '16pt',
	h3: '14pt',
	h4: '12pt',
	body: '11pt',
	small: '9pt',
	tiny: '8pt',
};

/**
 * Default spacing scale
 * @type {import('../../types/design-tokens').SpacingScale}
 */
export const defaultSpacing = {
	xs: '0.25em',
	sm: '0.5em',
	md: '1em',
	lg: '1.5em',
	xl: '2em',
	xxl: '3em',
};

/**
 * Default color palette (print-optimized)
 * @type {import('../../types/design-tokens').ColorPalette}
 */
export const defaultColors = {
	text: '#000000',
	textSecondary: '#333333',
	textLight: '#666666',
	primary: '#0066cc',
	secondary: '#6699cc',
	accent: '#ff6600',
	background: '#ffffff',
	border: '#cccccc',
	success: '#00cc66',
	warning: '#ffcc00',
	error: '#cc0000',
};

/**
 * Standard page layout templates
 * @type {import('../../types/design-tokens').PageLayoutTemplates}
 */
export const pageLayoutTemplates = {
	A4: {
		size: { width: '210mm', height: '297mm' },
		margins: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
		bleed: { top: '3mm', right: '3mm', bottom: '3mm', left: '3mm' },
		cropMarks: true,
	},
	A5: {
		size: { width: '148mm', height: '210mm' },
		margins: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
		bleed: { top: '3mm', right: '3mm', bottom: '3mm', left: '3mm' },
		cropMarks: true,
	},
	A6: {
		size: { width: '105mm', height: '148mm' },
		margins: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
		bleed: { top: '3mm', right: '3mm', bottom: '3mm', left: '3mm' },
		cropMarks: true,
	},
	Letter: {
		size: { width: '8.5in', height: '11in' },
		margins: { top: '1in', right: '1in', bottom: '1in', left: '1in' },
		bleed: { top: '0.125in', right: '0.125in', bottom: '0.125in', left: '0.125in' },
		cropMarks: true,
	},
	Legal: {
		size: { width: '8.5in', height: '14in' },
		margins: { top: '1in', right: '1in', bottom: '1in', left: '1in' },
		bleed: { top: '0.125in', right: '0.125in', bottom: '0.125in', left: '0.125in' },
		cropMarks: true,
	},
	Tabloid: {
		size: { width: '11in', height: '17in' },
		margins: { top: '0.75in', right: '0.75in', bottom: '0.75in', left: '0.75in' },
		bleed: { top: '0.125in', right: '0.125in', bottom: '0.125in', left: '0.125in' },
		cropMarks: true,
	},
	Executive: {
		size: { width: '7.25in', height: '10.5in' },
		margins: { top: '0.75in', right: '0.75in', bottom: '0.75in', left: '0.75in' },
		bleed: { top: '0.125in', right: '0.125in', bottom: '0.125in', left: '0.125in' },
		cropMarks: true,
	},
};

/**
 * Print service specifications
 */
export const printServiceSpecs = {
	'amazon-kdp': {
		service: 'amazon-kdp',
		bleed: '0.125in',
		minMargins: {
			top: '0.25in',
			right: '0.25in',
			bottom: '0.25in',
			left: '0.25in',
			gutter: '0.375in',
		},
		colorMode: 'rgb',
		dpi: 300,
		pdfVersion: 'PDF/X-3',
		notes: 'Amazon KDP requires specific bleed and margin settings. Gutter increases with page count.',
	},
	'etsy': {
		service: 'etsy',
		bleed: '0.125in',
		minMargins: {
			top: '0.5in',
			right: '0.5in',
			bottom: '0.5in',
			left: '0.5in',
		},
		colorMode: 'rgb',
		dpi: 300,
		notes: 'Etsy digital products should be 300 DPI for print quality.',
	},
	'lulu': {
		service: 'lulu',
		bleed: '0.125in',
		minMargins: {
			top: '0.5in',
			right: '0.5in',
			bottom: '0.5in',
			left: '0.5in',
		},
		colorMode: 'cmyk',
		dpi: 300,
		pdfVersion: 'PDF/X-1a',
		notes: 'Lulu requires CMYK color mode and PDF/X-1a compliance.',
	},
};

/**
 * Default workbook component tokens
 * @type {import('../../types/design-tokens').WorkbookComponentTokens}
 */
export const defaultComponentTokens = {
	worksheet: {
		backgroundColor: '#f9f9f9',
		borderColor: '#cccccc',
		borderWidth: '1pt',
		borderRadius: '4pt',
		padding: '12pt',
	},
	answerKey: {
		backgroundColor: '#e8f4f8',
		borderColor: '#0066cc',
		fontSize: '10pt',
		padding: '8pt',
	},
	iconContainer: {
		size: '24pt',
		backgroundColor: '#ffffff',
		borderRadius: '50%',
		padding: '4pt',
	},
	infographic: {
		backgroundColor: '#ffffff',
		borderColor: '#dddddd',
		padding: '16pt',
		marginTop: '12pt',
		marginBottom: '12pt',
	},
	callout: {
		backgroundColor: '#fffdf0',
		borderLeftWidth: '4pt',
		borderLeftColor: '#ffcc00',
		padding: '12pt',
		fontSize: '10pt',
	},
	codeBlock: {
		backgroundColor: '#f5f5f5',
		borderColor: '#dddddd',
		borderRadius: '2pt',
		padding: '8pt',
		fontFamily: 'monospace',
		fontSize: '9pt',
	},
	table: {
		borderColor: '#cccccc',
		borderWidth: '1pt',
		headerBackgroundColor: '#f0f0f0',
		cellPadding: '6pt',
		stripedRowBackground: '#f9f9f9',
	},
};

/**
 * Design System Factory
 * Creates and manages design systems for workbook generation
 */
export class DesignSystemFactory {
	/**
	 * Create a new design system
	 * @param {Object} options - Configuration options
	 * @param {import('../../types/design-tokens').StandardPageSize} options.pageSize - Standard page size
	 * @param {Partial<import('../../types/design-tokens').WorkbookDesignTokens>} [options.tokens] - Custom tokens
	 * @param {Partial<import('../../types/design-tokens').WorkbookComponentTokens>} [options.components] - Custom component tokens
	 * @param {string} [options.printService] - Print service name
	 * @returns {import('../../types/design-tokens').WorkbookDesignSystem}
	 */
	static create(options) {
		const { pageSize, tokens = {}, components = {}, printService } = options;

		// Get page layout template
		const pageLayout = pageLayoutTemplates[pageSize] || pageLayoutTemplates.A4;

		// Merge custom tokens with defaults
		const designTokens = {
			typography: { ...defaultTypography, ...tokens.typography },
			spacing: { ...defaultSpacing, ...tokens.spacing },
			colors: { ...defaultColors, ...tokens.colors },
			lineHeight: {
				tight: 1.2,
				normal: 1.5,
				relaxed: 1.75,
				loose: 2.0,
				...tokens.lineHeight,
			},
			fontFamily: {
				body: 'Georgia, serif',
				heading: 'Arial, sans-serif',
				monospace: 'Courier New, monospace',
				...tokens.fontFamily,
			},
			borderRadius: {
				none: '0',
				sm: '2pt',
				md: '4pt',
				lg: '8pt',
				full: '9999pt',
				...tokens.borderRadius,
			},
			borderWidth: {
				thin: '0.5pt',
				medium: '1pt',
				thick: '2pt',
				...tokens.borderWidth,
			},
			shadows: {
				sm: '0 1pt 2pt rgba(0, 0, 0, 0.1)',
				md: '0 2pt 4pt rgba(0, 0, 0, 0.1)',
				lg: '0 4pt 8pt rgba(0, 0, 0, 0.1)',
				...tokens.shadows,
			},
			zIndex: {
				base: 0,
				overlay: 100,
				modal: 200,
				tooltip: 300,
				...tokens.zIndex,
			},
		};

		// Merge custom component tokens with defaults
		const componentTokens = {
			worksheet: { ...defaultComponentTokens.worksheet, ...components.worksheet },
			answerKey: { ...defaultComponentTokens.answerKey, ...components.answerKey },
			iconContainer: { ...defaultComponentTokens.iconContainer, ...components.iconContainer },
			infographic: { ...defaultComponentTokens.infographic, ...components.infographic },
			callout: { ...defaultComponentTokens.callout, ...components.callout },
			codeBlock: { ...defaultComponentTokens.codeBlock, ...components.codeBlock },
			table: { ...defaultComponentTokens.table, ...components.table },
		};

		// Get print service specs if specified
		const printSpecs = printService ? printServiceSpecs[printService] : undefined;

		return {
			tokens: designTokens,
			components: componentTokens,
			pageLayout,
			printSpecs,
		};
	}

	/**
	 * Convert design system to CSS custom properties
	 * @param {import('../../types/design-tokens').WorkbookDesignSystem} system - Design system
	 * @returns {string} CSS string with custom properties
	 */
	static toCSS(system) {
		const { tokens, components, pageLayout } = system;
		const lines = [':root {'];

		// Typography tokens
		lines.push('  /* Typography */');
		Object.entries(tokens.typography).forEach(([key, value]) => {
			lines.push(`  --font-size-${key}: ${value};`);
		});

		// Spacing tokens
		lines.push('  /* Spacing */');
		Object.entries(tokens.spacing).forEach(([key, value]) => {
			lines.push(`  --spacing-${key}: ${value};`);
		});

		// Color tokens
		lines.push('  /* Colors */');
		Object.entries(tokens.colors).forEach(([key, value]) => {
			lines.push(`  --color-${key}: ${value};`);
		});

		// Line height tokens
		lines.push('  /* Line Heights */');
		Object.entries(tokens.lineHeight).forEach(([key, value]) => {
			lines.push(`  --line-height-${key}: ${value};`);
		});

		// Font family tokens
		lines.push('  /* Font Families */');
		Object.entries(tokens.fontFamily).forEach(([key, value]) => {
			lines.push(`  --font-family-${key}: ${value};`);
		});

		// Border radius tokens
		lines.push('  /* Border Radius */');
		Object.entries(tokens.borderRadius).forEach(([key, value]) => {
			lines.push(`  --border-radius-${key}: ${value};`);
		});

		// Border width tokens
		lines.push('  /* Border Width */');
		Object.entries(tokens.borderWidth).forEach(([key, value]) => {
			lines.push(`  --border-width-${key}: ${value};`);
		});

		// Shadow tokens
		lines.push('  /* Shadows */');
		Object.entries(tokens.shadows).forEach(([key, value]) => {
			lines.push(`  --shadow-${key}: ${value};`);
		});

		// Page layout tokens
		lines.push('  /* Page Layout */');
		lines.push(`  --page-width: ${pageLayout.size.width};`);
		lines.push(`  --page-height: ${pageLayout.size.height};`);
		lines.push(`  --page-margin-top: ${pageLayout.margins.top};`);
		lines.push(`  --page-margin-right: ${pageLayout.margins.right};`);
		lines.push(`  --page-margin-bottom: ${pageLayout.margins.bottom};`);
		lines.push(`  --page-margin-left: ${pageLayout.margins.left};`);

		if (pageLayout.bleed) {
			lines.push(`  --page-bleed-top: ${pageLayout.bleed.top};`);
			lines.push(`  --page-bleed-right: ${pageLayout.bleed.right};`);
			lines.push(`  --page-bleed-bottom: ${pageLayout.bleed.bottom};`);
			lines.push(`  --page-bleed-left: ${pageLayout.bleed.left};`);
		}

		// Component tokens
		lines.push('  /* Component Tokens */');
		Object.entries(components).forEach(([componentName, componentProps]) => {
			Object.entries(componentProps).forEach(([key, value]) => {
				const kebabKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
				lines.push(`  --${componentName}-${kebabKey}: ${value};`);
			});
		});

		lines.push('}');
		return lines.join('\n');
	}

	/**
	 * Convert design system to JSON
	 * @param {import('../../types/design-tokens').WorkbookDesignSystem} system - Design system
	 * @returns {string} JSON string
	 */
	static toJSON(system) {
		return JSON.stringify(system, null, 2);
	}

	/**
	 * Validate design system against print specifications
	 * @param {import('../../types/design-tokens').WorkbookDesignSystem} system - Design system
	 * @returns {{valid: boolean, errors: string[], warnings: string[]}}
	 */
	static validate(system) {
		const errors = [];
		const warnings = [];

		// Validate page layout
		if (!system.pageLayout || !system.pageLayout.size) {
			errors.push('Page layout size is required');
		}

		if (!system.pageLayout || !system.pageLayout.margins) {
			errors.push('Page margins are required');
		}

		// Validate against print service specs if provided
		if (system.printSpecs) {
			const { printSpecs, pageLayout } = system;

			// Check bleed requirements
			if (printSpecs.bleed && pageLayout.bleed) {
				const requiredBleed = parseFloat(printSpecs.bleed);
				const actualBleed = parseFloat(pageLayout.bleed.top);
				if (actualBleed < requiredBleed) {
					warnings.push(`Bleed size ${actualBleed} may be less than required ${requiredBleed}`);
				}
			}

			// Check margin requirements
			if (printSpecs.minMargins) {
				const checkMargin = (side, required, actual) => {
					const req = parseFloat(required);
					const act = parseFloat(actual);
					if (act < req) {
						errors.push(`${side} margin ${act} is less than required ${req}`);
					}
				};

				checkMargin('Top', printSpecs.minMargins.top, pageLayout.margins.top);
				checkMargin('Right', printSpecs.minMargins.right, pageLayout.margins.right);
				checkMargin('Bottom', printSpecs.minMargins.bottom, pageLayout.margins.bottom);
				checkMargin('Left', printSpecs.minMargins.left, pageLayout.margins.left);
			}

			// Check color mode
			if (printSpecs.colorMode === 'cmyk') {
				warnings.push('Color mode CMYK required - ensure colors are converted before printing');
			}
		}

		// Validate typography
		if (!system.tokens.typography.body) {
			errors.push('Body font size is required');
		}

		// Validate colors
		if (!system.tokens.colors.text) {
			errors.push('Text color is required');
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
		};
	}
}

export default DesignSystemFactory;
