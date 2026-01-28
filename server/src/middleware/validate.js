const { validationResult, body, param, query } = require('express-validator');
const { ValidationError } = require('./errorHandler');

/**
 * Middleware to check validation results
 * Throws ValidationError if validation failed
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    // Log detailed validation errors for debugging
    console.error('[Validation Error] Request path:', req.path);
    console.error('[Validation Error] Errors:', JSON.stringify(formattedErrors, null, 2));
    return next(new ValidationError(formattedErrors));
  }

  next();
};

// Common validation chains

/**
 * UUID parameter validation
 * Note: Uses custom validation to accept seed/test data UUIDs that don't meet strict UUID spec
 * Validates format: 8-4-4-4-12 hex characters
 */
const uuidParam = (paramName = 'id') =>
  param(paramName)
    .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    .withMessage(`${paramName} must be a valid UUID format`);

/**
 * UUID body field validation
 * Note: Uses custom validation to accept seed/test data UUIDs that don't meet strict UUID spec
 * Validates format: 8-4-4-4-12 hex characters
 */
const uuidField = (fieldName, required = true) => {
  // CRITICAL: .optional() must come FIRST to skip validation for falsy values
  let chain = body(fieldName);
  if (!required) {
    chain = chain.optional({ values: 'falsy' });
  }
  return chain
    .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    .withMessage(`${fieldName} must be a valid UUID format`);
};

/**
 * Email validation
 */
const emailField = (fieldName = 'email', required = true) => {
  let chain = body(fieldName);
  if (!required) {
    chain = chain.optional({ values: 'falsy' });
  }
  return chain
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail();
};

/**
 * Password validation - minimum 8 characters
 */
const passwordField = (fieldName = 'password') =>
  body(fieldName)
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters');

/**
 * PIN validation (4-6 digits)
 */
const pinField = (fieldName = 'pin_code') =>
  body(fieldName)
    .isLength({ min: 4, max: 6 })
    .withMessage('PIN must be 4-6 characters')
    .isNumeric()
    .withMessage('PIN must contain only numbers');

/**
 * Decimal/number field validation
 * CRITICAL FIX #4: Add precision validation to prevent data loss
 * Database uses DECIMAL(12,2) - max 2 decimal places
 */
const decimalField = (fieldName, { min, max, required = true, maxDecimals = 2 } = {}) => {
  // CRITICAL: .optional() must come FIRST to skip validation for falsy values
  let chain = body(fieldName);
  if (!required) {
    chain = chain.optional({ values: 'falsy' });
  }

  chain = chain.isFloat().withMessage(`${fieldName} must be a valid number`);

  if (min !== undefined) {
    chain = chain.isFloat({ min }).withMessage(`${fieldName} must be at least ${min}`);
  }

  if (max !== undefined) {
    chain = chain.isFloat({ max }).withMessage(`${fieldName} must be at most ${max}`);
  }

  // Add custom validator for decimal precision
  chain = chain.custom((value) => {
    if (value === null || value === undefined) return true;
    const strValue = String(value);
    const decimalMatch = strValue.match(/\.(\d+)/);
    if (decimalMatch && decimalMatch[1].length > maxDecimals) {
      throw new Error(`${fieldName} cannot have more than ${maxDecimals} decimal places`);
    }
    return true;
  });

  return chain;
};

/**
 * Integer field validation
 */
const integerField = (fieldName, { min, max, required = true } = {}) => {
  // CRITICAL: .optional() must come FIRST to skip validation for falsy values
  let chain = body(fieldName);
  if (!required) {
    chain = chain.optional({ values: 'falsy' });
  }

  chain = chain.isInt().withMessage(`${fieldName} must be an integer`);

  if (min !== undefined) {
    chain = chain.isInt({ min }).withMessage(`${fieldName} must be at least ${min}`);
  }

  if (max !== undefined) {
    chain = chain.isInt({ max }).withMessage(`${fieldName} must be at most ${max}`);
  }

  return chain;
};

/**
 * String field validation
 */
const stringField = (fieldName, { minLength, maxLength, required = true } = {}) => {
  // CRITICAL: .optional() must come FIRST to skip validation for falsy values
  let chain = body(fieldName);
  if (!required) {
    chain = chain.optional({ values: 'falsy' });
  }

  chain = chain.isString().withMessage(`${fieldName} must be a string`).trim();

  if (minLength !== undefined) {
    chain = chain.isLength({ min: minLength }).withMessage(`${fieldName} must be at least ${minLength} characters`);
  }

  if (maxLength !== undefined) {
    chain = chain.isLength({ max: maxLength }).withMessage(`${fieldName} must be at most ${maxLength} characters`);
  }

  return chain;
};

/**
 * Boolean field validation
 */
const booleanField = (fieldName, required = false) => {
  // CRITICAL: .optional() must come FIRST to skip validation for falsy values
  let chain = body(fieldName);
  if (!required) {
    chain = chain.optional({ values: 'falsy' });
  }
  return chain.isBoolean().withMessage(`${fieldName} must be a boolean`);
};

/**
 * Enum field validation
 */
const enumField = (fieldName, validValues, required = true) => {
  // CRITICAL: .optional() must come FIRST to skip validation for falsy values
  let chain = body(fieldName);
  if (!required) {
    chain = chain.optional({ values: 'falsy' });
  }
  return chain.isIn(validValues).withMessage(`${fieldName} must be one of: ${validValues.join(', ')}`);
};

/**
 * Date field validation
 */
const dateField = (fieldName, required = true) => {
  // CRITICAL: .optional() must come FIRST to skip validation for falsy values
  let chain = body(fieldName);
  if (!required) {
    chain = chain.optional({ values: 'falsy' });
  }
  return chain.isISO8601().withMessage(`${fieldName} must be a valid ISO 8601 date`);
};

/**
 * Date only field validation (YYYY-MM-DD)
 */
const dateOnlyField = (fieldName, required = true) => {
  // CRITICAL: .optional() must come FIRST to skip validation for falsy values
  let chain = body(fieldName);
  if (!required) {
    chain = chain.optional({ values: 'falsy' });
  }
  return chain.matches(/^\d{4}-\d{2}-\d{2}$/).withMessage(`${fieldName} must be in YYYY-MM-DD format`);
};

/**
 * Array field validation
 */
const arrayField = (fieldName, { minLength, maxLength, required = true } = {}) => {
  // CRITICAL: .optional() must come FIRST to skip validation for falsy values
  let chain = body(fieldName);
  if (!required) {
    chain = chain.optional({ values: 'falsy' });
  }

  chain = chain.isArray().withMessage(`${fieldName} must be an array`);

  if (minLength !== undefined) {
    chain = chain.isArray({ min: minLength }).withMessage(`${fieldName} must have at least ${minLength} items`);
  }

  if (maxLength !== undefined) {
    chain = chain.isArray({ max: maxLength }).withMessage(`${fieldName} must have at most ${maxLength} items`);
  }

  return chain;
};

/**
 * Pagination query validation
 */
const paginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100'),
  query('sort_by')
    .optional()
    .isString()
    .withMessage('sort_by must be a string'),
  query('sort_order')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('sort_order must be ASC or DESC')
];

/**
 * Cash denomination breakdown validation
 * Validates the structure of opening_denominations or closing_denominations objects
 */
const denominationBreakdown = (fieldName, required = false) => {
  const validators = [
    body(fieldName).optional().isObject().withMessage(`${fieldName} must be an object`),
    body(`${fieldName}.bills_1000`).optional().isInt({ min: 0 }).withMessage(`${fieldName}.bills_1000 must be a non-negative integer`),
    body(`${fieldName}.bills_500`).optional().isInt({ min: 0 }).withMessage(`${fieldName}.bills_500 must be a non-negative integer`),
    body(`${fieldName}.bills_200`).optional().isInt({ min: 0 }).withMessage(`${fieldName}.bills_200 must be a non-negative integer`),
    body(`${fieldName}.bills_100`).optional().isInt({ min: 0 }).withMessage(`${fieldName}.bills_100 must be a non-negative integer`),
    body(`${fieldName}.bills_50`).optional().isInt({ min: 0 }).withMessage(`${fieldName}.bills_50 must be a non-negative integer`),
    body(`${fieldName}.bills_20`).optional().isInt({ min: 0 }).withMessage(`${fieldName}.bills_20 must be a non-negative integer`),
    body(`${fieldName}.bills_10`).optional().isInt({ min: 0 }).withMessage(`${fieldName}.bills_10 must be a non-negative integer`),
    body(`${fieldName}.coins`).optional().isFloat({ min: 0 }).withMessage(`${fieldName}.coins must be a non-negative number`)
  ];
  return validators;
};

module.exports = {
  validate,
  uuidParam,
  uuidField,
  emailField,
  passwordField,
  pinField,
  decimalField,
  integerField,
  stringField,
  booleanField,
  enumField,
  dateField,
  dateOnlyField,
  arrayField,
  paginationQuery,
  denominationBreakdown,
  body,
  param,
  query
};
