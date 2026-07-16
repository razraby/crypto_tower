import React from 'react';
import { Coins, Layers, Zap } from 'lucide-react';

interface HeaderProps {
  satoshi: number;
  towerHeight: number;
  completedCount: number;
  totalCount: number;
}

export default function Header({ satoshi, towerHeight, completedCount, totalCount }: HeaderProps) {
  const formatSatoshi = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <header className="h-16 border-b border-gray-800 bg-[#111112] px-6 flex items-center justify-between shadow-2xl z-20 shrink-0">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-lg flex items-center justify-center font-bold text-black text-xl shadow-lg shadow-orange-500/20 select-none">
          ₿
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-widest text-white uppercase font-sans">Башня Crypto</h1>
          <p className="text-[10px] text-gray-500 font-mono uppercase tracking-tighter">v1.1.0-alpha • КВЕСТ-СИМУЛЯТОР</p>
        </div>
      </div>

      <div className="flex gap-4 md:gap-8 overflow-x-auto py-1">
        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-center gap-1.5">
            <Coins size={12} className="text-orange-400" />
            <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Баланс Satoshi</span>
          </div>
          <span className="text-base md:text-xl font-mono text-orange-400 font-bold transition-all duration-300">
            {formatSatoshi(satoshi)} <span className="text-xs text-orange-500/80">S</span>
          </span>
        </div>

        <div className="flex flex-col items-end shrink-0 border-l border-gray-800 pl-4 md:pl-8">
          <div className="flex items-center gap-1.5">
            <Layers size={12} className="text-blue-400" />
            <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Высота Башни</span>
          </div>
          <span className="text-base md:text-xl font-mono text-blue-400 font-bold">
            {towerHeight} <span className="text-xs text-blue-500/80">F</span>
          </span>
        </div>

        <div className="flex flex-col items-end shrink-0 border-l border-gray-800 pl-4 md:pl-8">
          <div className="flex items-center gap-1.5">
            <Zap size={12} className="text-emerald-400" />
            <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Задачи</span>
          </div>
          <span className="text-base md:text-xl font-mono text-emerald-400 font-bold">
            {completedCount} / {totalCount}
          </span>
        </div>
      </div>
    </header>
  );
}
