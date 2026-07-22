#!/usr/bin/env node
// Gera libs/shared/data-access/src/generated/api-types.ts a partir do OpenAPI/Swagger
// exposto pela API .NET (repo cleaners-api). Nunca editar o arquivo gerado à mão — ver CLAUDE.md secao 6.2.
//
// Uso:
//   CLEANERS_API_OPENAPI_URL=https://localhost:5001/swagger/v1/swagger.json npm run api-types:generate
//
// Enquanto o endpoint /swagger não está disponível (backend em cleaners-api ainda não expõe),
// os services em libs/shared/data-access tipam manualmente contra libs/shared/models como stub
// temporário (ver TASKS.md T07/T11-T14).

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import openapiTS, { astToString } from 'openapi-typescript';

const OPENAPI_URL =
  process.env.CLEANERS_API_OPENAPI_URL ??
  'http://localhost:5001/swagger/v1/swagger.json';

const OUTPUT_PATH = fileURLToPath(
  new URL(
    '../../libs/shared/data-access/src/generated/api-types.ts',
    import.meta.url,
  ),
);

async function main() {
  console.log(`Gerando tipos a partir de ${OPENAPI_URL}...`);

  const ast = await openapiTS(new URL(OPENAPI_URL));
  const contents = astToString(ast);

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(
    OUTPUT_PATH,
    `// Arquivo gerado automaticamente por tools/api-types/generate.mjs — não editar à mão.\n\n${contents}`,
  );

  console.log(`Tipos gerados em ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error('Falha ao gerar tipos do OpenAPI:', error.message);
  console.error(
    'O backend (cleaners-api) precisa expor /swagger com a API rodando localmente ou acessível via CLEANERS_API_OPENAPI_URL.',
  );
  process.exit(1);
});
