# CEP API Pipeline

Script Node.js que consome as APIs do JSONPlaceholder e ViaCEP para buscar posts, associar autores e enriquecer com dados de endereço (cidade e estado).

## Como rodar

```bash
npm install
npm start
```

### Com parâmetros customizados

```bash
node index.js --top=50 --concurrency=3 --timeoutMs=10000
```

| Parâmetro       | Default | Descrição                                |
| --------------- | ------- | ---------------------------------------- |
| `--top`         | 20      | Quantidade de posts (maior ID)           |
| `--concurrency` | 5       | Máximo de chamadas simultâneas ao ViaCEP |
| `--timeoutMs`   | 5000    | Timeout por requisição HTTP (ms)         |

## Como testar

```bash
npm test
```

## Lint

```bash
npm run lint
```

## Saídas

Após a execução, os arquivos são gerados na pasta `output/`:

- **output/data.json** — Lista dos posts com dados do autor e CEP
- **output/data.csv** — Mesmo conteúdo em formato CSV
- **output/report.json** — Relatório do processamento (contagens, timings, cache hits)

## Decisões técnicas

- **Sem dependências de produção**: O projeto usa apenas `fetch` nativo do Node.js (v18+) e módulos built-in (`fs`, `path`). Isso mantém o projeto leve e sem necessidade de libs externas para HTTP.
- **Parsing de CLI manual**: Os argumentos são parseados diretamente de `process.argv`, sem libs como yargs ou commander, mantendo a simplicidade.
- **Retry com backoff exponencial**: A função `withRetry` detecta erros transitórios (429, 5xx, timeout) e retenta com delays crescentes (1s, 2s, 4s). Erros não transitórios (ex: 404) são propagados imediatamente.
- **Limite de concorrência**: A função `limitConcurrency` controla quantas chamadas ao ViaCEP rodam em paralelo, evitando sobrecarregar a API.
- **Cache em memória**: Um `Map` armazena resultados do ViaCEP durante a execução. Se dois posts são do mesmo autor (mesmo CEP), a API é chamada apenas uma vez.
- **Fallback gracioso**: Se o ViaCEP falhar para um CEP, `city` e `state` ficam como `null` e o pipeline continua normalmente.

## Estrutura do projeto

```
index.js                    → Entrypoint
src/
  config.js                 → Parsing de argumentos CLI
  clients/
    jsonplaceholder.js      → Client para posts e users
    viacep.js               → Client para ViaCEP
  services/
    enrichment.js           → Pipeline principal
  io/
    writeJson.js            → Escrita de JSON
    writeCsv.js             → Escrita de CSV
    writeReport.js          → Escrita do relatório
  utils/
    retry.js                → Retry com backoff
    limitConcurrency.js     → Controle de concorrência
    logger.js               → Logger (info/warn/error)
    cepMap.js               → Mapa userId → CEP
tests/
  topN.test.js              → Teste de seleção top N
  fallback.test.js          → Teste de fallback (city/state null)
  cache.test.js             → Teste de cache de CEP
  retry.test.js             → Teste de retry com backoff
```

## Limitações conhecidas

- O cache de CEP é apenas em memória e não persiste entre execuções.
- O mapa de CEPs por usuário (`userCepMap`) é fixo/mockado, não vem de uma API real.
- O `fetch` nativo requer Node.js 18 ou superior.
- Não há tratamento de encoding para caracteres especiais no CSV além de vírgulas e aspas.
