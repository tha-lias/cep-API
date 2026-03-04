const { parseArgs } = require('./src/config');
const { runPipeline } = require('./src/services/enrichment');
const logger = require('./src/utils/logger');

async function main() {
  const config = parseArgs();
  try {
    await runPipeline(config);
  } catch (err) {
    logger.error('Falha fatal no pipeline:', err.message);
    process.exit(1);
  }
}

main();
