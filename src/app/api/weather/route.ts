// GET /api/weather — météo actuelle à Lomé via open-meteo (cache mémoire 10 min)
import { WEATHER_FALLBACK, weatherFromCode } from '@/lib/format';
import { json } from '@/lib/server-utils';
import type { WeatherInfo } from '@/lib/types';

export const dynamic = 'force-dynamic';

let cache: { at: number; data: WeatherInfo } | null = null;
const CACHE_MS = 10 * 60 * 1000;

export async function GET() {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return json(cache.data);
  }

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=6.1319&longitude=1.2228&current=temperature_2m,weather_code&timezone=Africa/Lome',
      { signal: ctrl.signal, cache: 'no-store' },
    );
    clearTimeout(t);
    if (!res.ok) throw new Error(`open-meteo ${res.status}`);
    const data = (await res.json()) as { current?: { temperature_2m?: number; weather_code?: number } };
    const tempC = Math.round(data.current?.temperature_2m ?? 29);
    const code = data.current?.weather_code ?? 0;
    const info = weatherFromCode(code, tempC);
    cache = { at: Date.now(), data: info };
    return json(info);
  } catch {
    return json(WEATHER_FALLBACK);
  }
}
