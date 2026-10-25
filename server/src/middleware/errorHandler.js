export function errorHandler(err, req, res, next) {
  if (err.code === 'P2002') {
    return res.status(409).json({ error: { code: 'DUPLICATE', message: 'This record already exists' } });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Record not found' } });
  }
  if (err.code === 'P2003') {
    return res.status(400).json({ error: { code: 'INVALID_REFERENCE', message: 'Related record does not exist' } });
  }
  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } });
  }
  if (err.isOperational) {
    return res.status(err.statusCode).json({ error: { code: 'ERROR', message: err.message } });
  }
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
}