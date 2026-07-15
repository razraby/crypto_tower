import React from 'react';
import { Upgrade } from '../types';
import { Cpu, Server, Shield, Radio, Sparkles } from 'lucide-react';

interface ShopPanelProps {
  upgrades: Upgrade[];
  satoshi: number;
  onBuyUpgrade: (id: string) => void;
  passiveCPS: number;
  className?: string;
}

export default function ShopPanel({ upgrades, satoshi, onBuyUpgrade, passiveCPS, className = '' }: ShopPanelProps) {
  const formatNum = (val: number) => {
    return new Intl.NumberFormat('en-US').format(val);
  };

  return (
    <div className={`w-full h-full p-5 flex flex-col gap-4 overflow-y-auto bg-[#0F0F10] ${className}`}>
      <div className="bg-[#111112] p-3 border border-gray-800/80 rounded-xl flex items-center justify-between shadow-sm">
        <div>
          <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">
            Инфраструктура Башни
          </h2>
          <p className="text-xs text-gray-400">Пассивный доход сети</p>
        </div>
        <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-900/30">
          +{formatNum(passiveCPS)} S/сек
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        {upgrades.map((upgrade) => {
          const canAfford = satoshi >= upgrade.cost;
          const iconColor = 
            upgrade.id === 'up_asic' ? 'text-orange-400' :
            upgrade.id === 'up_node' ? 'text-blue-400' :
            upgrade.id === 'up_quantum' ? 'text-emerald-400' :
            'text-purple-400';

          return (
            <button
              key={upgrade.id}
              id={`shop-item-${upgrade.id}`}
              onClick={() => onBuyUpgrade(upgrade.id)}
              disabled={!canAfford}
              className={`text-left border rounded-xl p-3 flex flex-col gap-1.5 transition-all duration-200 group relative overflow-hidden ${
                canAfford
                  ? 'bg-[#161618] border-gray-800 hover:border-orange-500/50 cursor-pointer hover:shadow-lg hover:shadow-orange-950/5'
                  : 'bg-[#111112]/40 border-gray-900/80 cursor-not-allowed opacity-60'
              }`}
            >
              {/* Card visual background elements */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full pointer-events-none"></div>

              {/* Title & Cost info */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg bg-black/40 border border-gray-800 ${iconColor}`}>
                    {upgrade.icon === 'cpu' && <Cpu size={14} />}
                    {upgrade.icon === 'server' && <Server size={14} />}
                    {upgrade.icon === 'shield' && <Shield size={14} />}
                    {upgrade.icon === 'radio' && <Radio size={14} />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                      {upgrade.name}
                    </span>
                    <span className="text-[9px] font-mono text-gray-500 block">
                      Куплено: {upgrade.count}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-mono font-bold ${canAfford ? 'text-orange-400' : 'text-gray-500'}`}>
                    {formatNum(upgrade.cost)} S
                  </span>
                  <span className="text-[8px] font-mono text-emerald-500/80 block uppercase tracking-tighter leading-none mt-0.5">
                    +{upgrade.cps} S/с
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-[10px] text-gray-400 leading-normal pl-0.5">
                {upgrade.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Progress Experience Tracker */}
      <div className="mt-auto bg-[#0A0A0B] p-3 border border-gray-800 rounded-lg flex flex-col gap-2">
        <div className="flex justify-between text-[9px] uppercase font-bold tracking-wider font-mono">
          <span className="text-gray-500">Сила Синхронизации</span>
          <span className="text-orange-400">Уровень {passiveCPS > 500 ? 'Expert' : passiveCPS > 100 ? 'Master' : 'Novice'}</span>
        </div>
        <div className="w-full bg-gray-900 h-1 rounded-full overflow-hidden">
          <div 
            className="bg-orange-500 h-full transition-all duration-500" 
            style={{ width: `${Math.min(100, Math.max(15, (passiveCPS / 1500) * 100))}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
