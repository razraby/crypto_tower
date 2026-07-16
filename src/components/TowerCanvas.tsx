import React from 'react';
import { Tier, Upgrade } from '../types';
import { ShieldCheck, Trophy, Layers, Radio, Cpu, Snowflake } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TowerCanvasProps {
  tiers: Tier[];
  activeTierId: number;
  onSelectTier: (id: number) => void;
  completedTasks: string[];
  upgrades: Upgrade[];
  className?: string;
}

export default function TowerCanvas({
  tiers,
  activeTierId,
  onSelectTier,
  completedTasks,
  upgrades,
  className = '',
}: TowerCanvasProps) {
  const getTierSolvedCount = (tier: Tier) => {
    return tier.tasks.filter((t) => completedTasks.includes(t.id)).length;
  };

  const totalUpgradesCount = upgrades.reduce((acc, u) => acc + u.count, 0);

  const reversedTiers = [...tiers].reverse();

  return (
    <div className={`flex-1 relative bg-[radial-gradient(circle_at_center,_#1c1c1e_0%,_#0a0a0b_100%)] flex flex-col justify-between p-4 md:p-8 items-center overflow-y-auto select-none min-h-0 ${className}`}>
      {/* Space background grid */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      ></div>

      {/* Floating Network HUD Status */}
      <div className="absolute top-4 right-4 text-right hidden sm:block">
        <h3 className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mb-0.5">
          Статус блокчейна
        </h3>
        <div className="flex items-center gap-2 justify-end">
          <span className="text-[10px] font-mono text-green-400">СЕТЬ СТАБИЛЬНА • 14 ms</span>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        </div>
      </div>

      <div className="absolute top-4 left-4 text-left hidden sm:block">
        <h3 className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mb-0.5">
          Режим Архитектора
        </h3>
        <span className="text-[10px] font-mono text-blue-400 flex items-center gap-1">
          <Layers size={10} /> Кликните на ярус для выбора задач
        </span>
      </div>

      {/* Main Tower Visualization Container */}
      <div className="flex flex-col items-center justify-end w-full max-w-sm mt-auto z-10 space-y-2">
        {/* Sky Antennas and Roof of the Crypto Tower */}
        <div className="w-32 flex flex-col items-center relative">
          {/* Antennas with blinking lights */}
          <div className="w-0.5 h-12 bg-gradient-to-t from-gray-600 to-transparent relative">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-500"></div>
          </div>
          <div className="w-0.5 h-8 bg-gradient-to-t from-gray-500 to-transparent absolute left-10 bottom-0">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
          </div>
          <div className="w-0.5 h-8 bg-gradient-to-t from-gray-500 to-transparent absolute right-10 bottom-0">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
          </div>

          {/* Roof Triangular Dome */}
          <div className="w-24 h-10 bg-[#161618] border-t border-x border-gray-700 rounded-t-full flex items-center justify-center relative shadow-lg">
            <Radio size={14} className="text-blue-400 animate-pulse" />
            
            {/* Display Passive Node Upgrades count visually */}
            {totalUpgradesCount > 0 && (
              <span className="absolute -bottom-1 px-1.5 py-0.5 text-[8px] font-mono bg-blue-950 text-blue-300 border border-blue-800 rounded-full font-bold">
                +{totalUpgradesCount} NODES
              </span>
            )}
          </div>
        </div>

        {/* Built Tiers */}
        <div className="w-full flex flex-col items-center gap-3">
          {reversedTiers.map((tier, idx) => {
            const solvedCount = getTierSolvedCount(tier);
            const isCompleted = solvedCount === tier.tasks.length;
            const isActive = activeTierId === tier.id;

            return (
              <motion.div
                key={tier.id}
                onClick={() => onSelectTier(tier.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full max-w-[280px] p-3 rounded-lg border cursor-pointer relative transition-all duration-300 flex flex-col justify-between overflow-hidden bg-gradient-to-br ${
                  isActive
                    ? `${tier.color} ring-2 ring-offset-2 ring-offset-black ${
                        tier.id === 1 ? 'ring-orange-500 shadow-orange-500/20' : 
                        tier.id === 2 ? 'ring-blue-500 shadow-blue-500/20' :
                        tier.id === 3 ? 'ring-emerald-500 shadow-emerald-500/20' :
                        'ring-purple-500 shadow-purple-500/20'
                      } shadow-lg scale-102`
                    : 'bg-[#111112]/90 border-gray-800/80 hover:border-gray-700 shadow-md'
                }`}
              >
                {/* Visual Glass Reflection Accent */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                {/* Left Side Height Floor Indicator */}
                <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 bg-gray-950 border-y border-r border-gray-800 px-1 py-1.5 rounded-r text-[7px] font-mono text-gray-500 tracking-tighter uppercase [writing-mode:vertical-lr] scale-90">
                  {tier.heightRange}
                </div>

                {/* Header Information */}
                <div className="flex justify-between items-start mb-1.5 pl-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className={`text-xs font-bold uppercase tracking-wider ${isActive ? tier.textColor : 'text-gray-300'}`}>
                        {tier.name}
                      </h3>
                      {isCompleted && (
                        <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                      СЛОЖНОСТЬ: <span className={isActive ? tier.textColor : 'text-gray-400'}>{tier.difficulty}</span>
                    </span>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-mono text-gray-400 font-bold bg-[#0A0A0B] px-1.5 py-0.5 rounded border border-gray-800">
                      {solvedCount} / {tier.tasks.length}
                    </span>
                  </div>
                </div>

                {/* Tier Window Grid Visuals */}
                <div className="grid grid-cols-4 gap-2 px-3 py-1 bg-black/40 rounded border border-gray-950">
                  {tier.tasks.map((task) => {
                    const isTaskSolved = completedTasks.includes(task.id);
                    return (
                      <div
                        key={task.id}
                        className={`h-4 rounded flex items-center justify-center transition-all duration-300 relative group/win ${
                          isTaskSolved
                            ? tier.id === 1 ? 'bg-orange-500/40 border border-orange-400/60 shadow-inner' :
                              tier.id === 2 ? 'bg-blue-500/40 border border-blue-400/60 shadow-inner' :
                              tier.id === 3 ? 'bg-emerald-500/40 border border-emerald-400/60 shadow-inner' :
                              'bg-purple-500/40 border border-purple-400/60 shadow-inner'
                            : 'bg-gray-900 border border-gray-800/50'
                        }`}
                      >
                        {/* Windows glow effect if active/solved */}
                        {isTaskSolved && (
                          <div className={`absolute inset-0 rounded opacity-60 animate-pulse ${
                            tier.id === 1 ? 'bg-orange-500/10' : 
                            tier.id === 2 ? 'bg-blue-500/10' :
                            tier.id === 3 ? 'bg-emerald-500/10' :
                            'bg-purple-500/10'
                          }`}></div>
                        )}
                        <span className="text-[8px] font-mono text-gray-400 scale-90 select-none">
                          {task.id.slice(-4)}
                        </span>
                        
                        {/* Tiny Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/win:block bg-gray-900 text-white border border-gray-800 text-[8px] px-1.5 py-0.5 rounded whitespace-nowrap z-30 font-mono">
                          {task.title}: {isTaskSolved ? 'РЕШЕНО' : 'ЗАБЛОКИРОВАНО'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar inside the floor */}
                <div className="mt-2 pl-3">
                  <div className="w-full bg-gray-900 h-1 rounded-full overflow-hidden border border-gray-950">
                    <div
                      className={`h-full transition-all duration-500 ${
                        tier.id === 1 ? 'bg-orange-500' : 
                        tier.id === 2 ? 'bg-blue-500' :
                        tier.id === 3 ? 'bg-emerald-500' :
                        'bg-purple-500'
                      }`}
                      style={{ width: `${(solvedCount / tier.tasks.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Foundation / Ground Base */}
        <div className="w-[310px] bg-gradient-to-t from-gray-950 to-gray-900 border-t border-gray-700/60 rounded-b px-4 py-1.5 flex flex-col items-center">
          <div className="flex gap-4 text-[9px] text-gray-500 font-mono tracking-wider uppercase">
            <span className="flex items-center gap-1"><Radio size={10} className="text-gray-600" /> Ground Node</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Cpu size={10} className="text-gray-600" /> Genesis Grid</span>
          </div>
        </div>
      </div>

      {/* Decorative Crypto Watermark */}
      <div className="text-[10px] font-mono text-gray-700 uppercase tracking-[0.25em] z-0 mt-4 select-none">
        CRYPTO TOWER CONTROL MODULE
      </div>
    </div>
  );
}
