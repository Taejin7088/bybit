import { REST_BASE } from '@/constants/url';
import { CATEGORY } from '@/hooks/useBybitKlines';
import type { BybitRestResponse } from '@/types/kline.types';

export const fetchSymbolInfo = async (symbol: string) => {
  const url =
    `${REST_BASE}/v5/market/instruments-info` +
    `?category=${CATEGORY}` +
    `&symbol=${encodeURIComponent(symbol)}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch symbol info: ${res.status}`);
  }

  const json = (await res.json()) as BybitRestResponse;
  const symbolInfo = json?.result?.list?.[0];

  return symbolInfo ?? null;
};
