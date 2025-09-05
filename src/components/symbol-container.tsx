import { rsiSeriesWilder } from '@/utils/indicators';
import { useBybitKlines } from '../hooks/useBybitKlines';
import { Card, CardContent, CardDescription, CardTitle } from './ui/card';
import { buildSeries } from '@/utils/format';
import type { Bearish, Bullish } from '@/types/kline.types';
import { detectAll1m } from '@/utils/divergence';
import { cn } from '@/lib/utils';
import { playAlert } from '@/utils/sound';

const RSI_OVERBOUGHT = 75;
const RSI_OVERSOLD = 25;

const bgColors = {
  overbought: 'bg-red-300',
  oversold: 'bg-blue-300',
  neutral: 'bg-white',
} as const;

const textColors = {
  overbought: 'text-red-700',
  oversold: 'text-blue-700',
  neutral: 'text-black',
} as const;

type RsiLevel = keyof typeof bgColors;
type SymbolContainerType = {
  symbol: string;
  onDelete: (symbol: string) => void;
};
const SymbolContainer = ({ symbol, onDelete }: SymbolContainerType) => {
  playAlert();
  const klines = useBybitKlines(symbol);

  if (klines.length === 0)
    return (
      <Card className='w-[400px] h-[200px] flex justify-center items-center'>
        <CardContent>로딩중...</CardContent>
      </Card>
    );

  const rsiSeries = rsiSeriesWilder(buildSeries(klines).close, 14);
  const latestRsi = rsiSeries[rsiSeries.length - 1];
  const { rsiDiv, macdDiv, histDiv, volDiv } = detectAll1m(klines);

  let rsiLevel: RsiLevel = 'neutral';
  if (latestRsi !== null) {
    if (latestRsi >= RSI_OVERBOUGHT) rsiLevel = 'overbought';
    else if (latestRsi <= RSI_OVERSOLD) rsiLevel = 'oversold';
  }
  const cardBgClass = bgColors[rsiLevel];
  const rsiTextClass = textColors[rsiLevel];

  if (rsiLevel !== 'neutral') {
    playAlert();
  }

  return (
    <Card
      className={cn(
        'w-[400px] h-[200px] flex flex-col items-center justify-evenly relative',
        cardBgClass
      )}
    >
      <p
        className='absolute top-1 right-2 cursor-pointer'
        onClick={() => onDelete(symbol)}
      >
        X
      </p>
      <CardTitle>{symbol}</CardTitle>
      <CardDescription className={cn('text-md', rsiTextClass)}>
        RSI : {latestRsi?.toFixed(2)}
      </CardDescription>
      <CardContent className='flex flex-col gap-1 items-center justify-center'>
        <DivergenceMessage name='RSI' diver={rsiDiv} />
        <DivergenceMessage name='MACD' diver={macdDiv} />
        <DivergenceMessage name='HIS' diver={histDiv} />
        <DivergenceMessage name='거래량' diver={volDiv} />
      </CardContent>
    </Card>
  );
};

export default SymbolContainer;

const DivergenceMessage = ({
  name,
  diver,
}: {
  name: string;
  diver: { bullish: Bullish; bearish: Bearish };
}) => {
  if (diver.bullish) {
    const [iA, iB] = diver.bullish.priceIdx;
    return (
      <p className='text-md text-red-400'>{`${name} : 강세 다이버전스: priceIdx=${iA}->${iB}`}</p>
    );
  }
  if (diver.bearish) {
    const [iA, iB] = diver.bearish.priceIdx;
    return (
      <p className='text-md text-blue-400'>{`${name} : 약세 다이버전스: priceIdx=${iA}->${iB}`}</p>
    );
  }

  return (
    <p className='text-sm text-gray-500'>{`${name} : 다이버전스 신호 없음`}</p>
  );
};
