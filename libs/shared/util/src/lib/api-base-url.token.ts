import { InjectionToken } from '@angular/core';

// Cada app fornece o próprio valor a partir de src/environments/environment.ts — nunca hardcoded na lib.
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
