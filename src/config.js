function parseArgs(argv = process.argv.slice(2)) {
  const defaults = {
    top: 20,
    concurrency: 5,
    timeoutMs: 5000,
  };

  for (const arg of argv) {
    if (arg.startsWith('--top=')) {
      defaults.top = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--concurrency=')) {
      defaults.concurrency = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--timeoutMs=')) {
      defaults.timeoutMs = parseInt(arg.split('=')[1], 10);
    }
  }

  return defaults;
}

module.exports = { parseArgs };
