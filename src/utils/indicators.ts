// src/utils/indicators.ts
import type { Kline } from '@/types/kline.types';
import { buildSeries } from './format';

/* ============================================================================
 * EMA / MACD / RSI
 * ========================================================================== */
export const ema = (
  series: (number | null)[],
  period: number
): (number | null)[] => {
  const out: (number | null)[] = Array(series.length).fill(null);
  const k = 2 / (period + 1);
  let prev: number | null = null;
  let sum = 0,
    count = 0;

  for (let i = 0; i < series.length; i++) {
    const v = series[i];
    if (v == null || !isFinite(v)) {
      out[i] = prev;
      continue;
    }
    if (count < period) {
      sum += v;
      count++;
      if (count === period) {
        prev = sum / period;
        out[i] = prev;
      } else {
        out[i] = null;
      }
    } else {
      prev = v * k + (prev as number) * (1 - k);
      out[i] = prev;
    }
  }
  return out;
};

export const macdSeries = (
  closes: number[],
  fast = 12,
  slow = 26,
  signalP = 9
) => {
  const c: (number | null)[] = closes.map((n) => (isFinite(n) ? n : null));
  const emaFast = ema(c, fast);
  const emaSlow = ema(c, slow);
  const macdLine: (number | null)[] = c.map((_, i) =>
    emaFast[i] != null && emaSlow[i] != null ? emaFast[i]! - emaSlow[i]! : null
  );
  const signal = ema(macdLine, signalP);
  const hist: (number | null)[] = macdLine.map((v, i) =>
    v != null && signal[i] != null ? v - signal[i]! : null
  );
  return { macdLine, signal, hist };
};

export const rsiSeriesWilder = (
  closes: number[],
  period = 14
): (number | null)[] => {
  const out: (number | null)[] = Array(closes.length).fill(null);
  if (closes.length < period + 1) return out;

  let gainSum = 0,
    lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gainSum += d;
    else lossSum -= d;
  }
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    const gain = d > 0 ? d : 0;
    const loss = d < 0 ? -d : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
};

// 최신 RSI만 필요할 때
export const calcLatestRsi = (closes: number[], period = 14): number | null => {
  const s = rsiSeriesWilder(closes, period);
  return s.length ? s[s.length - 1] : null;
};

/* ============================================================================
 * 스윙 포인트 / 공통 유틸
 * ========================================================================== */
export const swingIdx = (arr: (number | null)[], L = 2) => {
  const highs: number[] = [];
  const lows: number[] = [];
  for (let i = L; i < arr.length - L; i++) {
    const v = arr[i];
    if (v == null || !isFinite(v)) continue;
    let isHigh = true,
      isLow = true;
    for (let j = 1; j <= L; j++) {
      const a = arr[i - j],
        b = arr[i + j];
      if (a == null || b == null) {
        isHigh = isLow = false;
        break;
      }
      if (v <= a || v <= b) isHigh = false;
      if (v >= a || v >= b) isLow = false;
    }
    if (isHigh) highs.push(i);
    if (isLow) lows.push(i);
  }
  return { highs, lows };
};

export const percent = (a: number, b: number) =>
  Math.abs(a - b) / ((a + b) / 2);

export const lastTwoWithSep = (
  idxs: number[],
  minSep = 0
): [number, number] | null => {
  if (idxs.length < 2) return null;
  const [i2, i1] = idxs.slice(-2);
  if (i1 - i2 < minSep) return null;
  return [i2, i1];
};

/* ============================================================================
 * 거래량 정규화 (vol / EMA20)
 * ========================================================================== */
export const normalizeVolumeByEma = (
  klines: Kline[],
  period = 20
): number[] => {
  const vol = buildSeries(klines).vol;
  const emaVol = ema(vol, period).map((v) => v ?? 0);
  return vol.map((v, i) => (emaVol[i] ? v / emaVol[i] : 1));
};
