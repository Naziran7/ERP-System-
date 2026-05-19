const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  // Validation errors
  if (err.type === 'validation') {
    return res.status(400).json({ error: err.message, details: err.details });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token.' });
  }

  // PostgreSQL unique constraint
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Record already exists.' });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced record does not exist.' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error.',
  });
};

module.exports = errorHandler;
