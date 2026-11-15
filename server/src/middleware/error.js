const mongoose = require('mongoose');

/** 404 for unmatched routes */
function notFound(req, res, _next) {
  res.status(404).json({ message: `Not found: ${req.method} ${req.originalUrl}` });
}

/** Central error handler — always JSON, never leaks stack traces in production */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let status = err.status || 500;
  let message = err.message || 'Internal server error';
  let details;

  // Mongoose bad ObjectId / cast errors
  if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid value for "${err.path}"`;
  }
  // Mongoose schema validation
  else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  }
  // Duplicate key
  else if (err.code === 11000) {
    status = 409;
    message = 'Duplicate record';
  }

  if (status >= 500) {
    console.error('✗ Unhandled error:', err);
    if (process.env.NODE_ENV === 'production') message = 'Internal server error';
  }

  res.status(status).json(details ? { message, details } : { message });
}

module.exports = { notFound, errorHandler };
