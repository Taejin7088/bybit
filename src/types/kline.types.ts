export type Kline = {
  start: number; // ms
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  turnover: string;
};

type BybitKlineRow = [
  string | number, // start ms
  string, // open
  string, // high
  string, // low
  string, // close
  string, // volume
  string // turnover
];

export type BybitRestResponse = {
  retCode: number;
  retMsg: string;
  result?: {
    category: string;
    symbol: string;
    list: BybitKlineRow[];
  };
};

export type BybitWsKlineMsg = {
  topic?: string;
  data?: Array<{
    start: number;
    end: number;
    interval: string;
    open: string;
    close: string;
    high: string;
    low: string;
    volume: string;
    turnover: string;
    confirm: boolean;
    timestamp: number;
  }>;
};

export type Divergence =
  | { type: 'bullish'; priceIdx: [number, number]; indiIdx: [number, number] }
  | { type: 'bearish'; priceIdx: [number, number]; indiIdx: [number, number] };

export type Bullish = Divergence | null;
export type Bearish = Divergence | null;

export type DivergenceResult = {
  bullish: Bullish;
  bearish: Bearish;
};
