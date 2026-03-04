async function limitConcurrency(tasks, limit) {
  const results = [];
  const executing = new Set();

  for (const [index, task] of tasks.entries()) {
    const promise = task().then((result) => {
      executing.delete(promise);
      return result;
    });

    results[index] = promise;
    executing.add(promise);

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}

module.exports = { limitConcurrency };
