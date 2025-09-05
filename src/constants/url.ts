export const REST_BASE = 'https://api.bybit.com' as const;
export const WS_URL_MAP: Record<string, string> = {
  spot: 'wss://stream.bybit.com/v5/public/spot',
  // 아래 3개는 CATEGORY 바꿀 때만 사용
  linear: 'wss://stream.bybit.com/v5/public/linear',
  inverse: 'wss://stream.bybit.com/v5/public/inverse',
  option: 'wss://stream.bybit.com/v5/public/option',
};
