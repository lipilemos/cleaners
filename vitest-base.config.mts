import { defineConfig } from 'vitest/config';

// libs/shared/* resolvem via symlinks em node_modules/@cleaners/* apontando direto pro código-fonte
// TS (sem build prévio). Por padrão o runner de teste do @angular/build trata pacotes resolvidos
// via node_modules como dependências externas pré-compiladas e não aplica a transformação de
// decorators do Angular a eles — isso quebra qualquer import de valor (classe decorada) vindo de
// @cleaners/*. `server.deps.inline` força esses pacotes a passar pelo pipeline de transformação do Vite.
export default defineConfig({
  test: {
    server: {
      deps: {
        inline: [/^@cleaners\//],
      },
    },
  },
});
