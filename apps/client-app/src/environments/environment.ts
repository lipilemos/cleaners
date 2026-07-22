export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5001/api',
  // Usado como fallback automático quando a geolocalização do navegador falha em dev local
  // (sem HTTPS/permissão), para não bloquear o teste manual da lista de profissionais.
  // Nunca definido em environment.prod.ts.
  defaultTestLocation: { latitude: -22.9056391, longitude: -47.059564 },
};
