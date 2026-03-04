const logger = require('../utils/logger');

async function fetchCep(cep, timeoutMs) {
  const url = `https://viacep.com.br/ws/${cep}/json/`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      const err = new Error(`HTTP ${response.status} no ViaCEP para ${cep}`);
      err.status = response.status;
      throw err;
    }

    const data = await response.json();

    if (data.erro) {
      logger.warn(`CEP ${cep} não encontrado no ViaCEP`);
      return null;
    }

    return {
      city: data.localidade,
      state: data.uf,
    };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { fetchCep };
