import { InjectionToken } from '@angular/core';

// Cada app fornece o próprio valor: client-app -> 'register' (User), professional-portal ->
// 'professional-register' (Professional) — o backend expõe um endpoint de cadastro por tipo de conta
// mesmo com POST /login unificado (ver CLAUDE.md 1.2).
export const REGISTER_PATH = new InjectionToken<string>('REGISTER_PATH');
