const logger = require('../utils/logger');

const BASE_URL = 'https://jsonplaceholder.typicode.com';

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      const err = new Error(`HTTP ${response.status} em ${url}`);
      err.status = response.status;
      throw err;
    }

    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchPosts(timeoutMs) {
  logger.info('Buscando posts...');
  return fetchWithTimeout(`${BASE_URL}/posts`, timeoutMs);
}

async function fetchUsers(timeoutMs) {
  logger.info('Buscando usuários...');
  return fetchWithTimeout(`${BASE_URL}/users`, timeoutMs);
}

module.exports = { fetchPosts, fetchUsers };
