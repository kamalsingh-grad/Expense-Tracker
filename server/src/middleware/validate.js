const { validationResult } = require('express-validator');

/** Collect express-validator errors into a uniform 400 response */
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  res.status(400).json({
    message: 'Validation failed',
    details: errors.array().map((e) => ({ field: e.path ?? e.param, message: e.msg })),
  });
}

/** Escape user input before using it in a regex */
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { handleValidation, escapeRegex };
