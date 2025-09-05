import { useState } from 'react';
import './App.css';
import SymbolContainer from './components/symbol-container';
import { Input } from './components/ui/input';
import { fetchSymbolInfo } from './services/kline.api';

function App() {
  const [symbolList, setSymbolList] = useState<string[]>([
    'BTCUSDT',
    'ETHUSDT',
  ]);
  const [inputSymbol, setInputSymbol] = useState<string>('');

  const handleSubmitInput = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputSymbol.trim().toUpperCase();
    addSymbol(trimmed);
    setInputSymbol('');
  };

  const addSymbol = async (symbol: string) => {
    if (symbol === '') return;
    const symbolInfo = await fetchSymbolInfo(symbol);
    if (!symbolInfo) {
      alert('존재하지 않는 심볼입니다.');
      return;
    }
    if (!symbolList.includes(symbol)) {
      setSymbolList((prev) => [...prev, symbol]);
    }
  };

  const deleteSymbol = (symbol: string) => {
    setSymbolList((prev) => prev.filter((s) => s !== symbol));
  };

  return (
    <div className='w-full h-full flex flex-col items-center bg-gray-50'>
      {/* 상단 검색 영역 */}
      <header className='w-full sticky top-0 bg-white shadow-sm p-4 flex justify-center z-10'>
        <form
          onSubmit={handleSubmitInput}
          className='w-full flex justify-center'
        >
          <Input
            type='text'
            placeholder='코인코드입력'
            onChange={(e) => {
              setInputSymbol(e.target.value);
            }}
            className='w-1/2'
          />
        </form>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <main className='flex-1 p-6 w-full overflow-y-auto'>
        {/* 그리드 자체는 중앙에 */}
        <div className='grid justify-center grid-cols-[repeat(auto-fill,400px)] gap-4'>
          {symbolList.map((symbol) => (
            <SymbolContainer
              key={symbol}
              symbol={symbol}
              onDelete={(symbol) => deleteSymbol(symbol)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
