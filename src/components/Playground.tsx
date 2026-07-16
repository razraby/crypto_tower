import React, { useState, useEffect } from 'react';
import { Task, Tier } from '../types';
import { Play, CheckCircle, HelpCircle, Terminal, RefreshCw, Key, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PlaygroundProps {
  activeTier: Tier;
  completedTasks: string[];
  activeTaskId: string | null;
  onSelectTask: (id: string) => void;
  onSolveTask: (taskId: string, reward: number) => void;
}

function sha256Sync(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j; 

  let result = '';
  const words: number[] = [];
  const asciiLength = ascii[lengthProperty];
  
  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let asciiBitLength = asciiLength * 8;
  let wordCount = ((asciiBitLength + 64) >>> 9 << 4) + 16;
  words[wordCount - 1] = asciiBitLength;

  for (i = 0; i < asciiLength; i++) {
    words[i >>> 2] |= (ascii.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
  }

  words[asciiLength >>> 2] |= 0x80 << (24 - (asciiLength % 4) * 8);

  const w: number[] = [];
  for (i = 0; i < wordCount; i += 16) {
    let a = hash[0];
    let b = hash[1];
    let c = hash[2];
    let d = hash[3];
    let e = hash[4];
    let f = hash[5];
    let g = hash[6];
    let h = hash[7];

    for (j = 0; j < 64; j++) {
      if (j < 16) {
        w[j] = words[i + j] || 0;
      } else {
        const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }

      const ch = (e & f) ^ (~e & g);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp1 = (h + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ch + k[j] + w[j]) | 0;
      const temp2 = ((rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  for (i = 0; i < 8; i++) {
    let val = hash[i];
    if (val < 0) val += maxWord;
    let hex = val.toString(16);
    while (hex.length < 8) hex = '0' + hex;
    result += hex;
  }
  return result;
}

export default function Playground({
  activeTier,
  completedTasks,
  activeTaskId,
  onSelectTask,
  onSolveTask,
}: PlaygroundProps) {
  const [answerInput, setAnswerInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const [caesarInput, setCaesarInput] = useState('CRYPTO');
  const [caesarShift, setCaesarShift] = useState(3);
  const [caesarOutput, setCaesarOutput] = useState('');

  const [hashInput, setHashInput] = useState('satoshi');
  const [hashOutput, setHashOutput] = useState('');

  const activeTask = activeTier.tasks.find((t) => t.id === activeTaskId) || activeTier.tasks[0];

  useEffect(() => {
    if (activeTask) {
      setAnswerInput('');
      setShowHint(false);
      setErrorStatus(null);
      setIsSuccess(completedTasks.includes(activeTask.id));
    }
  }, [activeTaskId, activeTask, completedTasks]);

  useEffect(() => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const result = caesarInput
      .toUpperCase()
      .split('')
      .map((char) => {
        const idx = alphabet.indexOf(char);
        if (idx === -1) return char;
        let newIdx = (idx + caesarShift) % 26;
        if (newIdx < 0) newIdx += 26;
        return alphabet[newIdx];
      })
      .join('');
    setCaesarOutput(result);
  }, [caesarInput, caesarShift]);

  useEffect(() => {
    if (hashInput) {
      setHashOutput(sha256Sync(hashInput));
    } else {
      setHashOutput('');
    }
  }, [hashInput]);

  if (!activeTask) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuccess) return;

    const sanitizedInput = answerInput.trim().toLowerCase();
    const isAnswerCorrect = activeTask.correctAnswers.some(
      (ans) => ans.toLowerCase() === sanitizedInput
    );

    if (isAnswerCorrect) {
      setIsSuccess(true);
      setErrorStatus(null);
      onSolveTask(activeTask.id, activeTask.reward);
    } else {
      setErrorStatus('КЛЮЧ ИЛИ ХЭШ НЕ СОВПАДАЕТ. ПОПРОБУЙТЕ СНОВА.');
      setTimeout(() => {
        setErrorStatus(null);
      }, 3000);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row border-t border-gray-800 md:border-t-0 bg-[#0F0F10] overflow-hidden min-h-0">
      
      {/* Task Selection Sidebar */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-800 p-4 flex flex-col gap-3 shrink-0 bg-[#0B0B0C]">
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
          <Terminal size={12} className={activeTier.textColor} /> Задачи {activeTier.name}
        </h2>

        <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none">
          {activeTier.tasks.map((task) => {
            const isSolved = completedTasks.includes(task.id);
            const isSelected = activeTask.id === task.id;

            return (
              <button
                key={task.id}
                id={`task-btn-${task.id}`}
                onClick={() => onSelectTask(task.id)}
                className={`flex-1 md:flex-initial text-left px-3 py-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 shrink-0 min-w-[150px] transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#161618] border-orange-500/50 text-white shadow-md'
                    : 'bg-[#0F0F10]/40 border-gray-800/80 hover:border-gray-700 text-gray-400 hover:text-gray-200'
                }`}
              >
                <div className="flex flex-col gap-0.5 max-w-[80%]">
                  <span className="font-bold truncate">{task.title}</span>
                  <span className="text-[9px] text-gray-500 truncate leading-none">
                    {task.shortDesc}
                  </span>
                </div>
                {isSolved ? (
                  <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                ) : (
                  <span className="text-[9px] font-mono font-bold text-orange-400 shrink-0 bg-orange-950/40 px-1.5 py-0.5 rounded border border-orange-900/30">
                    +{task.reward} S
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Level Stats Block */}
        <div className="mt-auto hidden md:block border-t border-gray-800/60 pt-4 pb-2">
          <div className="bg-[#0A0A0B] border border-gray-800 p-3 rounded-lg">
            <span className="text-[9px] font-mono text-gray-500 uppercase block mb-1">ТЕКУЩИЙ ЯРУС</span>
            <span className={`text-sm font-bold uppercase tracking-wider ${activeTier.textColor}`}>
              {activeTier.name}
            </span>
            <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-gray-400">
              <span>Сложность:</span>
              <span className="font-bold">{activeTier.difficulty}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Terminal Workspace */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-[#0A0A0B] relative">
        {/* Visual Terminal Overlay Lines */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-1 bg-[length:100%_4px] pointer-events-none opacity-10"></div>

        {/* Terminal Header */}
        <div className="h-10 bg-[#111112] border-b border-gray-800/60 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
            <span className="text-[10px] text-gray-500 font-mono tracking-wider uppercase ml-2">
              SESSION@CRYPTO_TOWER: ~/tier_{activeTier.id}/{activeTask.id}
            </span>
          </div>
          <span className="text-[10px] text-gray-500 font-mono">UTF-8</span>
        </div>

        {/* Terminal Body */}
        <div className="flex-1 p-6 flex flex-col gap-4 font-sans text-gray-200">
          {/* Header Info */}
          <div>
            <span className={`text-[10px] font-mono tracking-widest uppercase font-bold px-2 py-0.5 rounded bg-black border border-gray-800 ${activeTier.textColor}`}>
              Ярус {activeTier.id} // {activeTier.name}
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight mt-2 flex items-center gap-2">
              {activeTask.title}
              {isSuccess && <ShieldCheck size={20} className="text-emerald-400" />}
            </h1>
          </div>

          {/* Description Section */}
          <div className="bg-[#0F0F10] border border-gray-800/80 rounded-xl p-4 leading-relaxed text-sm text-gray-300 whitespace-pre-line relative overflow-hidden shadow-inner">
            {activeTask.description}
          </div>

          {/* Core Interactive Workspace */}
          <div className="border border-gray-800 rounded-xl bg-[#111112] overflow-hidden">
            {/* Input Form Box Header */}
            <div className="bg-black/40 border-b border-gray-800 px-4 py-2 flex items-center justify-between">
              <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest flex items-center gap-1.5">
                <Terminal size={10} className="text-orange-400" /> Ввод решения
              </span>
              <span className="text-[9px] font-mono text-gray-500">
                РЕШЕНИЕ СТРОГО ПРОВЕРЯЕТСЯ
              </span>
            </div>

            {/* Form body */}
            <div className="p-4 flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-white font-sans flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></span>
                {activeTask.question}
              </h3>

              <form onSubmit={handleVerify} className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      id="solution-input"
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      disabled={isSuccess}
                      placeholder={isSuccess ? "ЗАДАЧА РЕШЕНА // ДОСТУП ПРЕДОСТАВЛЕН" : "Введите ответ здесь..."}
                      className={`w-full bg-[#070708] border rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none transition-all duration-200 ${
                        isSuccess
                          ? 'border-emerald-800 text-emerald-400 placeholder-emerald-700/60 bg-emerald-950/10'
                          : 'border-gray-800 focus:border-orange-500 text-white placeholder-gray-600'
                      }`}
                    />
                    {isSuccess && (
                      <CheckCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                    )}
                  </div>

                  {!isSuccess && (
                    <button
                      type="submit"
                      id="submit-solution-btn"
                      className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <Play size={12} fill="currentColor" /> Отправить
                    </button>
                  )}
                </div>

                {/* Validation Status Message */}
                <AnimatePresence mode="wait">
                  {errorStatus && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs font-mono text-red-400 bg-red-950/20 border border-red-900/30 p-2 rounded flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                      {errorStatus}
                    </motion.div>
                  )}
                  {isSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 p-3 rounded flex flex-col gap-1"
                    >
                      <div className="flex items-center gap-2 font-bold">
                        <Sparkles size={14} className="text-emerald-400" />
                        СТАТУС: ВЕРНО (СОВПАДЕНИЕ НАЙДЕНО)
                      </div>
                      <span className="text-[11px] text-emerald-300/80">
                        Вам начислена награда в размере **{activeTask.reward} Satoshi**! Новые этажи разблокированы.
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>

              {/* Hint and Wiki helper button row */}
              <div className="flex gap-2 border-t border-gray-800/60 pt-3">
                <button
                  type="button"
                  id="toggle-hint-btn"
                  onClick={() => setShowHint(!showHint)}
                  className="px-3 py-1.5 border border-gray-800 hover:border-gray-700 bg-gray-950 text-gray-400 hover:text-gray-200 text-[11px] uppercase tracking-wider font-mono rounded flex items-center gap-1 transition-all"
                >
                  <HelpCircle size={12} /> {showHint ? "Скрыть подсказку" : "Показать подсказку"}
                </button>
              </div>

              {/* Expanded Hint Content */}
              {showHint && (
                <div className="p-3 bg-gray-950 border border-gray-800/80 rounded text-xs text-gray-400 leading-relaxed font-mono whitespace-pre-line">
                  {activeTask.hint}
                </div>
              )}
            </div>
          </div>

          {/* Live Interactive Cryptography Tools Embedded directly inside the task! */}
          {activeTask.interactiveTool && activeTask.interactiveTool !== 'none' && (
            <div className="border border-blue-900/40 rounded-xl bg-blue-950/10 overflow-hidden mt-2">
              <div className="bg-blue-950/30 border-b border-blue-900/40 px-4 py-2 flex items-center justify-between">
                <span className="text-[10px] text-blue-400 font-mono uppercase tracking-widest flex items-center gap-1.5">
                  <Key size={12} className="text-blue-400" /> Интерактивный терминал помощник
                </span>
                <span className="text-[8px] font-mono text-blue-500 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-900/50 uppercase tracking-tighter">
                  Песочница {activeTask.interactiveTool}
                </span>
              </div>

              <div className="p-4 flex flex-col gap-3">
                {activeTask.interactiveTool === 'caesar' ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-xs text-blue-300 leading-relaxed">
                      Используйте этот мини-дешифратор для перебора сдвигов прямо в приложении! Он преобразует английские буквы.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Текст шифра</label>
                        <input
                          type="text"
                          value={caesarInput}
                          onChange={(e) => setCaesarInput(e.target.value.toUpperCase())}
                          className="w-full bg-[#070708] border border-gray-800 focus:border-blue-500 rounded p-2 text-xs font-mono text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Сдвиг назад (разница)</label>
                        <select
                          value={caesarShift}
                          onChange={(e) => setCaesarShift(Number(e.target.value))}
                          className="w-full bg-[#070708] border border-gray-800 focus:border-blue-500 rounded p-2 text-xs font-mono text-white"
                        >
                          {Array.from({ length: 25 }, (_, i) => i + 1).map((val) => (
                            <option key={val} value={26 - val}>
                              Сдвиг назад на {val} (-{val})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="bg-black/60 border border-blue-950 p-2.5 rounded flex flex-col justify-center">
                        <span className="text-[9px] uppercase font-bold text-blue-500">Результат расшифровки:</span>
                        <span className="text-sm font-mono font-bold text-blue-400 tracking-wider mt-1 truncate">
                          {caesarOutput || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="text-xs text-blue-300 leading-relaxed">
                      Введите любой текст, чтобы мгновенно сгенерировать его валидный хэш SHA-256 в реальном времени.
                    </p>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={hashInput}
                          onChange={(e) => setHashInput(e.target.value)}
                          placeholder="Введите строку для хэширования..."
                          className="flex-1 bg-[#070708] border border-gray-800 focus:border-blue-500 rounded p-2 text-xs font-mono text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setHashInput(Math.random().toString(36).substring(7))}
                          className="px-2 border border-gray-800 hover:border-blue-500 rounded text-[11px] font-mono text-blue-400 bg-gray-950 flex items-center justify-center gap-1 shrink-0"
                        >
                          <RefreshCw size={10} /> Рандом
                        </button>
                      </div>
                      <div className="bg-black/60 border border-blue-950 p-2.5 rounded font-mono break-all text-[11px]">
                        <span className="text-[9px] uppercase font-bold text-blue-500 block mb-1">ХЭШ SHA-256 ({hashOutput.length * 4} бит):</span>
                        <span className="text-blue-400 font-semibold">{hashOutput}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
