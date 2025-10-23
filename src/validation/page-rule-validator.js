/**
 * Strict Page Rule Validation System
 *
 * Validates CSS @page rules and page configurations against W3C specifications
 * and print service requirements. Helps ensure generated documents meet
 * professional printing standards.
 *
 * @module pagedjs/validation/page-rule-validator
 */

/**
 * Validation result object
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether the validation passed
 * @property {ValidationError[]} errors - Array of validation errors
 * @property {ValidationWarning[]} warnings - Array of validation warnings
 * @property {ValidationInfo[]} info - Array of informational messages
 */

/**
 * Validation error
 * @typedef {Object} ValidationError
 * @property {string} type - Error type (e.g., 'invalid-size', 'missing-margin')
 * @property {string} message - Human-readable error message
 * @property {string} property - CSS property that caused the error
 * @property {*} value - Invalid value
 * @property {string} [suggestion] - Suggested fix
 */

/**
 * Validation warning
 * @typedef {Object} ValidationWarning
 * @property {string} type - Warning type
 * @property {string} message - Human-readable warning message
 * @property {string} property - CSS property that triggered the warning
 * @property {*} value - Value that triggered the warning
 * @property {string} [suggestion] - Suggested improvement
 */

/**
 * Validation info
 * @typedef {Object} ValidationInfo
 * @property {string} message - Informational message
 * @property {string} [recommendation] - Best practice recommendation
 */

/**
 * Supported CSS units for page dimensions
 */
const VALID_UNITS = ['mm', 'cm', 'in', 'pt', 'pc', 'px'];

/**
 * Standard page sizes with dimensions in mm
 */
const STANDARD_PAGE_SIZES = {
	A4: { width: 210, height: 297, unit: 'mm' },
	A5: { width: 148, height: 210, unit: 'mm' },
	A6: { width: 105, height: 148, unit: 'mm' },
	Letter: { width: 215.9, height: 279.4, unit: 'mm' },
	Legal: { width: 215.9, height: 355.6, unit: 'mm' },
	Tabloid: { width: 279.4, height: 431.8, unit: 'mm' },
	Executive: { width: 184.15, height: 266.7, unit: 'mm' },
	B4: { width: 250, height: 353, unit: 'mm' },
	B5: { width: 176, height: 250, unit: 'mm' },
};

/**
 * Minimum recommended margins for professional printing (in mm)
 */
const MINIMUM_MARGINS = {
	top: 10,
	right: 10,
	bottom: 10,
	left: 10,
};

/**
 * Standard bleed size for professional printing (in mm)
 */
const STANDARD_BLEED = 3;

/**
 * Page Rule Validator
 *
 * Provides comprehensive validation of @page rules and page configurations
 * to ensure compliance with CSS specifications and printing standards.
 */
export class PageRuleValidator {
	/**
	 * Create a new validator instance
	 *
	 * @param {Object} options - Validation options
	 * @param {boolean} [options.strict=true] - Enable strict validation mode
	 * @param {Object} [options.customRules] - Custom validation rules
	 * @param {string} [options.printService] - Target print service (amazon-kdp, etsy, lulu)
	 */
	constructor(options = {}) {
		this.strict = options.strict !== false;
		this.customRules = options.customRules || {};
		this.printService = options.printService;
	}

	/**
	 * Validate a complete page configuration
	 *
	 * @param {Object} pageConfig - Page configuration object
	 * @param {Object} pageConfig.size - Page size configuration
	 * @param {Object} pageConfig.margins - Page margins
	 * @param {Object} [pageConfig.bleed] - Bleed configuration
	 * @param {Object} [pageConfig.marks] - Printer marks configuration
	 * @returns {ValidationResult} Validation result
	 */
	validate(pageConfig) {
		const errors = [];
		const warnings = [];
		const info = [];

		// Validate page size
		if (!pageConfig.size) {
			errors.push({
				type: 'missing-size',
				message: 'Page size is required',
				property: 'size',
				value: undefined,
				suggestion: 'Add a size property with width and height, or use a standard size like "A4"',
			});
		} else {
			const sizeValidation = this.validateSize(pageConfig.size);
			errors.push(...sizeValidation.errors);
			warnings.push(...sizeValidation.warnings);
			info.push(...sizeValidation.info);
		}

		// Validate margins
		if (!pageConfig.margins) {
			warnings.push({
				type: 'missing-margins',
				message: 'Page margins not specified - browser defaults will be used',
				property: 'margins',
				value: undefined,
				suggestion: 'Specify margins explicitly for consistent print output',
			});
		} else {
			const marginValidation = this.validateMargins(pageConfig.margins, pageConfig.size);
			errors.push(...marginValidation.errors);
			warnings.push(...marginValidation.warnings);
			info.push(...marginValidation.info);
		}

		// Validate bleed
		if (pageConfig.bleed) {
			const bleedValidation = this.validateBleed(pageConfig.bleed);
			errors.push(...bleedValidation.errors);
			warnings.push(...bleedValidation.warnings);
			info.push(...bleedValidation.info);
		} else if (this.strict) {
			warnings.push({
				type: 'missing-bleed',
				message: 'No bleed specified - may cause issues with professional printing',
				property: 'bleed',
				value: undefined,
				suggestion: `Add a ${STANDARD_BLEED}mm bleed for professional print output`,
			});
		}

		// Validate against print service requirements
		if (this.printService) {
			const printServiceValidation = this.validatePrintServiceRequirements(pageConfig);
			errors.push(...printServiceValidation.errors);
			warnings.push(...printServiceValidation.warnings);
			info.push(...printServiceValidation.info);
		}

		// Run custom validation rules
		if (this.customRules.validate) {
			const customValidation = this.customRules.validate(pageConfig);
			if (customValidation) {
				errors.push(...(customValidation.errors || []));
				warnings.push(...(customValidation.warnings || []));
				info.push(...(customValidation.info || []));
			}
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
			info,
		};
	}

	/**
	 * Validate page size configuration
	 *
	 * @param {string|Object} size - Page size (e.g., "A4" or {width: "210mm", height: "297mm"})
	 * @returns {ValidationResult} Validation result
	 */
	validateSize(size) {
		const errors = [];
		const warnings = [];
		const info = [];

		// Check if size is a standard format string
		if (typeof size === 'string') {
			const upperSize = size.toUpperCase();
			if (!STANDARD_PAGE_SIZES[upperSize]) {
				errors.push({
					type: 'invalid-size-format',
					message: `Unknown page size format: ${size}`,
					property: 'size',
					value: size,
					suggestion: `Use a standard format: ${Object.keys(STANDARD_PAGE_SIZES).join(', ')}`,
				});
			} else {
				info.push({
					message: `Using standard ${upperSize} page size`,
					recommendation: 'Standard sizes ensure consistent output across printers',
				});
			}
			return { valid: errors.length === 0, errors, warnings, info };
		}

		// Validate object-based size
		if (!size.width || !size.height) {
			errors.push({
				type: 'incomplete-size',
				message: 'Page size must include both width and height',
				property: 'size',
				value: size,
				suggestion: 'Add both width and height properties (e.g., {width: "210mm", height: "297mm"})',
			});
			return { valid: false, errors, warnings, info };
		}

		// Validate width
		const widthValidation = this.validateDimension(size.width, 'width');
		errors.push(...widthValidation.errors);
		warnings.push(...widthValidation.warnings);

		// Validate height
		const heightValidation = this.validateDimension(size.height, 'height');
		errors.push(...heightValidation.errors);
		warnings.push(...heightValidation.warnings);

		// Check for portrait/landscape orientation
		if (errors.length === 0) {
			const width = this.parseDimension(size.width);
			const height = this.parseDimension(size.height);
			if (width && height) {
				const orientation = width > height ? 'landscape' : 'portrait';
				info.push({
					message: `Page orientation: ${orientation}`,
				});
			}
		}

		return { valid: errors.length === 0, errors, warnings, info };
	}

	/**
	 * Validate page margins
	 *
	 * @param {Object} margins - Margin configuration
	 * @param {Object} [pageSize] - Page size for validation context
	 * @returns {ValidationResult} Validation result
	 */
	validateMargins(margins, pageSize) {
		const errors = [];
		const warnings = [];
		const info = [];

		const sides = ['top', 'right', 'bottom', 'left'];

		for (const side of sides) {
			if (!margins[side]) {
				if (this.strict) {
					warnings.push({
						type: 'missing-margin',
						message: `Missing ${side} margin`,
						property: `margins.${side}`,
						value: undefined,
						suggestion: `Specify ${side} margin explicitly`,
					});
				}
				continue;
			}

			// Validate dimension format
			const dimensionValidation = this.validateDimension(margins[side], `margins.${side}`);
			errors.push(...dimensionValidation.errors);
			warnings.push(...dimensionValidation.warnings);

			// Check against minimum recommended margins
			const marginValue = this.parseDimension(margins[side]);
			if (marginValue) {
				const marginMm = this.convertToMm(marginValue.value, marginValue.unit);
				if (marginMm < MINIMUM_MARGINS[side]) {
					warnings.push({
						type: 'small-margin',
						message: `${side} margin (${margins[side]}) is less than recommended minimum (${MINIMUM_MARGINS[side]}mm)`,
						property: `margins.${side}`,
						value: margins[side],
						suggestion: `Consider using at least ${MINIMUM_MARGINS[side]}mm for ${side} margin`,
					});
				}
			}
		}

		// Check for symmetric margins
		if (margins.top === margins.bottom && margins.left === margins.right) {
			info.push({
				message: 'Using symmetric margins',
				recommendation: 'Symmetric margins work well for most documents',
			});
		}

		// Check for gutter margin (left > right for left pages)
		if (margins.left && margins.right) {
			const left = this.parseDimension(margins.left);
			const right = this.parseDimension(margins.right);
			if (left && right) {
				const leftMm = this.convertToMm(left.value, left.unit);
				const rightMm = this.convertToMm(right.value, right.unit);
				if (Math.abs(leftMm - rightMm) > 5) {
					info.push({
						message: 'Asymmetric left/right margins detected',
						recommendation: 'This is common for bound documents (gutter margin)',
					});
				}
			}
		}

		return { valid: errors.length === 0, errors, warnings, info };
	}

	/**
	 * Validate bleed configuration
	 *
	 * @param {Object|string} bleed - Bleed configuration
	 * @returns {ValidationResult} Validation result
	 */
	validateBleed(bleed) {
		const errors = [];
		const warnings = [];
		const info = [];

		// If bleed is a single value (string), validate it
		if (typeof bleed === 'string') {
			const dimensionValidation = this.validateDimension(bleed, 'bleed');
			errors.push(...dimensionValidation.errors);
			warnings.push(...dimensionValidation.warnings);

			const bleedValue = this.parseDimension(bleed);
			if (bleedValue) {
				const bleedMm = this.convertToMm(bleedValue.value, bleedValue.unit);
				if (bleedMm < STANDARD_BLEED) {
					warnings.push({
						type: 'small-bleed',
						message: `Bleed (${bleed}) is less than standard ${STANDARD_BLEED}mm`,
						property: 'bleed',
						value: bleed,
						suggestion: `Use at least ${STANDARD_BLEED}mm bleed for professional printing`,
					});
				} else if (bleedMm === STANDARD_BLEED) {
					info.push({
						message: 'Using standard 3mm bleed',
						recommendation: 'Standard bleed size is appropriate for most print jobs',
					});
				}
			}
			return { valid: errors.length === 0, errors, warnings, info };
		}

		// Validate object-based bleed
		const sides = ['top', 'right', 'bottom', 'left'];
		for (const side of sides) {
			if (bleed[side]) {
				const dimensionValidation = this.validateDimension(bleed[side], `bleed.${side}`);
				errors.push(...dimensionValidation.errors);
				warnings.push(...dimensionValidation.warnings);
			}
		}

		return { valid: errors.length === 0, errors, warnings, info };
	}

	/**
	 * Validate print service-specific requirements
	 *
	 * @param {Object} pageConfig - Page configuration
	 * @returns {ValidationResult} Validation result
	 */
	validatePrintServiceRequirements(pageConfig) {
		const errors = [];
		const warnings = [];
		const info = [];

		const printServiceSpecs = {
			'amazon-kdp': {
				minBleed: { value: 0.125, unit: 'in' },
				minMargins: { top: 0.25, right: 0.25, bottom: 0.25, left: 0.25, unit: 'in' },
				requiresGutter: true,
			},
			'etsy': {
				minBleed: { value: 0.125, unit: 'in' },
				minMargins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5, unit: 'in' },
			},
			'lulu': {
				minBleed: { value: 0.125, unit: 'in' },
				minMargins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5, unit: 'in' },
				colorMode: 'cmyk',
			},
		};

		const specs = printServiceSpecs[this.printService];
		if (!specs) {
			warnings.push({
				type: 'unknown-print-service',
				message: `Unknown print service: ${this.printService}`,
				property: 'printService',
				value: this.printService,
			});
			return { valid: true, errors, warnings, info };
		}

		info.push({
			message: `Validating for ${this.printService} requirements`,
		});

		// Validate bleed requirements
		if (specs.minBleed && pageConfig.bleed) {
			const bleedValue = typeof pageConfig.bleed === 'string'
				? this.parseDimension(pageConfig.bleed)
				: this.parseDimension(pageConfig.bleed.top);

			if (bleedValue) {
				const bleedMm = this.convertToMm(bleedValue.value, bleedValue.unit);
				const requiredMm = this.convertToMm(specs.minBleed.value, specs.minBleed.unit);
				if (bleedMm < requiredMm) {
					errors.push({
						type: 'insufficient-bleed',
						message: `Bleed size insufficient for ${this.printService}`,
						property: 'bleed',
						value: pageConfig.bleed,
						suggestion: `${this.printService} requires at least ${specs.minBleed.value}${specs.minBleed.unit} bleed`,
					});
				}
			}
		}

		// Validate margin requirements
		if (specs.minMargins && pageConfig.margins) {
			const sides = ['top', 'right', 'bottom', 'left'];
			for (const side of sides) {
				if (pageConfig.margins[side]) {
					const marginValue = this.parseDimension(pageConfig.margins[side]);
					if (marginValue) {
						const marginMm = this.convertToMm(marginValue.value, marginValue.unit);
						const requiredMm = this.convertToMm(specs.minMargins[side], specs.minMargins.unit);
						if (marginMm < requiredMm) {
							errors.push({
								type: 'insufficient-margin',
								message: `${side} margin insufficient for ${this.printService}`,
								property: `margins.${side}`,
								value: pageConfig.margins[side],
								suggestion: `${this.printService} requires at least ${specs.minMargins[side]}${specs.minMargins.unit} ${side} margin`,
							});
						}
					}
				}
			}
		}

		// Check color mode requirements
		if (specs.colorMode === 'cmyk') {
			warnings.push({
				type: 'color-mode-requirement',
				message: `${this.printService} requires CMYK color mode`,
				property: 'colorMode',
				value: 'rgb',
				suggestion: 'Ensure colors are converted to CMYK before final PDF generation',
			});
		}

		return { valid: errors.length === 0, errors, warnings, info };
	}

	/**
	 * Validate a single dimension value
	 *
	 * @private
	 * @param {string|number} dimension - Dimension to validate
	 * @param {string} propertyName - Property name for error messages
	 * @returns {ValidationResult} Validation result
	 */
	validateDimension(dimension, propertyName) {
		const errors = [];
		const warnings = [];

		if (typeof dimension === 'number') {
			warnings.push({
				type: 'unitless-dimension',
				message: `Dimension for ${propertyName} has no unit (will be treated as pixels)`,
				property: propertyName,
				value: dimension,
				suggestion: 'Use explicit units (mm, cm, in, pt) for print-ready output',
			});
			return { valid: true, errors, warnings, info: [] };
		}

		if (typeof dimension !== 'string') {
			errors.push({
				type: 'invalid-dimension-type',
				message: `Invalid dimension type for ${propertyName}`,
				property: propertyName,
				value: dimension,
				suggestion: 'Use a string with value and unit (e.g., "210mm")',
			});
			return { valid: false, errors, warnings, info: [] };
		}

		const parsed = this.parseDimension(dimension);
		if (!parsed) {
			errors.push({
				type: 'invalid-dimension-format',
				message: `Invalid dimension format for ${propertyName}: ${dimension}`,
				property: propertyName,
				value: dimension,
				suggestion: 'Use format: number + unit (e.g., "210mm", "8.5in")',
			});
			return { valid: false, errors, warnings, info: [] };
		}

		if (!VALID_UNITS.includes(parsed.unit)) {
			errors.push({
				type: 'invalid-unit',
				message: `Invalid unit for ${propertyName}: ${parsed.unit}`,
				property: propertyName,
				value: dimension,
				suggestion: `Use valid CSS units: ${VALID_UNITS.join(', ')}`,
			});
		}

		if (parsed.value <= 0) {
			errors.push({
				type: 'non-positive-dimension',
				message: `Dimension for ${propertyName} must be positive`,
				property: propertyName,
				value: dimension,
			});
		}

		return { valid: errors.length === 0, errors, warnings, info: [] };
	}

	/**
	 * Parse a dimension string into value and unit
	 *
	 * @private
	 * @param {string} dimension - Dimension string (e.g., "210mm")
	 * @returns {{value: number, unit: string}|null} Parsed dimension or null if invalid
	 */
	parseDimension(dimension) {
		if (typeof dimension !== 'string') {
			return null;
		}

		const match = dimension.match(/^([\d.]+)([a-z]+)$/i);
		if (!match) {
			return null;
		}

		return {
			value: parseFloat(match[1]),
			unit: match[2].toLowerCase(),
		};
	}

	/**
	 * Convert a dimension to millimeters
	 *
	 * @private
	 * @param {number} value - Numeric value
	 * @param {string} unit - Unit of measurement
	 * @returns {number} Value in millimeters
	 */
	convertToMm(value, unit) {
		const conversions = {
			mm: 1,
			cm: 10,
			in: 25.4,
			pt: 0.352778,
			pc: 4.23333,
			px: 0.264583, // Assuming 96 DPI
		};

		return value * (conversions[unit] || 1);
	}

	/**
	 * Format validation results as human-readable report
	 *
	 * @param {ValidationResult} result - Validation result
	 * @returns {string} Formatted report
	 */
	static formatReport(result) {
		const lines = [];

		lines.push('=== Page Configuration Validation Report ===\n');

		if (result.valid) {
			lines.push('✓ Validation passed - no errors found\n');
		} else {
			lines.push(`✗ Validation failed - ${result.errors.length} error(s) found\n`);
		}

		if (result.errors.length > 0) {
			lines.push('ERRORS:');
			result.errors.forEach((error, i) => {
				lines.push(`  ${i + 1}. ${error.message}`);
				if (error.suggestion) {
					lines.push(`     Suggestion: ${error.suggestion}`);
				}
			});
			lines.push('');
		}

		if (result.warnings.length > 0) {
			lines.push('WARNINGS:');
			result.warnings.forEach((warning, i) => {
				lines.push(`  ${i + 1}. ${warning.message}`);
				if (warning.suggestion) {
					lines.push(`     Suggestion: ${warning.suggestion}`);
				}
			});
			lines.push('');
		}

		if (result.info.length > 0) {
			lines.push('INFO:');
			result.info.forEach((info, i) => {
				lines.push(`  ${i + 1}. ${info.message}`);
				if (info.recommendation) {
					lines.push(`     Recommendation: ${info.recommendation}`);
				}
			});
			lines.push('');
		}

		return lines.join('\n');
	}
}

export default PageRuleValidator;
