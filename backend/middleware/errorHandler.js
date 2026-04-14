function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Internal server error'
      : err.message || 'An unexpected error occurred';

  res.status(status).json({ success: false, error: message });
}

module.exports = errorHandler;
