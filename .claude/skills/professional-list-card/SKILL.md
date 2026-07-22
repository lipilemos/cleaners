---
name: professional-list-card
description: Use ao implementar a tela/lista de profissionais que o usuário vê após o login — cards com foto, serviços, nota em estrelas e busca por cidade/nome. Cobre o modelo de dados, o padrão de busca por geolocalização (com geocoding reverso para cidade) e a divisão de responsabilidades entre o container da lista e o componente de card.
---

# Lista de profissionais próximos (cards)

Esta é a tela inicial pós-login do `client-app` (ver CLAUDE.md seção 1.2 — o `professional-portal` não tem essa tela). Define como estruturar a busca por cidade/nome, o carregamento e a exibição dos cards.

## Divisão de responsabilidades

```
apps/client-app/src/app/core/geolocation/
  reverse-geocoding.service.ts           # HTTP a serviço externo (Nominatim/OSM): resolve cidade a partir de um GeoPoint

apps/client-app/src/app/features/professionals-list/
  professionals-list.component.ts       # container: busca geolocalização, resolve cidade, chama service, gerencia estado de loading/erro
  professionals-list.component.html
  professionals-list.store.ts            # estado da feature (signals): busca (cidade/termo digitado), lista, loading, erro

libs/shared/data-access/
  professionals.service.ts               # HTTP: search(term) — busca por nome ou cidade, reaproveitável pelo professional-portal (ex.: ver o próprio perfil)

libs/shared/ui/professional-card/
  professional-card.component.ts         # apresentacional puro sobre MatCard: recebe um ViewModel, sem HTTP, sem geolocalização
```

- O card (`libs/shared/ui/professional-card`) **nunca** chama serviços nem sabe de geolocalização. Ele recebe um `ProfessionalCardViewModel` já pronto via `input.required()`. Fica em `libs/shared/ui` (não em `apps/client-app`) porque o `professional-portal` também pode precisar renderizar o mesmo cartão (ex.: pré-visualização do próprio perfil).
- Construído sobre `MatCard` (ver skill [angular-material-ui](../angular-material-ui/SKILL.md)) — não recriar o visual de card do zero.
- O container (`features/professionals-list`, só existe em `client-app`) é o único responsável por obter a localização do usuário, chamar o service e montar os ViewModels.

## Modelo de dados

```ts
// libs/shared/models/professional.model.ts
export interface Professional {
  id: string;
  name: string;
  photoUrl: string;
  services: Service[];
  location: GeoPoint;
  reviews: Review[];
}

export interface Service {
  id: string;
  name: string;
}

// ViewModel específico para o card — nunca exponha o Professional inteiro se ele carregar dados sensíveis futuramente
export interface ProfessionalCardViewModel {
  id: string;
  name: string;
  photoUrl: string;
  serviceNames: string[];
  averageRating: number; // computed a partir de reviews, nunca vindo pronto e editável
  reviewCount: number;
  distanceKm: number; // computed no container a partir da geolocalização do usuário
}
```

## Geolocalização e busca

1. Solicitar `navigator.geolocation.getCurrentPosition` no container, encapsulado em um pequeno service (`GeolocationService`) em `apps/client-app/src/app/core/` — nunca chamar a API do browser direto no componente, para facilitar teste e fallback.
2. Sempre tratar os três estados: permissão concedida, permissão negada, indisponível. Em caso de negada/indisponível, oferecer fallback de digitar lat/lng manualmente — nunca deixar a lista travada sem opção.
3. A posição resolvida (automática ou manual) nunca é enviada como lat/lng cru ao backend: `ReverseGeocodingService` (client-side, Nominatim/OpenStreetMap) resolve a cidade a partir do `GeoPoint`, e essa cidade vira o termo inicial de busca.
4. A busca em si (`ProfessionalsService.search(term)`) é sempre feita pelo backend (nome **ou** cidade, ver CLAUDE.md seção 1.3); o frontend não filtra localmente uma lista já carregada. A store dispara uma nova busca tanto na resolução inicial da cidade quanto a cada mudança do termo digitado (com debounce), usando `switchMap` para descartar respostas de buscas obsoletas.
5. `haversineDistanceKm` (`libs/shared/util/geo.ts`) fica disponível para exibir `distanceKm` no card **quando** a API vier a expor coordenadas do profissional; hoje a ordenação/filtragem por proximidade não é mais feita, então esse campo permanece opcional/ausente.

## Estado de carregamento

O container expõe via signals, no mínimo:

```ts
readonly professionals = signal<ProfessionalCardViewModel[]>([]);
readonly loading = signal(true);
readonly error = signal<string | null>(null);
readonly locationDenied = signal(false);
```

No template, tratar explicitamente os quatro estados (loading / erro / localização negada / lista vazia) — nunca deixar a tela em branco sem feedback.

## Performance

- Lista virtualizada (`@angular/cdk/scrolling`) se o número típico de profissionais próximos puder passar de ~30-40 itens.
- `@for` com `track pro.id`.
- Imagens de foto do profissional com `loading="lazy"` e um placeholder/skeleton enquanto carregam.

## Teste

- Teste unitário da função de cálculo de distância com casos conhecidos.
- Teste do container cobrindo: sucesso, erro de geolocalização negada, lista vazia.
- Teste do `professional-card` cobrindo renderização do ViewModel e nenhuma dependência de serviços externos (é puro).
