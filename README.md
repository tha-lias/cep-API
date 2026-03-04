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

- **Sem dependências de produção** — Usa `fetch` nativo (Node 18+) e módulos built-in (`fs`, `path`).
- **Parsing de CLI manual** — `process.argv` direto, sem libs externas (`yargs`, `commander`), pois são apenas 3 argumentos.
- **Retry com backoff exponencial** — Retenta erros transitórios (429, 5xx, timeout) com delays crescentes (1s, 2s, 4s). Erros como 404 são propagados imediatamente.
- **Limite de concorrência** — Máximo de N chamadas simultâneas ao ViaCEP, evitando sobrecarregar a API.
- **Cache em memória** — `Map` que armazena resultados do ViaCEP por CEP. Mesmo autor em múltiplos posts gera apenas uma chamada.
- **Fallback gracioso** — Se o ViaCEP falhar, `city` e `state` ficam `null` e o pipeline continua.


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
