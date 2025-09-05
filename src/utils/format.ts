import type { Kline } from '@/types/kline.types';

/* -------------------- 공통 시리즈 빌드 -------------------- */
export const buildSeries = (klines: Kline[]) => {
  const close = klines.map((k) => Number(k.close));
  const high = klines.map((k) => Number(k.high));
  const low = klines.map((k) => Number(k.low));
  const vol = klines.map((k) => Number(k.volume));
  return { close, high, low, vol };
};
