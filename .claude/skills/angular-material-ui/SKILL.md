---
name: angular-material-ui
description: Use ao construir qualquer UI no CleanersApp que precise de um componente de interface (form, dialog, date-picker, tabela, snackbar, card) ou ao configurar o tema visual. Define quando usar Angular Material diretamente, quando envolvê-lo em libs/shared/ui, e a convenção de tema.
---

# Angular Material como base do design system

## Princípio

Angular Material + CDK é a base de todo componente de interface do CleanersApp. Não recriar do zero o que o Material já resolve: `MatDialog`, `MatFormField`, `MatDatepicker`, `MatTable`, `MatSnackBar`, `MatCard`, `MatButton`, `MatIcon`, `MatProgressSpinner`. `@angular/cdk` (`ScrollingModule`, `A11yModule`, `Overlay`) é usado para os casos que a skill `professional-list-card` já cobre (virtualização de lista).

## Quando usar Material direto vs. envolver em `libs/shared/ui`

- **Uso direto no template da feature**: quando o componente Material já expressa o conceito sem necessidade de lógica de domínio (ex.: um `MatFormField` com `MatInput` num formulário de cadastro).
- **Envolver em um componente próprio (`libs/shared/ui`)**: quando o mesmo padrão visual+comportamental se repete em várias telas com dados de domínio específicos (ex.: `professional-card` usa `MatCard` por baixo, mas expõe uma API própria — `input.required<ProfessionalCardViewModel>()` — em vez de forçar cada feature a montar o `MatCard` do zero). Ver skills [professional-list-card](../professional-list-card/SKILL.md) e [star-rating-reviews](../star-rating-reviews/SKILL.md).

Nunca deixe uma segunda implementação divergente do mesmo padrão visual em features diferentes — se o mesmo card/dialog aparece em `client-app` e `professional-portal`, ele pertence a `libs/shared/ui`.

## Tema

- Um único tema Material (`M3`/Material Design 3, ou a versão estável adotada) definido em `libs/shared/ui` e importado pelos dois apps — nunca um tema por app, para manter identidade visual consistente entre `client-app` e `professional-portal`.
- Cores, tipografia e densidade customizadas via a API de theming do Material (`mat.theme`/`define-theme` conforme a versão), não via overrides de CSS espalhados por componentes.
- Modo claro/escuro (se suportado) é resolvido no nível do tema central, não componente a componente.

## Formulários

- `MatFormField` + `MatInput`/`MatSelect`/`MatDatepicker` sempre acoplados a Reactive Forms (`FormGroup`/`FormControl` tipados) — nunca `ngModel`/template-driven.
- Mensagens de erro de validação usam `MatError` dentro do `MatFormField`, com texto centralizado (não strings soltas duplicadas por formulário) quando a mesma validação se repete em mais de um form (ex.: telefone, e-mail).

## Diálogos e feedback

- Confirmações destrutivas (cancelar agendamento, desconectar agenda) usam `MatDialog`, nunca `window.confirm`.
- Feedback transiente (sucesso ao salvar, erro de rede recuperável) usa `MatSnackBar`, disparado por um serviço central (`core/notifications.service.ts` por app) — não instanciado ad-hoc em cada componente.

## Acessibilidade

Material cobre grande parte do WCAG AA por padrão (foco, ARIA, contraste dos componentes padrão), mas isso não é automático quando o tema é customizado — ao alterar cores no tema central, validar contraste. Componentes customizados em `libs/shared/ui` que não usam Material por baixo (raro) seguem manualmente as práticas de `A11yModule`/`cdk-a11y` (`FocusTrap`, `LiveAnnouncer` para atualizações dinâmicas como resultado de busca).

## Teste

Testes de componente que usam Material configuram os módulos necessários (`provideNoopAnimations` ou o harness oficial `@angular/cdk/testing` com `MatXxxHarness`) — preferir os *component harnesses* do Material a selecionar elementos DOM internos do Material diretamente, pois harnesses são estáveis entre versões.
