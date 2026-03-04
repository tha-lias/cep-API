const path = require('path');
const { fetchPosts, fetchUsers } = require('../clients/jsonplaceholder');
const { fetchCep } = require('../clients/viacep');
const { withRetry } = require('../utils/retry');
const { limitConcurrency } = require('../utils/limitConcurrency');
const userCepMap = require('../utils/cepMap');
const logger = require('../utils/logger');
const { writeJson } = require('../io/writeJson');
const { writeCsv } = require('../io/writeCsv');
const { writeReport } = require('../io/writeReport');

function selectTopN(posts, n) {
  return [...posts].sort((a, b) => b.id - a.id).slice(0, n);
}

function buildUserMap(users) {
  const map = new Map();
  for (const user of users) {
    map.set(user.id, user);
  }
  return map;
}

async function fetchUniqueCeps(posts, config) {
  const cepCache = new Map();
  const stats = { success: 0, failed: 0, cacheHits: 0, retries: 0 };

  const originalRetryWarn = logger.warn;
  const retryCounter = { count: 0 };
  logger.warn = (...args) => {
    const msg = args.join(' ');
    if (msg.includes('Retry')) retryCounter.count++;
    originalRetryWarn(...args);
  };

  const uniqueCeps = [...new Set(
    posts.map((p) => userCepMap[p.userId]).filter(Boolean)
  )];

  const tasks = uniqueCeps.map((cep) => async () => {
    try {
      const result = await withRetry(
        () => fetchCep(cep, config.timeoutMs),
        { maxRetries: 3, baseDelayMs: 1000 }
      );

      if (result) {
        cepCache.set(cep, result);
        stats.success++;
      } else {
        stats.failed++;
      }
    } catch (err) {
      logger.warn(`Falha ao buscar CEP ${cep}: ${err.message}`);
      stats.failed++;
    }
  });

  await limitConcurrency(tasks, config.concurrency);

  stats.retries = retryCounter.count;
  logger.warn = originalRetryWarn;

  return { cepCache, stats };
}

async function enrichWithCep(posts, userMap, config) {
  const { cepCache, stats } = await fetchUniqueCeps(posts, config);

  const results = posts.map((post) => {
    const user = userMap.get(post.userId);
    const cep = userCepMap[post.userId];

    const base = {
      postId: post.id,
      title: post.title,
      authorName: user ? user.name : null,
      authorEmail: user ? user.email : null,
      cep: cep || null,
      city: null,
      state: null,
    };

    if (cep && cepCache.has(cep)) {
      const cached = cepCache.get(cep);
      return { ...base, city: cached.city, state: cached.state };
    }

    return base;
  });

  stats.cacheHits = posts.length - [...new Set(
    posts.map((p) => userCepMap[p.userId]).filter(Boolean)
  )].length;

  return { results, stats };
}

async function runPipeline(config) {
  const totalStart = Date.now();
  logger.info(`Iniciando pipeline — top=${config.top}, concurrency=${config.concurrency}, timeout=${config.timeoutMs}ms`);

  let postsStart = Date.now();
  const posts = await fetchPosts(config.timeoutMs);
  const fetchPostsTime = Date.now() - postsStart;

  let usersStart = Date.now();
  const users = await fetchUsers(config.timeoutMs);
  const fetchUsersTime = Date.now() - usersStart;

  logger.info(`${posts.length} posts e ${users.length} usuários carregados`);

  const topPosts = selectTopN(posts, config.top);
  logger.info(`Top ${topPosts.length} posts selecionados`);

  const userMap = buildUserMap(users);

  const enrichStart = Date.now();
  const { results, stats } = await enrichWithCep(topPosts, userMap, config);
  const enrichCepTime = Date.now() - enrichStart;

  const totalTime = Date.now() - totalStart;

  const report = {
    requestedTopN: config.top,
    processed: results.length,
    viacep: stats,
    timingMs: {
      total: totalTime,
      fetchPosts: fetchPostsTime,
      fetchUsers: fetchUsersTime,
      enrichCep: enrichCepTime,
    },
  };

  const outputDir = path.resolve('output');
  writeJson(results, path.join(outputDir, 'data.json'));
  writeCsv(results, path.join(outputDir, 'data.csv'));
  writeReport(report, path.join(outputDir, 'report.json'));

  logger.info(`Pipeline finalizado em ${totalTime}ms`);
  logger.info(`ViaCEP: ${stats.success} sucesso, ${stats.failed} falhas, ${stats.cacheHits} cache hits`);

  return { results, report };
}

module.exports = { runPipeline, selectTopN, buildUserMap, enrichWithCep };
