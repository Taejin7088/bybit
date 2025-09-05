import { useEffect, useRef, useState } from 'react';
import type {
  BybitRestResponse,
  BybitWsKlineMsg,
  Kline,
} from '../types/kline.types';
import { sleep } from '../utils/sleep';
import { REST_BASE, WS_URL_MAP } from '../constants/url';

export const CATEGORY = 'spot' as const; // "spot" | "linear" | "inverse" | "option"
export const INTERVAL_MIN = 1 as const; // 분 단위: 1, 3, 5, 15, 60, 240, 'D' 등
export const TARGET_COUNT = 500 as const; // 보관할 캔들 개수(최대)

const INTERVAL_TOKEN = String(INTERVAL_MIN);

export const fetchKlinesBatch = async (
  symbol: string,
  endMs?: number,
  limit = 200
): Promise<Kline[]> => {
  const url =
    `${REST_BASE}/v5/market/kline` +
    `?category=${CATEGORY}` +
    `&symbol=${encodeURIComponent(symbol)}` +
    `&interval=${INTERVAL_TOKEN}` +
    `&limit=${limit}` +
    (endMs ? `&end=${endMs}` : '');

  const res = await fetch(url);
  const json = (await res.json()) as BybitRestResponse;
  const list = json?.result?.list ?? [];

  const rows: Kline[] = list
    .map((a) => ({
      start: Number(a[0]),
      open: String(a[1]),
      high: String(a[2]),
      low: String(a[3]),
      close: String(a[4]),
      volume: String(a[5]),
      turnover: String(a[6]),
    }))
    .sort((a, b) => a.start - b.start);

  return rows;
};

export const useBybitKlines = (symbol: string): Kline[] => {
  const [klines, setKlines] = useState<Kline[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const seedingRef = useRef<boolean>(false);

  // ① 초기 시드: REST로 최대 TARGET_COUNT개(200씩 페이징) 수집
  useEffect(() => {
    let aborted = false;
    seedingRef.current = true;

    (async () => {
      try {
        const buf: Kline[] = [];
        let cursorEnd = Date.now();

        while (!aborted && buf.length < TARGET_COUNT) {
          const remain = TARGET_COUNT - buf.length;
          const batch = await fetchKlinesBatch(
            symbol,
            cursorEnd,
            Math.min(200, remain)
          );
          if (batch.length === 0) break;

          buf.unshift(...batch);
          cursorEnd = batch[0].start - 1;

          await sleep(80);
        }

        const trimmed = buf
          .sort((a, b) => a.start - b.start)
          .slice(-TARGET_COUNT);
        if (!aborted) setKlines(trimmed);
      } catch (e) {
        console.error('Seed fetch error:', e);
      } finally {
        seedingRef.current = false;
      }
    })();

    return () => {
      aborted = true;
    };
  }, [symbol]);

  // ② 실시간: WebSocket에서 확정봉(confirm: true)만 append
  useEffect(() => {
    const WS_URL = WS_URL_MAP[CATEGORY] ?? (WS_URL_MAP.spot as string);
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      const sub = {
        op: 'subscribe',
        args: [`kline.${INTERVAL_TOKEN}.${symbol}`],
      };
      ws.send(JSON.stringify(sub));
    };

    ws.onmessage = (evt: MessageEvent) => {
      try {
        const msg = JSON.parse(evt.data as string) as BybitWsKlineMsg;
        if (
          !msg?.topic ||
          msg.topic !== `kline.${INTERVAL_TOKEN}.${symbol}` ||
          !Array.isArray(msg.data) ||
          !msg.data[0]
        ) {
          return;
        }
        const c = msg.data[0];
        if (!c.confirm) return; // 확정봉만 반영

        const nextRow: Kline = {
          start: Number(c.start),
          open: String(c.open),
          high: String(c.high),
          low: String(c.low),
          close: String(c.close),
          volume: String(c.volume),
          turnover: String(c.turnover),
        };

        setKlines((prev) => {
          if (prev.length === 0) return [nextRow];
          const last = prev[prev.length - 1];

          // 같은 봉이면 교체
          if (last.start === nextRow.start) {
            const copy = prev.slice();
            copy[copy.length - 1] = nextRow;
            return copy;
          }
          // 과거 봉이 섞여 들어오면 무시
          if (nextRow.start < last.start) return prev;

          const merged = [...prev, nextRow];
          if (merged.length > TARGET_COUNT) merged.shift();
          return merged;
        });
      } catch (e) {
        console.error('WS parse error:', e);
      }
    };

    ws.onerror = (e) => console.error('WS error:', e);
    ws.onclose = () => {
      /* 필요 시 재연결 로직 추가 */
    };

    return () => {
      try {
        ws.close();
      } catch {
        console.warn('WS close failed');
      }
      wsRef.current = null;
    };
  }, [symbol]);

  return klines; // 오래된 → 최신, 최대 500개
};
