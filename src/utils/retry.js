const logger = require('./logger');

const TRANSIENT_STATUS_CODES = [429, 500, 502, 503, 504];

function isTransientError(err) {
  if (err.name === 'AbortError' || err.type === 'request-timeout') return true;
  if (err.status && TRANSIENT_STATUS_CODES.includes(err.status)) return true;
  return false;
}

async function withRetry(fn, options = {}) {
  const { maxRetries = 3, baseDelayMs = 1000 } = options;
  let retries = 0;

  while (true) {
    try {
      return await fn();
    } catch (err) {
      if (!isTransientError(err) || retries >= maxRetries) {
        throw err;
      }

      retries++;
      const delay = baseDelayMs * Math.pow(2, retries - 1);
      logger.warn(`Retry ${retries}/${maxRetries} após ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

module.exports = { withRetry, isTransientError };
