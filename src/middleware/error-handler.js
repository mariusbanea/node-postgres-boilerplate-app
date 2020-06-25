const { NODE_ENV } = require('../config')

module.exports = function errorHandler(error, req, res, next) {
  const response = (NODE_ENV === 'production')
    ? { error: 'Server error' }
    : (console.error(error), { error: error.message, details: error })

  res.status(500).json(response)
}