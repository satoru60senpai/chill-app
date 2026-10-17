'use client';

// ============================================================
// Chill — Couche API : try serveur (Prisma) puis fallback local.
// NEXT_PUBLIC_OFFLINE=1 (build APK) : jamais d'appel réseau,
// tout vient du catalogue embarqué + localStorage.
// ============================================================

import type { CatalogBundle, OutingPlanDraft, Place, WeatherInfo } from './types';
import { SEED_CATALOG } from './seed-data';

export const IS_OFFLINE = process.env.NEXT_PUBLIC_OFFLINE === '1';

const TIMEOUT_MS = 4000;

async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = TIMEOUT_MS): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, cache: 'no-store' });
  } finally {
    clearTimeout(t);
  }
}

async function safeJson<T>(url: string, init?: RequestInit, timeoutMs?: number): Promise<T | null> {
  if (IS_OFFLINE || typeof window === 'undefined') return null;
  try {
    const res = await fetchWithTimeout(url, init, timeoutMs);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Fire-and-forget : synchronise sans bloquer l'UI */
function fireAndForget(url: string, init: RequestInit) {
  if (IS_OFFLINE || typeof window === 'undefined') return;
  fetchWithTimeout(url, init, 2500).catch(() => undefined);
}

// ---------------- Catalogue ----------------

export async function fetchCatalog(): Promise<CatalogBundle | null> {
  return safeJson<CatalogBundle>('/api/catalog');
}

// ---------------- Météo Lomé ----------------

export async function fetchWeather(): Promise<WeatherInfo | null> {
  return safeJson<WeatherInfo>('/api/weather');
}

// ---------------- Favoris (miroir serveur) ----------------

export function syncFavorite(deviceId: string, placeId: string, fav: boolean) {
  fireAndForget('/api/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, placeId, fav }),
  });
}

// ---------------- Sorties (miroir serveur) ----------------

export function syncPlanSave(deviceId: string, plan: OutingPlanDraft) {
  fireAndForget('/api/plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, plan }),
  });
}

export function syncPlanDelete(deviceId: string, planId: string) {
  fireAndForget(`/api/plans?deviceId=${encodeURIComponent(deviceId)}&id=${encodeURIComponent(planId)}`, {
    method: 'DELETE',
  });
}

export function syncPlanStatus(deviceId: string, planId: string, status: 'planned' | 'done') {
  fireAndForget('/api/plans', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, id: planId, status }),
  });
}

// ---------------- Signalement ----------------

export async function reportIssue(deviceId: string, placeId: string, message: string): Promise<boolean> {
  const res = await safeJson<{ ok: boolean }>('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, placeId, message }),
  });
  return res?.ok === true;
}

// ---------------- Administration ----------------

function adminHeaders(key: string) {
  return { 'Content-Type': 'application/json', 'X-Admin-Key': key };
}

export async function adminSavePlace(key: string, place: Place): Promise<{ ok: boolean; error?: string }> {
  const res = await safeJson<{ ok: boolean; error?: string }>('/api/admin/places', {
    method: 'POST',
    headers: adminHeaders(key),
    body: JSON.stringify(place),
  });
  return res ?? { ok: false, error: 'Serveur injoignable' };
}

export async function adminDeletePlace(key: string, id: string): Promise<boolean> {
  const res = await safeJson<{ ok: boolean }>(`/api/admin/places?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: adminHeaders(key),
  });
  return res?.ok === true;
}

export async function adminSaveEvent(key: string, event: unknown): Promise<{ ok: boolean; error?: string }> {
  const res = await safeJson<{ ok: boolean; error?: string }>('/api/admin/events', {
    method: 'POST',
    headers: adminHeaders(key),
    body: JSON.stringify(event),
  });
  return res ?? { ok: false, error: 'Serveur injoignable' };
}

export async function adminDeleteEvent(key: string, id: string): Promise<boolean> {
  const res = await safeJson<{ ok: boolean }>(`/api/admin/events?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: adminHeaders(key),
  });
  return res?.ok === true;
}

export async function adminSaveCollection(key: string, collection: unknown): Promise<{ ok: boolean; error?: string }> {
  const res = await safeJson<{ ok: boolean; error?: string }>('/api/admin/collections', {
    method: 'POST',
    headers: adminHeaders(key),
    body: JSON.stringify(collection),
  });
  return res ?? { ok: false, error: 'Serveur injoignable' };
}

export async function adminDeleteCollection(key: string, id: string): Promise<boolean> {
  const res = await safeJson<{ ok: boolean }>(`/api/admin/collections?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: adminHeaders(key),
  });
  return res?.ok === true;
}

export async function adminFetchReports(key: string): Promise<unknown[] | null> {
  return safeJson<unknown[]>('/api/reports', { headers: { 'X-Admin-Key': key } });
}

export async function adminDeleteReport(key: string, id: string): Promise<boolean> {
  const res = await safeJson<{ ok: boolean }>(`/api/reports?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: adminHeaders(key),
  });
  return res?.ok === true;
}
