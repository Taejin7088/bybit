import type {
  Bearish,
  Bullish,
  DivergenceResult,
  Kline,
} from '@/types/kline.types';
import {
  lastTwoWithSep,
  macdSeries,
  normalizeVolumeByEma,
  percent,
  rsiSeriesWilder,
  swingIdx,
} from './indicators';
import { buildSeries } from './format';
import { PRESET_1M } from '@/constants/kline.preset';

export type DivOptions = {
  L: number; // 스윙 좌우 폭
  minSep?: number; // 스윙 간 최소 간격 (bars)
  minPriceMovePct?: number; // 최소 가격 변화율 (예: 0.001 = 0.1%)
  minIndiDelta?: number; // 지표 최소 변화 폭
};

/* ============================================================================
 * 1분봉 기본 프리셋 다이버전스
 * ========================================================================== */
export const detectAll1m = (klines: Kline[]) => {
  const L = PRESET_1M.L;

  const rsiDiv = detectRsiDivergenceRobust(klines, {
    L,
    period: PRESET_1M.RSI_PERIOD,
  });
  const macdDiv = detectMacdDivergenceRobust(klines, {
    L,
    fast: PRESET_1M.MACD_FAST,
    slow: PRESET_1M.MACD_SLOW,
    signal: PRESET_1M.MACD_SIGNAL,
  });
  const histDiv = detectHistDivergenceRobust(klines, {
    L,
    fast: PRESET_1M.MACD_FAST,
    slow: PRESET_1M.MACD_SLOW,
    signal: PRESET_1M.MACD_SIGNAL,
  });
  const volDiv = detectVolumeDivergenceRobust(klines, {
    L,
    useNormalized: true,
  }); // 거래량 정규화(vol/EMA20) 권장

  return { rsiDiv, macdDiv, histDiv, volDiv };
};

const detectWithSeries = (
  price: number[],
  indi: (number | null)[],
  {
    L,
    minSep = 3,
    minPriceMovePct = 0.0015,
    minIndiDelta = 0.05,
  }: Required<Pick<DivOptions, 'L'>> & Omit<DivOptions, 'L'>
): DivergenceResult => {
  const pSw = swingIdx(price, L);
  const iSw = swingIdx(indi, L);

  let bearish: Bearish = null;
  const highsP = lastTwoWithSep(pSw.highs, minSep);
  const highsI = lastTwoWithSep(iSw.highs, minSep);
  if (highsP && highsI) {
    const [p2, p1] = highsP,
      [i2, i1] = highsI;
    const pA = price[p2],
      pB = price[p1];
    const iA = indi[i2]!,
      iB = indi[i1]!;
    if (
      pB > pA &&
      iB < iA &&
      percent(pA, pB) >= minPriceMovePct &&
      Math.abs(iA - iB) >= minIndiDelta
    ) {
      bearish = { type: 'bearish', priceIdx: [p2, p1], indiIdx: [i2, i1] };
    }
  }

  let bullish: Bullish = null;
  const lowsP = lastTwoWithSep(pSw.lows, minSep);
  const lowsI = lastTwoWithSep(iSw.lows, minSep);
  if (lowsP && lowsI) {
    const [p2, p1] = lowsP,
      [i2, i1] = lowsI;
    const pA = price[p2],
      pB = price[p1];
    const iA = indi[i2]!,
      iB = indi[i1]!;
    if (
      pB < pA &&
      iB > iA &&
      percent(pA, pB) >= minPriceMovePct &&
      Math.abs(iA - iB) >= minIndiDelta
    ) {
      bullish = { type: 'bullish', priceIdx: [p2, p1], indiIdx: [i2, i1] };
    }
  }

  return { bearish, bullish };
};

export const detectRsiDivergenceRobust = (
  klines: Kline[],
  opts: Partial<DivOptions> & { period?: number } & { L: number } = {
    L: PRESET_1M.L,
  }
): DivergenceResult => {
  const { close } = buildSeries(klines);
  const period = opts.period ?? PRESET_1M.RSI_PERIOD;
  const rsi = rsiSeriesWilder(close, period);
  return detectWithSeries(close, rsi, {
    L: opts.L ?? PRESET_1M.L,
    minSep: opts.minSep ?? PRESET_1M.MIN_SEP,
    minPriceMovePct: opts.minPriceMovePct ?? PRESET_1M.MIN_PRICE_MOVE_PCT,
    minIndiDelta: opts.minIndiDelta ?? 1.0,
  });
};

export const detectMacdDivergenceRobust = (
  klines: Kline[],
  opts: Partial<DivOptions> & {
    fast?: number;
    slow?: number;
    signal?: number;
  } & { L: number } = { L: PRESET_1M.L }
): DivergenceResult => {
  const { close } = buildSeries(klines);
  const fast = opts.fast ?? PRESET_1M.MACD_FAST;
  const slow = opts.slow ?? PRESET_1M.MACD_SLOW;
  const signal = opts.signal ?? PRESET_1M.MACD_SIGNAL;
  const { macdLine } = macdSeries(close, fast, slow, signal);
  return detectWithSeries(close, macdLine, {
    L: opts.L ?? PRESET_1M.L,
    minSep: opts.minSep ?? PRESET_1M.MIN_SEP,
    minPriceMovePct: opts.minPriceMovePct ?? PRESET_1M.MIN_PRICE_MOVE_PCT,
    minIndiDelta: opts.minIndiDelta ?? 0.05,
  });
};

export const detectHistDivergenceRobust = (
  klines: Kline[],
  opts: Partial<DivOptions> & {
    fast?: number;
    slow?: number;
    signal?: number;
  } & { L: number } = { L: PRESET_1M.L }
): DivergenceResult => {
  const { close } = buildSeries(klines);
  const fast = opts.fast ?? PRESET_1M.MACD_FAST;
  const slow = opts.slow ?? PRESET_1M.MACD_SLOW;
  const signal = opts.signal ?? PRESET_1M.MACD_SIGNAL;
  const { hist } = macdSeries(close, fast, slow, signal);
  return detectWithSeries(close, hist, {
    L: opts.L ?? PRESET_1M.L,
    minSep: opts.minSep ?? PRESET_1M.MIN_SEP,
    minPriceMovePct: opts.minPriceMovePct ?? PRESET_1M.MIN_PRICE_MOVE_PCT,
    minIndiDelta: opts.minIndiDelta ?? 0.03,
  });
};

export const detectVolumeDivergenceRobust = (
  klines: Kline[],
  opts: Partial<DivOptions> & {
    useNormalized?: boolean;
    volNorm?: number[];
  } & { L: number } = { L: PRESET_1M.L }
): DivergenceResult => {
  const { close, vol } = buildSeries(klines);
  const series =
    opts.useNormalized === false
      ? vol
      : opts.volNorm ?? normalizeVolumeByEma(klines, 20);
  return detectWithSeries(close, series, {
    L: opts.L ?? PRESET_1M.L,
    minSep: opts.minSep ?? PRESET_1M.MIN_SEP,
    minPriceMovePct: opts.minPriceMovePct ?? PRESET_1M.MIN_PRICE_MOVE_PCT,
    minIndiDelta: opts.minIndiDelta ?? 0.05,
  });
};
