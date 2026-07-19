---
name: angular-signals-state
description: Use ao decidir onde e como armazenar estado em uma feature Angular do CleanersApp (lista de profissionais, agendamento em andamento, sessão do usuário). Cobre o padrão de store baseado em signals por feature, quando usar estado global vs. local, e como combinar com services HTTP baseados em Observable.
---

# Estado com Signals

## Regra geral

- Signals são o mecanismo padrão de estado neste projeto — locais em componentes e, para estado compartilhado dentro de uma feature, em uma classe `*.store.ts` injetável.
- RxJS/`Observable` é reservado para o fluxo assíncrono em si (chamada HTTP, stream de eventos). Assim que o dado chega, ele vira signal (`toSignal`) para consumo pela UI.
- Não crie um `BehaviorSubject` para guardar estado de UI que poderia ser um `signal()` — isso é considerado desvio do padrão do projeto.

## Estado global (mínimo)

Apenas dois casos justificam estado verdadeiramente global, e ambos existem **por app** (`client-app` e `professional-portal` cada um com sua própria instância — não há estado compartilhado em runtime entre os dois, são processos de browser separados):

1. **Sessão do usuário autenticado** (`SessionStore`, em `libs/shared/auth`): dados do usuário logado e papel (`user` vs `professional`). **Nunca guarda o token** — a autenticação é por cookie `httpOnly` (ver CLAUDE.md seção 6.1), inacessível ao JavaScript por design.
2. **Localização atual do usuário** (`core/location/location.store.ts`, específico do `client-app`): última posição conhecida, usada pela lista de profissionais e pelo agendamento.

Tudo o resto é estado de feature.

### `SessionStore`: bootstrap via `/me`, não via token local

Como o token vive só no cookie `httpOnly`, o `SessionStore` nunca infere "estou logado" checando um valor local — ele pergunta à API:

```ts
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly http = inject(HttpClient);

  private readonly _user = signal<AuthenticatedUser | null>(null);
  private readonly _status = signal<'idle' | 'loading' | 'authenticated' | 'anonymous'>('idle');

  readonly user = this._user.asReadonly();
  readonly status = this._status.asReadonly();
  readonly isAuthenticated = computed(() => this._status() === 'authenticated');

  bootstrap(): void {
    this._status.set('loading');
    this.http.get<AuthenticatedUser>('/api/me', { withCredentials: true }).subscribe({
      next: (user) => { this._user.set(user); this._status.set('authenticated'); },
      error: () => { this._user.set(null); this._status.set('anonymous'); },
    });
  }

  logout(): void {
    this.http.post('/api/logout', {}, { withCredentials: true }).subscribe({
      complete: () => { this._user.set(null); this._status.set('anonymous'); },
    });
  }
}
```

- `bootstrap()` roda uma vez na inicialização do app (`APP_INITIALIZER`/`provideAppInitializer`), antes de resolver as rotas protegidas.
- Um `401` do `error.interceptor.ts` (ver skill `angular-service-http-layer`) também deve levar o `SessionStore` para `anonymous`, para o resto da UI reagir (ex.: redirecionar ao login) sem cada feature checar erro manualmente.
- `logout()` chama o endpoint da API que limpa o cookie no servidor — não existe "limpar token local" porque o Angular nunca teve acesso a ele.

## Estado de feature (`*.store.ts`)

Exemplo para a lista de profissionais:

```ts
@Injectable() // providedIn na rota da feature, não em 'root', salvo necessidade real de compartilhar entre features
export class ProfessionalsListStore {
  private readonly professionalsService = inject(ProfessionalsService);
  private readonly location = inject(LocationStore);

  private readonly _professionals = signal<ProfessionalCardViewModel[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly professionals = this._professionals.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly hasResults = computed(() => this._professionals().length > 0);

  load(): void {
    const pos = this.location.currentPosition();
    if (!pos) {
      this._error.set('Localização indisponível');
      return;
    }
    this._loading.set(true);
    this.professionalsService.getNearby(pos.lat, pos.lng, 10).subscribe({
      next: (list) => {
        this._professionals.set(this.toViewModels(list, pos));
        this._loading.set(false);
      },
      error: () => {
        this._error.set('Não foi possível carregar profissionais próximos');
        this._loading.set(false);
      },
    });
  }

  private toViewModels(list: Professional[], pos: GeoPoint): ProfessionalCardViewModel[] {
    // mapeamento + cálculo de distância/rating aqui, não no componente
  }
}
```

Regras:
- Estado exposto sempre como `.asReadonly()` — mutação só acontece através de métodos do store, nunca o componente escreve direto no signal.
- Todo derivado (contagem, flags como `hasResults`, ordenação) é `computed()` dentro do store, não recalculado no componente a cada render.
- O componente injeta o store e só lê signals + chama métodos; não tem lógica de orquestração de dados própria.
- Registre o store nos `providers` da rota da feature (`provideRoute`/`providers` no `Route`), não em `root`, a menos que precise sobreviver entre navegações da mesma feature por design.

## Quando não criar um store

Para um componente simples e isolado (ex.: um formulário de um único campo, um modal de confirmação), estado local com `signal()` direto na classe do componente é suficiente — não crie um `*.store.ts` para cada componente trivial.

## Teste

- Store é testado isoladamente, mockando o service HTTP injetado, verificando as transições de `loading`/`error`/`professionals` para os cenários de sucesso e falha.
- Componentes que consomem o store são testados fornecendo um store real com um service mockado (não recriar a lógica do store no teste do componente).
