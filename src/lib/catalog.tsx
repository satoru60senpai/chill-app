'use client';

// ============================================================
// Chill — Provider catalogue + météo (API d'abord, fallback local)
// ============================================================

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CatalogBundle, CollectionItem, Place, WeatherInfo } from './types';
import { SEED_CATALOG } from './seed-data';
import { fetchCatalog, fetchWeather, IS_OFFLINE } from './api';
import { WEATHER_FALLBACK } from './format';

interface CatalogCtxValue {
  catalog: CatalogBundle;
  loading: boolean;
  source: 'api' | 'local';
  getPlace: (id: string) => Place | undefined;
  collectionPlaces: (c: CollectionItem) => Place[];
  weather: WeatherInfo;
  refresh: () => void;
}

const CatalogContext = createContext<CatalogCtxValue>({
  catalog: SEED_CATALOG,
  loading: false,
  source: 'local',
  getPlace: () => undefined,
  collectionPlaces: () => [],
  weather: WEATHER_FALLBACK,
  refresh: () => undefined,
});

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [catalog, setCatalog] = useState<CatalogBundle>(SEED_CATALOG);
  const [loading, setLoading] = useState(!IS_OFFLINE);
  const [source, setSource] = useState<'api' | 'local'>('local');
  const [weather, setWeather] = useState<WeatherInfo>(WEATHER_FALLBACK);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const remote = await fetchCatalog();
      if (!cancelled) {
        if (remote && Array.isArray(remote.places) && remote.places.length > 0) {
          setCatalog(remote);
          setSource('api');
        }
        setLoading(false);
      }
      const w = await fetchWeather();
      if (!cancelled && w) setWeather(w);
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const getPlace = useCallback(
    (id: string) => catalog.places.find((p) => p.id === id),
    [catalog],
  );

  const collectionPlaces = useCallback(
    (c: CollectionItem) => {
      const map = new Map(catalog.places.map((p) => [p.id, p]));
      return c.placeIds.map((id) => map.get(id)).filter((p): p is Place => Boolean(p));
    },
    [catalog],
  );

  const value = useMemo<CatalogCtxValue>(
    () => ({ catalog, loading, source, getPlace, collectionPlaces, weather, refresh }),
    [catalog, loading, source, getPlace, collectionPlaces, weather, refresh],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  return useContext(CatalogContext);
}
