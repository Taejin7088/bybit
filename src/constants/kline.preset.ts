/* ============================================================================
 * 다이버전스 기본 설정값 프리셋
 * ========================================================================== */
export const PRESET_1M = {
  RSI_PERIOD: 14,
  MACD_FAST: 24,
  MACD_SLOW: 52,
  MACD_SIGNAL: 9,
  L: 3,
  MIN_SEP: 3,
  MIN_PRICE_MOVE_PCT: 0.0015, // 0.15%
};

export const PRESET_5M = {
  RSI_PERIOD: 14,
  MACD_FAST: 12,
  MACD_SLOW: 26,
  MACD_SIGNAL: 9,
  L: 3,
  MIN_SEP: 3,
  MIN_PRICE_MOVE_PCT: 0.002, // 0.2%
};

export const PRESET_15M = {
  RSI_PERIOD: 14,
  MACD_FAST: 12,
  MACD_SLOW: 26,
  MACD_SIGNAL: 9,
  L: 3,
  MIN_SEP: 3,
  MIN_PRICE_MOVE_PCT: 0.0025, // 0.25%
};

export const PRESET_1H = {
  RSI_PERIOD: 14,
  MACD_FAST: 12,
  MACD_SLOW: 26,
  MACD_SIGNAL: 9,
  L: 2, // 더 긴 타임프레임은 스윙 폭 줄여도 안정적
  MIN_SEP: 2,
  MIN_PRICE_MOVE_PCT: 0.003, // 0.3%
};
