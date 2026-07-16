import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  Compass, 
  RefreshCw, 
  Key, 
  Lock, 
  Unlock, 
  Archive, 
  ChevronRight, 
  CheckCircle2, 
  RotateCcw,
  Play,
  Pause,
  FileText,
  Flame,
  Award,
  Scroll,
  X
} from 'lucide-react';
import WikiPanel from './components/WikiPanel';
import StudyViewCanvas from './components/StudyViewCanvas';

const RUSSIAN_ALPHABET = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
const VIGENERE_EXPECTED_KEY = 'БАШНЯ';
const VIGENERE_CIPHER_TEXT = 'РЕИПЯА ЧШЮСЭ КГЛЦБ - СЖЭНЛ СЭЩЫ';

function playDoorSlamSound() {
  const audio = new Audio('/sounds/door-slam.wav');
  audio.volume = 0.85;
  audio.currentTime = 0;
  void audio.play().catch(() => {
    playDoorLockSound();
  });
}

function playDoorLockSound() {
  const AudioContextClass = window.AudioContext;
  if (!AudioContextClass) return;

  const audioContext = new AudioContextClass();
  const now = audioContext.currentTime;

  const createThud = (start: number, frequency: number, duration: number, volume: number) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(35, start + duration);

    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
  };

  const createClang = (start: number, frequency: number, duration: number, volume: number) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.62, start + duration);

    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
  };

  const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.35, audioContext.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }

  const noise = audioContext.createBufferSource();
  const noiseFilter = audioContext.createBiquadFilter();
  const noiseGain = audioContext.createGain();

  noise.buffer = noiseBuffer;
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.setValueAtTime(650, now);
  noiseGain.gain.setValueAtTime(0.18, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(audioContext.destination);

  noise.start(now);
  noise.stop(now + 0.35);

  createThud(now, 115, 0.42, 0.55);
  createThud(now + 0.09, 72, 0.35, 0.42);
  createClang(now + 0.27, 720, 0.22, 0.2);
  createClang(now + 0.34, 1180, 0.16, 0.14);

  window.setTimeout(() => {
    void audioContext.close();
  }, 900);
}

function decryptCaesar(ciphertext: string, shift: number): string {
  return ciphertext
    .split('')
    .map((char) => {
      if (char === ' ' || char === '-' || char === '_' || char === ',' || char === '.') return char;
      const index = RUSSIAN_ALPHABET.indexOf(char.toUpperCase());
      if (index === -1) return char;
      let newIndex = (index - shift) % 32;
      if (newIndex < 0) newIndex += 32;
      const decodedChar = RUSSIAN_ALPHABET[newIndex];
      return char === char.toLowerCase() ? decodedChar.toLowerCase() : decodedChar;
    })
    .join('');
}

function buildVigenereRows(ciphertext: string, key: string) {
  if (!key) return [];

  let keyIndex = 0;

  return ciphertext.split('').map((char, index) => {
    const cipherIndex = RUSSIAN_ALPHABET.indexOf(char.toUpperCase());

    if (cipherIndex === -1) {
      return {
        index,
        cipherLetter: char,
        keyLetter: '',
        keyShift: null,
        plainLetter: char,
        isLetter: false,
      };
    }

    const keyLetter = key[keyIndex % key.length];
    const keyShift = RUSSIAN_ALPHABET.indexOf(keyLetter);
    const plainLetter = RUSSIAN_ALPHABET[(cipherIndex - keyShift + RUSSIAN_ALPHABET.length) % RUSSIAN_ALPHABET.length];

    keyIndex += 1;

    return {
      index,
      cipherLetter: char,
      keyLetter,
      keyShift,
      plainLetter,
      isLetter: true,
    };
  });
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'title' | 'intro' | 'room' | 'victory'>('title');
  const [wikiOpen, setWikiOpen] = useState(false);

  const [inventory, setInventory] = useState<string[]>([]);
  const [cabinetOpen, setCabinetOpen] = useState(false);
  const [strapTaken, setStrapTaken] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [activeRiddle, setActiveRiddle] = useState<'caesar' | 'vigenere' | 'scytale' | 'lock' | null>(null);

  const [caesarSolved, setCaesarSolved] = useState(false);
  const [vigenereSolved, setVigenereSolved] = useState(false);
  const [scytaleSolved, setScytaleSolved] = useState(false);

  const [caesarInput, setCaesarInput] = useState('');
  const [caesarShift, setCaesarShift] = useState(0); 
  
  const [vigenereKey, setVigenereKey] = useState('');
  const [vigenereInput, setVigenereInput] = useState('');
  const [vigenereStep, setVigenereStep] = useState(0);
  const [vigenerePlaying, setVigenerePlaying] = useState(false);
  
  const [scytaleDiameter, setScytaleDiameter] = useState(3); 
  const [scytaleRotation, setScytaleRotation] = useState(0);
  const [scytaleInput, setScytaleInput] = useState('');

  const [lockDigits, setLockDigits] = useState<number[]>([0, 0, 0, 0]);
  const [lockError, setLockError] = useState<string | null>(null);

  const [logs, setLogs] = useState<string[]>([
    'Вы оглядываетесь в старинном, пахнущем воском кабинете криптографа...'
  ]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('ru-RU', { hour12: false });
    setLogs((prev) => [`[${time}] ${msg}`, ...prev]);
  };

  const triggerAudio = (message: string) => {
    void message;
  };

  const [hintTimer, setHintTimer] = useState<number>(0);
  useEffect(() => {
    if (currentScreen !== 'room') return;
    const interval = setInterval(() => {
      setHintTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentScreen]);

  useEffect(() => {
    if (currentScreen !== 'room') return;
    if (hintTimer === 35 && !caesarSolved) {
      addLog('Подсказка: Бюст Цезаря устремил взор на загадочные диски. Проверьте сдвиг букв назад.');
    }
    if (hintTimer === 75 && caesarSolved && !vigenereSolved) {
      addLog('Подсказка: Полотно старого мастера молчит... Но оно ждет заветное слово «БАШНЯ», раскрытое вами в ящике.');
    }
    if (hintTimer === 120 && vigenereSolved && !scytaleSolved) {
      addLog('Подсказка: Возьмите кожаный пояс из сундука и намотайте его на резную деревянную рукоять двери.');
    }
  }, [hintTimer]);

  useEffect(() => {
    setHintTimer(0);
    if (activeRiddle !== 'vigenere') {
      setVigenerePlaying(false);
    }
  }, [activeRiddle]);

  const handlePlay = () => {
    playDoorSlamSound();
    triggerAudio('🔊 Гулкий удар двери. Железный засов с лязгом встал на место...');
    setCurrentScreen('intro');
  };

  const handleReset = () => {
    if (window.confirm('Вы действительно желаете вернуться в начало испытания? Весь ваш прогресс обратится в прах.')) {
      setInventory([]);
      setCabinetOpen(false);
      setStrapTaken(false);
      setDrawerOpen(false);
      setActiveRiddle(null);
      setCaesarSolved(false);
      setVigenereSolved(false);
      setScytaleSolved(false);
      setCaesarInput('');
      setCaesarShift(0);
      setVigenereKey('');
      setVigenereInput('');
      setVigenereStep(0);
      setVigenerePlaying(false);
      setScytaleDiameter(3);
      setScytaleRotation(0);
      setScytaleInput('');
      setLockDigits([0, 0, 0, 0]);
      setLockError(null);
      setLogs(['Вы очнулись посреди таинственной комнаты...']);
      setCurrentScreen('title');
    }
  };


  const handleCabinetClick = () => {
    if (!cabinetOpen) {
      setCabinetOpen(true);
      triggerAudio('🔊 Деревянные створки шкафа со скрипом отворились...');
      addLog('Вы подошли к кованому готическому шкафу. Его тяжелые резные створки со скрипом распахнулись. Внутри на костяном крючке свисает исписанный кожаный ремень.');
    } else if (cabinetOpen && !strapTaken) {
      addLog('Внутри открытого шкафа висит старинный ремень с руническими символами. Кликните по ремню, чтобы забрать его.');
    } else {
      addLog('Кованый шкаф пуст. На пыльных полках остался лишь призрак давно ушедших веков.');
    }
  };

  const handleTakeStrap = (e?: React.MouseEvent) => {
    e?.stopPropagation(); 
    setStrapTaken(true);
    setInventory((prev) => [...prev, 'ремень']);
    addLog('Вы аккуратно сняли [Кожаный ремень] с таинственной вязью: ВЯТДТ_ЬАОЧ__РАК1АСО9.');
    triggerAudio('💼 Древний кожаный ремень добавлен в инвентарь');
  };

  const handleNightstandClick = () => {
    if (!drawerOpen) {
      setDrawerOpen(true);
      triggerAudio('🔓 Выдвижной дубовый ящик со скрежетом подался вперед...');
      addLog('Вы открыли тайную шуфляду под тяжелым мраморным бюстом Гая Юлия Цезаря. Внутри на куске истлевшего бархата покоится пожелтевший манускрипт.');
    } else {
      setActiveRiddle('caesar');
      addLog('Вы изучаете манускрипт у подножия Цезаря. Левый диск-механизм активирован.');
    }
  };

  const handlePaintingClick = () => {
    if (!caesarSolved) {
      addLog('Вы подходите к портрету великого алхимика. Рама заперта на секретную защелку. Нужно слово-ключ.');
      setActiveRiddle('vigenere');
    } else {
      setActiveRiddle('vigenere');
      addLog('Вы вглядываетесь в портрет. Под золоченым багетом проступили скрытые литеры шифра Виженера.');
    }
  };

  const handleDoorHandleClick = () => {
    if (!strapTaken) {
      addLog('Вы осматриваете массивную дверь. Длинная, гладко обточенная дубовая рукоять покрыта потертостями, будто на неё веками наматывали ленту.');
    } else {
      setActiveRiddle('scytale');
      addLog('Вы подошли к двери. Цилиндрическая форма рукояти идеально подходит для сциталы. Вы примеряете кожаный ремень к дереву.');
    }
  };

  const handleLockClick = () => {
    setActiveRiddle('lock');
    addLog('Вы приблизились к кованому бронзовому засову двери. Зубчатые кольца замка ждут четырех цифр.');
  };

  const submitCaesar = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAnswer = caesarInput.trim().toUpperCase();
    if (cleanAnswer === 'БАШНЯ') {
      setCaesarSolved(true);
      triggerAudio('✨ Щелчок скрытого зажима! Записка Цезаря разгадана.');
      addLog('Шифр Цезаря разгадан! Получено тайное слово-ключ: БАШНЯ.');
    } else {
      triggerAudio('❌ Руны не сходятся. Измените сдвиг дисков.');
      addLog('Тайный свиток Цезаря: Символы сложились в хаос. Попробуйте другой сдвиг.');
    }
  };

  const submitVigenere = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = vigenereKey.trim().toUpperCase().replace(/Ё/g, 'Е').replace(/[^А-Я]/g, '');
    if (cleanKey === VIGENERE_EXPECTED_KEY) {
      const cleanAnswer = vigenereInput.trim().toUpperCase().replace(/\s/g, '');
      if (cleanAnswer === 'СОРОКСЕМЬ' || cleanAnswer === '47' || cleanAnswer.includes('СОРОКСЕМЬ')) {
        setVigenereSolved(true);
        triggerAudio('✨ Портрет с глухим стуком отошел, приоткрыв нишу!');
        addLog('Шифр Виженера разгадан! Из тайника выпал свиток с первой частью кода от двери: 47.');
      } else {
        triggerAudio('❌ Ключевое слово верно, но перевод послания неточен.');
        addLog('Портрет Алхимика: Скрытый смысл ускользает от вас. Проверьте буквы в сетке.');
      }
    } else {
      triggerAudio('❌ Замок рамы картины неподвижен. Ключ не подходит.');
      addLog('Портрет Алхимика: Замок рамы картины не открывается. Неверный ключ.');
    }
  };

  const submitScytale = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAnswer = scytaleInput.trim().toUpperCase().replace(/\s/g, '');
    if (cleanAnswer === '19' || cleanAnswer.includes('КОДА19') || cleanAnswer.includes('19')) {
      setScytaleSolved(true);
      triggerAudio('✨ Буквы на коже выстроились в ровный ряд!');
      addLog('Шифр сциталы на рукояти разгадан! Вы прочли вторую часть кода от двери: 19.');
    } else {
      triggerAudio('❌ Литеры наползают друг на друга. Смените диаметр.');
      addLog('Намотка сциталы: Текст на ремне остался неразборчивой вязью.');
    }
  };

  const submitLock = () => {
    const code = lockDigits.join('');
    if (code.length < 4) {
      setLockError('Кованый засов требует ровно четыре цифры.');
      addLog('Засов двери: Механизм заблокирован. Требуется ввести все цифры.');
      return;
    }
    
    if (code === '4719') {
      triggerAudio('🔓 Тяжелые железные засовы со свистом и грохотом отошли!');
      addLog('Вы ввели верный код 4719! Зубья кодового замка с лязгом сложились, и вековая дубовая дверь медленно отворилась в ночь...');
      setTimeout(() => {
        setCurrentScreen('victory');
      }, 1500);
    } else {
      setLockError('Неверный код. Стальные зубья заблокировали дубовые брусья...');
      addLog('Кодовый замок: Неверный шифр! Шестеренки глухо заскрежетали в пазах.');
      triggerAudio('❌ Слышен сухой и зловещий скрежет шестеренок...');
    }
  };

  const changeDigit = (idx: number, amount: number) => {
    setLockDigits((prev) => {
      const copy = [...prev];
      copy[idx] = (copy[idx] + amount + 10) % 10;
      return copy;
    });
    setLockError(null);
  };

  const getCoordinates = (index: number, total: number, radius: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const x = Math.round(140 + radius * Math.cos(angle));
    const y = Math.round(140 + radius * Math.sin(angle));
    return { x, y, angle: (angle * 180) / Math.PI + 90 };
  };

  const currentDecodedCaesar = decryptCaesar('НОБЪ ЗОВ НГУХЛРЮ - ДГЫРВ', caesarShift);
  const normalizedVigenereKey = vigenereKey.trim().toUpperCase().replace(/Ё/g, 'Е').replace(/[^А-Я]/g, '');
  const vigenereHasKey = normalizedVigenereKey.length > 0;
  const vigenereKeyReady = normalizedVigenereKey === VIGENERE_EXPECTED_KEY;
  const vigenereRows = buildVigenereRows(VIGENERE_CIPHER_TEXT, normalizedVigenereKey);
  const vigenereLetterRows = vigenereRows.filter((row) => row.isLetter);
  const currentVigenereRow = vigenereLetterRows[Math.min(vigenereStep, vigenereLetterRows.length - 1)];
  const currentVigenereKeyIndex = currentVigenereRow ? RUSSIAN_ALPHABET.indexOf(currentVigenereRow.keyLetter) : 0;
  const currentVigenerePlainIndex = currentVigenereRow ? RUSSIAN_ALPHABET.indexOf(currentVigenereRow.plainLetter) : 0;
  const currentVigenerePreview = vigenereRows.map((row) => row.plainLetter).join('');

  useEffect(() => {
    if (!vigenerePlaying || activeRiddle !== 'vigenere' || !vigenereHasKey || vigenereLetterRows.length === 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setVigenereStep((prev) => {
        const lastStep = vigenereLetterRows.length - 1;
        if (prev >= lastStep) {
          setVigenerePlaying(false);
          return lastStep;
        }
        return prev + 1;
      });
    }, 750);

    return () => window.clearInterval(interval);
  }, [activeRiddle, vigenereHasKey, vigenereLetterRows.length, vigenerePlaying]);

  return (
    <div className="w-full h-screen bg-[#060a13] text-parchment-100 flex flex-col overflow-hidden font-serif antialiased selection:bg-[#486581]/30 selection:text-white">
      
      {/* Background Ambience: Gothic stone chamber shading and cool flickering sapphire/moonlight glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(36,62,86,0.25)_0%,_rgba(6,10,19,1)_70%)] -z-10 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(217,226,236,0.04)_0%,_transparent_50%)] -z-10 pointer-events-none animate-room-glow"></div>

      {/* ----------------------------------------------------
          1. TITLE SCREEN (Заглавный экран)
         ---------------------------------------------------- */}
      {currentScreen === 'title' && (
        <div className="flex-1 flex flex-col items-center justify-between p-6 md:p-12 relative overflow-hidden">
          
          {/* Aesthetic cool shadow for the stone bridge & tower view */}
          <div className="absolute inset-0 w-full h-full opacity-60 bg-[radial-gradient(circle_at_50%_110%,_#102a43_0%,_transparent_65%)]"></div>
          
          {/* Detailed SVG Illustration of the Tower under Moonlight */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25 -z-10">
            <svg width="450" height="650" viewBox="0 0 400 600" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="45" cy="70" r="1.5" fill="#fef" />
              <circle cx="350" cy="110" r="1" fill="#fee" className="animate-pulse" />
              <circle cx="110" cy="240" r="2" fill="#fff" className="animate-pulse" />
              <circle cx="290" cy="60" r="1.5" fill="#ffd" />
              {/* Stone bridge silhouette */}
              <path d="M0,530 Q120,500 240,540 T400,510 L400,600 L0,600 Z" fill="#020408" />
              <path d="M60,530 Q150,465 240,530" stroke="#000" strokeWidth="5" />
              {/* Arched Stone Tower */}
              <rect x="145" y="110" width="110" height="420" fill="#121d33" rx="4" stroke="#334e68" strokeWidth="2" />
              {/* Tower Roof */}
              <path d="M125,110 L200,15 L275,110 Z" fill="#2d3f61" stroke="#121d33" strokeWidth="2" />
              {/* Glowing window with flickering sapphire candlelight */}
              <rect x="185" y="160" width="30" height="50" rx="15" fill="#3b82f6" className="animate-pulse" />
              <circle cx="200" cy="180" r="10" fill="#60a5fa" className="animate-ping" style={{ animationDuration: '3s' }} />
            </svg>
          </div>

          {/* Top Logo / Brand (Humble and Literal) */}
          <div className="text-center mt-6 z-10">
            <span className="text-[10px] font-display tracking-widest text-[#829ab1] uppercase font-bold px-3 py-1 bg-gradient-to-r from-transparent via-[#102a43] to-transparent">
              Мини-квест • Команда Clash_kb
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-parchment-100 tracking-wider mt-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              Кабинет шифров
            </h1>
            <div className="h-[3px] w-40 bg-gradient-to-r from-transparent via-[#486581] to-transparent mx-auto mt-3"></div>
            <p className="text-lg md:text-2xl font-serif text-parchment-300 tracking-wide mt-2.5 italic">
              Побег из таинственной башни
            </p>
          </div>

          {/* Middle Call to Action Card (Vintage Scroll Look) */}
          <div className="w-full max-w-xl bg-gradient-to-b from-[#0a1120] to-[#060a13] border-2 border-[#1e2d4a] p-8 rounded shadow-2xl text-center backdrop-blur-xs relative z-10">
            {/* Iron bracket corner decorations */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#486581]/50"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#486581]/50"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#486581]/50"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#486581]/50"></div>

            <p className="text-base md:text-lg font-serif text-parchment-200 leading-relaxed italic">
              «Расшифруй послания старого криптографа, собери код от двери и покинь башню до полуночи»
            </p>

            <div className="flex flex-col gap-4 mt-8 max-w-sm mx-auto">
              <button
                id="btn-play-game"
                onClick={handlePlay}
                className="w-full bg-gradient-to-b from-[#334e68] to-[#102a43] hover:from-[#486581] hover:to-[#334e68] border-2 border-[#243e56] hover:border-parchment-400 text-parchment-100 font-display font-bold text-lg py-4 px-6 rounded tracking-widest shadow-xl transition-all duration-300 transform active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-3"
              >
                <Flame size={18} className="text-sky-400 animate-candle" />
                <span>НАЧАТЬ ПОБЕГ</span>
              </button>

              <button
                id="btn-wiki-open"
                onClick={() => setWikiOpen(true)}
                className="w-full bg-[#0a1120] hover:bg-[#121d33] border border-[#1e2d4a] hover:border-[#486581] text-parchment-300 hover:text-white font-display text-sm py-3 px-6 rounded tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                <BookOpen size={15} className="text-parchment-500" />
                <span>Энциклопедия шифров</span>
              </button>
            </div>
          </div>

          {/* Footer credentials */}
          <div className="text-[12px] font-serif text-parchment-700 mt-6 tracking-wider select-none bg-gothic-950 px-4 py-1.5 rounded border border-parchment-950">
            Clash_kb • Летопись Криптографии • Страница 1
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          2. NARRATION STORY SCREEN (Вводный сюжет)
         ---------------------------------------------------- */}
      {currentScreen === 'intro' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 max-w-2xl mx-auto text-center z-10">
          {/* Scroll paper style card */}
          <div className="bg-gradient-to-br from-[#121d33] via-[#0a1120] to-[#060a13] border-4 border-[#1e2d4a] p-8 md:p-10 rounded-md shadow-2xl text-parchment-100 space-y-6 leading-relaxed relative">

            <p className="italic text-xl font-display text-parchment-300 tracking-wide text-center">
              * Резкий скрип петель... глухой удар... лязг засова! *
            </p>
            <p className="text-base md:text-lg text-justify font-serif text-parchment-200 leading-relaxed">
              После нажатия на вход башня погрузилась в полумрак, и тяжелая кованая створка захлопнулась за спиной Арсена. Он оказался заперт в старой башне, в кабинете хранителя тайных посланий, где каждый предмет будто ждал, когда его прочитают.
            </p>
            <p className="text-base md:text-lg text-justify font-serif text-parchment-200 leading-relaxed">
              В комнате видны шкаф, тумбочка с бюстом Цезаря, картина со скрытым посланием, длинная деревянная рукоять двери и кодовый замок рядом с выходом. Чтобы выбраться, Арсену нужно исследовать кабинет и решить три задания по исторической криптографии: <strong className="text-parchment-300 font-display font-bold">шифр Цезаря</strong>, <strong className="text-parchment-300 font-display font-bold">шифр Виженера</strong> и спартанскую <strong className="text-parchment-300 font-display font-bold">сциталу</strong>.
            </p>
            <p className="text-base md:text-lg text-justify font-serif text-parchment-200 leading-relaxed">
              Цель Арсена не просто подобрать код, а понять принцип каждого шифра через подсказки и предметы комнаты. Найдите кожаный ремень, расшифруйте записки, соберите обе части кода и покиньте башню до полуночи.
            </p>

            <div className="pt-6 border-t-2 border-[#1e2d4a] mt-6 flex justify-center">
              <button
                onClick={() => {
                  addLog('Арсен огляделся в таинственном кабинете. Нужно исследовать предметы и найти первую зацепку.');
                  setCurrentScreen('room');
                }}
                className="bg-gradient-to-b from-[#486581] to-[#243e56] hover:from-[#627d98] hover:to-[#486581] text-parchment-100 px-8 py-3.5 rounded font-display font-bold text-sm tracking-widest flex items-center gap-3 cursor-pointer transition-colors border-2 border-[#243e56] hover:border-parchment-300 shadow-lg active:translate-y-0.5"
              >
                <span>ОСМОТРЕТЬ КАБИНЕТ</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          3. MAIN ESCAPE ROOM (Основная комната)
         ---------------------------------------------------- */}
      {currentScreen === 'room' && (
        <div className="min-h-0 flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          
          {/* Interactive Help / Puzzle Panel (Left Column - Gothic Stone Architecture Style) */}
          <div className="w-full lg:basis-[clamp(520px,48vw,860px)] lg:shrink-0 border-b-4 lg:border-b-0 lg:border-r-4 border-[#1e2d4a] flex flex-col bg-gothic-950 overflow-hidden shadow-2xl relative z-10">
            
            {/* Header of helper panel (Iron plate with silver/blue title) */}
            <div className="h-14 bg-gradient-to-b from-[#121d33] to-[#0a1120] border-b border-parchment-900/40 px-5 flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center gap-2.5">
                <Compass className="text-[#829ab1] animate-pulse" size={18} />
                <span className="text-xs font-display font-bold text-parchment-200 uppercase tracking-widest">
                  Крипто-Помощник
                </span>
              </div>
              <button
                id="helper-wiki-btn"
                onClick={() => setWikiOpen(true)}
                className="text-xs font-display bg-gradient-to-b from-[#1e2d4a] to-[#102a43] border border-[#243e56] hover:border-[#486581] text-parchment-200 px-3 py-1 rounded shadow-md transition-colors cursor-pointer flex items-center gap-1.5 active:translate-y-0.5"
              >
                <BookOpen size={13} className="text-parchment-400" />
                <span>Энциклопедия</span>
              </button>
            </div>

            {/* Inner panel solver view container */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col justify-between bg-gothic-900">
              
              {/* SOLVER FOR CAESAR */}
              {activeRiddle === 'caesar' && (
                <div className="space-y-6 flex flex-col h-full justify-between">
                  <div>
                    <span className="text-[10px] font-display text-parchment-500 uppercase tracking-widest block font-bold mb-1">
                      Шифр Императора Цезаря
                    </span>
                    <h3 className="text-xl font-display font-bold text-parchment-200 border-b border-parchment-900/30 pb-2">
                      Механический Диск
                    </h3>

                    {/* Cool stone/slate manuscript citation */}
                    <div className="bg-gradient-to-b from-[#121d33] to-[#0a1120] border-2 border-[#1e2d4a] rounded p-4 text-sm font-serif text-parchment-200 italic leading-relaxed mt-4 shadow-inner relative">
                      <div className="absolute top-1 left-2 text-[#486581]/20 font-display text-2xl select-none">✠</div>
                      «Император любил сдвигать буквы. Верни их на три шага назад».
                    </div>

                    <div className="mt-5 bg-[#060a13] border border-[#1e2d4a] p-3 rounded font-mono text-center shadow-lg">
                      <span className="text-[10px] uppercase font-bold text-parchment-600 block mb-1">Зашифрованное послание:</span>
                      <span className="text-base font-bold text-sky-400 tracking-widest font-mono">НОБЪ ЗОВ НГУХЛРЮ - ДГЫРВ</span>
                    </div>

                    {/* Concentric Circle Visualizer SVG (Antique silver/blue decryption disk) */}
                    <div className="my-6 select-none">
                      <div className="mb-3 grid grid-cols-1 gap-2 text-[11px] font-display text-parchment-400 md:grid-cols-2">
                        <div className="rounded border border-[#1e2d4a] bg-[#060a13] px-3 py-2">
                          <span className="text-parchment-200">Внешнее кольцо:</span> буквы зашифрованного текста
                        </div>
                        <div className="rounded border border-[#243e56] bg-[#07111f] px-3 py-2">
                          <span className="text-sky-300">Внутреннее кольцо:</span> буквы после сдвига назад
                        </div>
                      </div>

                      <div className="flex justify-center relative">
                        <svg width="280" height="280" viewBox="0 0 280 280" className="bg-[#060a13] rounded-full border-4 border-[#1e2d4a] shadow-2xl">
                        {/* Outer bronze track decoration */}
                        <circle cx="140" cy="140" r="136" stroke="#334e68" strokeWidth="1" strokeDasharray="3 3" fill="none" />
                        <line x1="140" y1="10" x2="140" y2="60" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
                        <polygon points="140,52 134,64 146,64" fill="#60a5fa" />
                        
                        {/* Outer Fixed Ring (Alphabet) */}
                        <circle cx="140" cy="140" r="110" stroke="#102a43" strokeWidth="22" fill="none" className="opacity-70" />
                        {RUSSIAN_ALPHABET.split('').map((letter, i) => {
                          const { x, y, angle } = getCoordinates(i, 32, 110);
                          return (
                            <text
                              key={`outer-${i}`}
                              x={x}
                              y={y}
                              transform={`rotate(${angle}, ${x}, ${y})`}
                              className="text-[10px] font-display font-bold fill-parchment-300"
                              textAnchor="middle"
                              dominantBaseline="central"
                            >
                              {letter}
                            </text>
                          );
                        })}

                        {/* Inner Rotating Ring (Antique Silver style) */}
                        <g style={{ transform: `rotate(${(caesarShift * 360) / 32}deg)`, transformOrigin: '140px 140px', transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)' }}>
                          <circle cx="140" cy="140" r="80" stroke="#243e56" strokeWidth="18" fill="none" />
                          {RUSSIAN_ALPHABET.split('').map((letter, i) => {
                            const { x, y, angle } = getCoordinates(i, 32, 80);
                            return (
                              <text
                                key={`inner-${i}`}
                                x={x}
                                y={y}
                                transform={`rotate(${angle}, ${x}, ${y})`}
                                className="text-[9px] font-mono font-bold fill-sky-300"
                                textAnchor="middle"
                                dominantBaseline="central"
                              >
                                {letter}
                              </text>
                            );
                          })}
                        </g>

                        {/* Partition borders */}
                        <circle cx="140" cy="140" r="95" stroke="#334e68" strokeWidth="2" fill="none" className="opacity-50" />
                        <circle cx="140" cy="140" r="66" stroke="#1e2d4a" strokeWidth="2" fill="none" />
                        
                        {/* Center golden medallion core */}
                        <circle cx="140" cy="140" r="32" fill="#0a1120" stroke="#486581" strokeWidth="2" />
                        <text x="140" y="140" className="text-[11px] font-display font-bold fill-sky-200" textAnchor="middle" dominantBaseline="central">
                          СДВИГ={caesarShift}
                        </text>
                        <text x="140" y="158" className="text-[8px] font-display fill-parchment-500" textAnchor="middle">
                          назад
                        </text>
                        </svg>

                      </div>
                    </div>

                    {/* Slider input styled with silver trim */}
                    <div className="space-y-1.5 bg-[#060a13] p-3 rounded-md border border-[#1e2d4a]">
                      <div className="flex justify-between items-center text-xs font-mono text-parchment-500">
                        <span>Сдвиг назад: {caesarShift}</span>
                        <span>{Math.round(360/32 * caesarShift)}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="31"
                        value={caesarShift}
                        onChange={(e) => {
                          setCaesarShift(Number(e.target.value));
                          triggerAudio('🔊 Потрескивают латунные фиксаторы диска...');
                        }}
                        className="w-full accent-[#486581] cursor-pointer h-1.5 bg-[#1e2d4a] rounded"
                      />
                    </div>

                    {/* Result real-time preview (Cool slate strip) */}
                    <div className="mt-4 bg-gradient-to-r from-[#121d33] to-[#0a1120] border-2 border-[#1e2d4a] p-3 rounded font-serif text-center shadow-md text-parchment-200">
                      <span className="text-[10px] uppercase font-display font-bold text-[#829ab1] block mb-1">Расшифровка при выбранном сдвиге:</span>
                      <span className="text-lg font-bold tracking-wider font-display text-white select-all">
                        {currentDecodedCaesar}
                      </span>
                      <span className="mt-2 block text-[11px] text-parchment-500">
                        Подсказка из записки: верни буквы на 3 шага назад.
                      </span>
                    </div>
                  </div>

                  {!caesarSolved ? (
                    <form onSubmit={submitCaesar} className="space-y-3.5 mt-5">
                      <div>
                        <label className="text-[11px] font-display text-parchment-400 uppercase tracking-wider block mb-1">
                          Какое слово-ключ начертано?
                        </label>
                        <input
                          type="text"
                          placeholder="Наберите слово..."
                          value={caesarInput}
                          onChange={(e) => setCaesarInput(e.target.value)}
                          className="w-full bg-[#060a13] border-2 border-[#1e2d4a] rounded px-3 py-2.5 text-sm text-parchment-100 focus:outline-none focus:border-[#486581] font-display text-center uppercase tracking-widest placeholder:text-parchment-800"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-gradient-to-b from-[#334e68] to-[#102a43] hover:from-[#486581] hover:to-[#334e68] border border-[#243e56] text-parchment-100 py-3 rounded text-xs font-display font-bold tracking-widest transition-all cursor-pointer shadow-md active:translate-y-0.5"
                      >
                        НАЗВАТЬ СЛОВО
                      </button>
                    </form>
                  ) : (
                    <div className="bg-[#486581]/15 border-2 border-dashed border-[#486581]/30 p-4 rounded text-center text-sm font-serif text-parchment-300 space-y-1 mt-4">
                      <CheckCircle2 className="mx-auto text-sky-400 mb-1" size={18} />
                      <p className="font-display font-bold text-parchment-200">Тайна диска Цезаря разгадана!</p>
                      <p className="text-xs text-parchment-500">Ключевое слово БАШНЯ готово для прочтения картины.</p>
                    </div>
                  )}
                </div>
              )}

              {/* SOLVER FOR VIGENERE */}
              {activeRiddle === 'vigenere' && (
                <div className="space-y-6 flex flex-col h-full justify-between">
                  <div>
                    <span className="text-[10px] font-display text-parchment-500 uppercase tracking-widest block font-bold mb-1">
                      Многоалфавитный Шифр Виженера
                    </span>
                    <h3 className="text-xl font-display font-bold text-parchment-200 border-b border-parchment-900/30 pb-2">
                      Полотно Алхимика
                    </h3>

                    <div className="bg-gradient-to-b from-[#121d33] to-[#0a1120] border-2 border-[#1e2d4a] rounded p-4 text-sm font-serif text-parchment-200 italic leading-relaxed mt-4 shadow-inner relative">
                      Под вековым портретом великого ученого высечены руны:
                      <span className="text-parchment-200 font-display font-bold block text-center my-2 text-base tracking-widest not-italic">
                        {VIGENERE_CIPHER_TEXT.toLowerCase()}
                      </span>
                      Это не один сдвиг, как у Цезаря. Здесь каждая буква открывается своей буквой ключа.
                    </div>

                    <div className="space-y-3 mt-4">
                      <div>
                        <label className="text-[11px] font-display text-parchment-400 uppercase tracking-wider block mb-1">
                          Заветное слово-ключ (из тумбочки)
                        </label>
                        <input
                          type="text"
                          disabled={vigenereSolved}
                          placeholder="Введите найденное слово-ключ..."
                          value={vigenereKey}
                          onChange={(e) => {
                            setVigenereKey(e.target.value.toUpperCase());
                            setVigenereStep(0);
                            setVigenerePlaying(false);
                            if (e.target.value.toUpperCase().replace(/Ё/g, 'Е').replace(/[^А-Я]/g, '') === VIGENERE_EXPECTED_KEY) {
                                triggerAudio('🔑 Раздался звон! Замок рамы поддался.');
                            }
                          }}
                          className="w-full bg-[#060a13] border-2 border-[#1e2d4a] rounded px-3 py-2.5 text-sm text-parchment-100 focus:outline-none focus:border-[#486581] font-display text-center uppercase tracking-widest placeholder:text-parchment-800 disabled:opacity-60"
                        />
                      </div>
                    </div>

                    {vigenereHasKey && currentVigenereRow && (
                      <div className="mt-5 space-y-4 animate-fade-in">
                        <div className="rounded border-2 border-[#1e2d4a] bg-gradient-to-br from-[#121d33] to-[#0a1120] p-4 shadow-md">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <span className="block text-[10px] uppercase font-display font-bold tracking-wider text-[#829ab1]">
                              Таблица Виженера
                            </span>
                            <span className="text-[10px] font-display text-parchment-500">
                              Шаг {vigenereStep + 1} из {vigenereLetterRows.length}
                            </span>
                          </div>

                          <div className="overflow-auto rounded border border-[#1e2d4a] bg-[#060a13] p-2 max-h-80">
                            <table className="border-separate border-spacing-1 text-center font-mono text-[9px]">
                              <thead>
                                <tr>
                                  <th className="sticky left-0 top-0 z-20 h-6 w-6 rounded bg-[#102a43] text-parchment-500">
                                    К
                                  </th>
                                  {RUSSIAN_ALPHABET.split('').map((letter, colIndex) => (
                                    <th
                                      key={`vig-head-${letter}`}
                                      className={`sticky top-0 z-10 h-6 min-w-6 rounded px-1 font-bold ${
                                        colIndex === currentVigenerePlainIndex
                                          ? 'bg-emerald-700 text-white shadow'
                                          : 'bg-[#102a43] text-parchment-400'
                                      }`}
                                    >
                                      {letter}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {RUSSIAN_ALPHABET.split('').map((rowLetter, rowIndex) => (
                                  <tr key={`vig-row-${rowLetter}`}>
                                    <th
                                      className={`sticky left-0 z-10 h-6 min-w-6 rounded px-1 font-bold ${
                                        rowIndex === currentVigenereKeyIndex
                                          ? 'bg-sky-700 text-white shadow'
                                          : 'bg-[#102a43] text-parchment-400'
                                      }`}
                                    >
                                      {rowLetter}
                                    </th>
                                    {RUSSIAN_ALPHABET.split('').map((_, colIndex) => {
                                      const cellLetter = RUSSIAN_ALPHABET[(rowIndex + colIndex) % RUSSIAN_ALPHABET.length];
                                      const isKeyRow = rowIndex === currentVigenereKeyIndex;
                                      const isPlainColumn = colIndex === currentVigenerePlainIndex;
                                      const isCipherCell = isKeyRow && isPlainColumn;

                                      return (
                                        <td
                                          key={`vig-cell-${rowIndex}-${colIndex}`}
                                          className={`h-6 min-w-6 rounded px-1 font-bold transition-colors ${
                                            isCipherCell
                                              ? 'bg-sky-300 text-[#06101d] ring-2 ring-emerald-300'
                                              : isKeyRow || isPlainColumn
                                                ? 'bg-[#1e2d4a] text-parchment-100'
                                                : 'bg-[#0a1120] text-parchment-600'
                                          }`}
                                        >
                                          {cellLetter}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="mt-3 space-y-1.5 rounded border border-[#243e56] bg-[#060a13] p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setVigenereStep((prev) => (
                                      prev >= vigenereLetterRows.length - 1 ? 0 : prev
                                    ));
                                    setVigenerePlaying(true);
                                  }}
                                  disabled={vigenerePlaying}
                                  className="inline-flex items-center gap-1.5 rounded border border-[#486581] bg-[#102a43] px-2.5 py-1.5 text-[10px] font-display font-bold uppercase tracking-wider text-sky-100 transition hover:bg-[#1e2d4a] disabled:cursor-not-allowed disabled:opacity-45"
                                >
                                  <Play size={12} />
                                  Пуск
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setVigenerePlaying(false)}
                                  disabled={!vigenerePlaying}
                                  className="inline-flex items-center gap-1.5 rounded border border-[#243e56] bg-[#0a1120] px-2.5 py-1.5 text-[10px] font-display font-bold uppercase tracking-wider text-parchment-300 transition hover:bg-[#121d33] disabled:cursor-not-allowed disabled:opacity-45"
                                >
                                  <Pause size={12} />
                                  Стоп
                                </button>
                              </div>
                              <span className="text-[10px] font-display uppercase tracking-wider text-parchment-500">
                                ключ {currentVigenereRow.keyLetter} / шифр {currentVigenereRow.cipherLetter} / итог {currentVigenereRow.plainLetter}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max={Math.max(vigenereLetterRows.length - 1, 0)}
                              value={Math.min(vigenereStep, Math.max(vigenereLetterRows.length - 1, 0))}
                              onChange={(e) => {
                                setVigenerePlaying(false);
                                setVigenereStep(Number(e.target.value));
                              }}
                              className="w-full accent-[#93c5fd] cursor-pointer h-1.5 bg-[#1e2d4a] rounded"
                            />
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-[#121d33] to-[#0a1120] border border-[#1e2d4a] p-3.5 rounded text-center shadow-sm">
                          <span className="text-[10px] font-display text-parchment-400 block mb-1">
                            {vigenereKeyReady ? 'Скрытое послание на холсте:' : 'Пробная расшифровка:'}
                          </span>
                          <span className={`text-sm font-bold font-display tracking-wider ${vigenereKeyReady ? 'text-sky-300' : 'text-parchment-400'}`}>
                            {currentVigenerePreview}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {vigenereKeyReady && (
                    <div className="pt-4 border-t border-parchment-900/30">
                      {!vigenereSolved ? (
                        <form onSubmit={submitVigenere} className="space-y-3.5">
                          <div>
                            <label className="text-[11px] font-display text-parchment-400 uppercase tracking-wider block mb-1">
                              Подтвердите разгаданную часть (числом или словом)
                            </label>
                            <input
                              type="text"
                              placeholder="Наберите число или слово..."
                              value={vigenereInput}
                              onChange={(e) => setVigenereInput(e.target.value)}
                              className="w-full bg-[#060a13] border-2 border-[#1e2d4a] rounded px-3 py-2.5 text-sm text-parchment-100 focus:outline-none focus:border-[#486581] font-display text-center uppercase tracking-widest placeholder:text-parchment-800"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full bg-gradient-to-b from-[#334e68] to-[#102a43] hover:from-[#486581] hover:to-[#334e68] border border-[#243e56] text-parchment-100 py-3 rounded text-xs font-display font-bold tracking-widest transition-all cursor-pointer shadow-md active:translate-y-0.5"
                          >
                            ПОДТВЕРДИТЬ
                          </button>
                        </form>
                      ) : (
                        <div className="bg-[#486581]/15 border-2 border-dashed border-[#486581]/30 p-4 rounded text-center text-sm font-serif text-parchment-300 space-y-1">
                          <CheckCircle2 className="mx-auto text-sky-400 mb-1" size={18} />
                          <p className="font-display font-bold text-parchment-200">Тайна портрета раскрыта!</p>
                          <p className="text-xs text-parchment-500 font-mono">Запомните первую половину кода двери: 47</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SOLVER FOR SCYTALE */}
              {activeRiddle === 'scytale' && (
                <div className="space-y-6 flex flex-col h-full justify-between">
                  <div>
                    <span className="text-[10px] font-display text-parchment-500 uppercase tracking-widest block font-bold mb-1">
                      Древний шифр перестановки Сцитала
                    </span>
                    <h3 className="text-xl font-display font-bold text-parchment-200 border-b border-parchment-900/30 pb-2">
                      Резной дубовый цилиндр
                    </h3>

                    <div className="bg-gradient-to-b from-[#121d33] to-[#0a1120] border-2 border-[#1e2d4a] rounded p-4 text-sm font-serif text-parchment-200 italic leading-relaxed mt-4 shadow-inner relative">
                      «Буквы будто ждут, когда их намотают на что-то круглое». Меняйте толщину цилиндра (диаметр рукояти), чтобы совместить витки ремня.
                    </div>

                    <div className="space-y-4.5 mt-5">
                      {/* Ribbon flat representation (leather strip visualizer) */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-display font-bold text-parchment-400 block">
                          Кожаная лента (в размотанном виде):
                        </span>
                        <div className="bg-[#060a13] border border-[#1e2d4a] rounded p-2.5 flex gap-1 justify-center flex-wrap font-mono text-[11px] text-sky-300 font-bold tracking-widest">
                          {'ВЯТДТ_ЬАОЧ__РАК1АСО9'.split('').map((char, cidx) => (
                            <span key={cidx} className="bg-[#121d33] px-1 rounded border border-[#1e2d4a] shadow-md">
                              {char}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3 bg-[#060a13] p-3 rounded-md border border-parchment-950">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-mono text-parchment-500">
                            <span>Ключ сциталы / диаметр: {scytaleDiameter}</span>
                            <span>букв на виток: {scytaleDiameter}</span>
                          </div>
                          <input
                            type="range"
                            min="2"
                            max="10"
                            value={scytaleDiameter}
                            onChange={(e) => {
                              setScytaleDiameter(Number(e.target.value));
                              triggerAudio('🔊 Поскрипывает натянутая кожа ремня...');
                            }}
                            className="w-full accent-[#486581] cursor-pointer h-1.5 bg-[#1e2d4a] rounded"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-mono text-parchment-500">
                            <span>Поворот рукояти: {scytaleRotation}°</span>
                            <span>видимая сторона</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="355"
                            step="5"
                            value={scytaleRotation}
                            onChange={(e) => setScytaleRotation(Number(e.target.value))}
                            className="w-full accent-[#93c5fd] cursor-pointer h-1.5 bg-[#1e2d4a] rounded"
                          />
                        </div>
                      </div>

                      {/* Visual rendering of the cylinder wrapping */}
                      <div className="space-y-2 mt-4">
                        <span className="text-[10px] uppercase font-display font-bold text-parchment-400 block">
                          Вид сциталы на круглой рукояти:
                        </span>
                        
                        <div className="relative overflow-hidden rounded-lg border-4 border-[#1e2d4a] bg-[#060a13] p-4 shadow-2xl">
                          {(() => {
                            const word = 'ВЯТДТ_ЬАОЧ__РАК1АСО9';
                            const numCols = scytaleDiameter;
                            const width = 420;
                            const height = 230;
                            const cylinderX = 42;
                            const cylinderWidth = 336;
                            const cylinderHeight = 56 + scytaleDiameter * 9;
                            const cylinderY = (height - cylinderHeight) / 2;
                            const cylinderCenterY = cylinderY + cylinderHeight / 2;
                            const cylinderRadius = cylinderHeight / 2;
                            const endCapRx = Math.max(16, cylinderHeight * 0.22);
                            const rotationAngle = scytaleRotation;
                            const rotationRad = (rotationAngle * Math.PI) / 180;
                            const markerX = cylinderX + cylinderWidth + endCapRx * 0.58;
                            const markerY = cylinderCenterY;
                            const totalTurns = word.length / numCols;
                            const strapWidth = Math.min(18, Math.max(10, cylinderHeight / (numCols + 3)));
                            const frontLimit = 0.02;
                            const sampleCount = 180;
                            const isSolvedDiameter = scytaleDiameter === 5;
                            const makePoint = (progress: number) => {
                              const angle = progress * totalTurns * Math.PI * 2 + rotationRad;
                              return {
                                x: cylinderX + 28 + progress * (cylinderWidth - 56),
                                y: cylinderCenterY + Math.sin(angle) * cylinderRadius * 0.62,
                                front: Math.cos(angle),
                              };
                            };
                            const ribbonPoints = Array.from({ length: sampleCount }, (_, idx) => makePoint(idx / (sampleCount - 1)));
                            const splitSegments = (frontSide: boolean) => {
                              const segments: Array<Array<{ x: number; y: number; front: number }>> = [];
                              let current: Array<{ x: number; y: number; front: number }> = [];

                              ribbonPoints.forEach((point) => {
                                const isFront = point.front >= frontLimit;
                                if (isFront === frontSide) {
                                  current.push(point);
                                } else if (current.length > 1) {
                                  segments.push(current);
                                  current = [];
                                } else {
                                  current = [];
                                }
                              });

                              if (current.length > 1) {
                                segments.push(current);
                              }

                              return segments;
                            };
                            const toPath = (segment: Array<{ x: number; y: number }>) =>
                              segment.map((point, idx) => `${idx === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
                            const visibleLetters = word.split('').map((letter, idx) => {
                              const progress = word.length === 1 ? 0.5 : (idx + 0.5) / word.length;
                              const angle = progress * totalTurns * Math.PI * 2 + rotationRad;
                              return {
                                letter,
                                x: cylinderX + 28 + progress * (cylinderWidth - 56),
                                y: cylinderCenterY + Math.sin(angle) * cylinderRadius * 0.62,
                                front: Math.cos(angle),
                                idx,
                              };
                            }).filter((item) => item.front > 0.34 && item.letter !== '_');
                            const backSegments = splitSegments(false);
                            const frontSegments = splitSegments(true);

                            return (
                              <svg viewBox={`0 0 ${width} ${height}`} className="relative z-10 h-auto w-full">
                                <defs>
                                  <linearGradient id="rodGradient" x1="0" x2="1" y1="0" y2="0">
                                    <stop offset="0%" stopColor="#050913" />
                                    <stop offset="16%" stopColor="#334e68" />
                                    <stop offset="50%" stopColor="#102a43" />
                                    <stop offset="84%" stopColor="#334e68" />
                                    <stop offset="100%" stopColor="#050913" />
                                  </linearGradient>
                                  <linearGradient id="strapGradient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#37516c" />
                                    <stop offset="50%" stopColor="#132236" />
                                    <stop offset="100%" stopColor="#081120" />
                                  </linearGradient>
                                  <filter id="softShadow" x="-20%" y="-40%" width="140%" height="180%">
                                    <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#000000" floodOpacity="0.45" />
                                  </filter>
                                </defs>

                                <rect x="0" y="0" width={width} height={height} rx="12" fill="#060a13" />
                                <ellipse
                                  cx={cylinderX}
                                  cy={cylinderCenterY}
                                  rx={endCapRx}
                                  ry={cylinderRadius}
                                  fill="#050913"
                                  stroke="#486581"
                                  strokeOpacity="0.55"
                                  style={{ transition: 'all 0.35s ease' }}
                                />
                                <rect
                                  x={cylinderX}
                                  y={cylinderY}
                                  width={cylinderWidth}
                                  height={cylinderHeight}
                                  rx={cylinderRadius}
                                  fill="url(#rodGradient)"
                                  stroke="#486581"
                                  strokeOpacity="0.45"
                                  filter="url(#softShadow)"
                                  style={{ transition: 'all 0.35s ease' }}
                                />
                                <ellipse
                                  cx={cylinderX + cylinderWidth}
                                  cy={cylinderCenterY}
                                  rx={endCapRx}
                                  ry={cylinderRadius}
                                  fill="#07111f"
                                  stroke="#486581"
                                  strokeOpacity="0.55"
                                  style={{ transition: 'all 0.35s ease' }}
                                />
                                <path
                                  d={`M ${cylinderX + 32} ${cylinderY + cylinderHeight * 0.24} C ${cylinderX + 120} ${cylinderY + cylinderHeight * 0.06}, ${cylinderX + 225} ${cylinderY + cylinderHeight * 0.06}, ${cylinderX + cylinderWidth - 28} ${cylinderY + cylinderHeight * 0.24}`}
                                  stroke="#ffffff"
                                  strokeOpacity="0.08"
                                  strokeWidth="6"
                                  fill="none"
                                  style={{ transition: 'all 0.35s ease' }}
                                />
                                <g opacity="0.25">
                                  {backSegments.map((segment, idx) => (
                                    <path
                                      key={`back-strap-${idx}`}
                                      d={toPath(segment)}
                                      stroke="#081120"
                                      strokeWidth={strapWidth}
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      fill="none"
                                    />
                                  ))}
                                </g>
                                <g opacity="0.45">
                                  {backSegments.map((segment, idx) => (
                                    <path
                                      key={`back-edge-${idx}`}
                                      d={toPath(segment)}
                                      stroke="#1e2d4a"
                                      strokeWidth={Math.max(2, strapWidth * 0.22)}
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      fill="none"
                                    />
                                  ))}
                                </g>
                                <g>
                                  {frontSegments.map((segment, idx) => (
                                    <path
                                      key={`front-strap-${idx}`}
                                      d={toPath(segment)}
                                      stroke="url(#strapGradient)"
                                      strokeWidth={strapWidth}
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      fill="none"
                                      opacity="0.96"
                                    />
                                  ))}
                                  {frontSegments.map((segment, idx) => (
                                    <path
                                      key={`front-highlight-${idx}`}
                                      d={toPath(segment)}
                                      stroke="#93c5fd"
                                      strokeWidth="1"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      fill="none"
                                      strokeOpacity="0.2"
                                    />
                                  ))}
                                </g>
                                {visibleLetters.map((item) => (
                                  <g key={`scytale-letter-${item.idx}`} opacity={0.7 + item.front * 0.3}>
                                    <circle
                                      cx={item.x}
                                      cy={item.y}
                                      r={isSolvedDiameter ? 10 : 8}
                                      fill="#060a13"
                                      stroke="#486581"
                                      strokeOpacity="0.55"
                                    />
                                    <text
                                      x={item.x}
                                      y={item.y}
                                      textAnchor="middle"
                                      dominantBaseline="central"
                                      className={`font-display font-bold ${isSolvedDiameter ? 'fill-sky-100' : 'fill-parchment-300'}`}
                                      fontSize={isSolvedDiameter ? 14 : 11}
                                    >
                                      {item.letter}
                                    </text>
                                  </g>
                                ))}
                                <g
                                  transform={`rotate(${rotationAngle} ${cylinderX + cylinderWidth} ${cylinderCenterY})`}
                                  style={{
                                    transformOrigin: `${cylinderX + cylinderWidth}px ${cylinderCenterY}px`,
                                    transition: 'all 0.35s ease',
                                  }}
                                >
                                  <ellipse
                                    cx={cylinderX + cylinderWidth}
                                    cy={cylinderCenterY}
                                    rx={endCapRx * 0.66}
                                    ry={cylinderRadius * 0.66}
                                    fill="none"
                                    stroke="#93c5fd"
                                    strokeOpacity="0.2"
                                    strokeDasharray="5 5"
                                  />
                                  <line
                                    x1={cylinderX + cylinderWidth}
                                    y1={cylinderCenterY}
                                    x2={markerX}
                                    y2={markerY}
                                    stroke="#93c5fd"
                                    strokeOpacity="0.5"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                  />
                                  <circle cx={markerX} cy={markerY} r="4.5" fill="#93c5fd" stroke="#dbeafe" strokeWidth="1.5" />
                                  <circle cx={cylinderX + cylinderWidth} cy={cylinderCenterY} r="3" fill="#dbeafe" opacity="0.8" />
                                </g>

                              </svg>
                            );
                          })()}
                        </div>
                        <p className="text-center text-[11px] font-serif italic text-parchment-500">
                          Лента намотана вокруг рукояти: задняя часть скрыта, а буквы читаются только на переднем витке при вращении.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-parchment-900/30">
                    {!scytaleSolved ? (
                      <form onSubmit={submitScytale} className="space-y-3.5">
                        <div>
                          <label className="text-[11px] font-display text-parchment-400 uppercase tracking-wider block mb-1">
                            Назовите угаданное послание (или число)
                          </label>
                          <input
                            type="text"
                            placeholder="Введите число или текст..."
                            value={scytaleInput}
                            onChange={(e) => setScytaleInput(e.target.value)}
                            className="w-full bg-[#060a13] border-2 border-[#1e2d4a] rounded px-3 py-2.5 text-sm text-parchment-100 focus:outline-none focus:border-[#486581] font-display text-center uppercase tracking-widest placeholder:text-parchment-800"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-gradient-to-b from-[#334e68] to-[#102a43] hover:from-[#486581] hover:to-[#334e68] border border-[#243e56] text-parchment-100 py-3 rounded text-xs font-display font-bold tracking-widest transition-all cursor-pointer shadow-md active:translate-y-0.5"
                        >
                          ПОДТВЕРДИТЬ КОД
                        </button>
                      </form>
                    ) : (
                      <div className="bg-[#486581]/15 border-2 border-dashed border-[#486581]/30 p-4 rounded text-center text-sm font-serif text-parchment-300 space-y-1">
                        <CheckCircle2 className="mx-auto text-sky-400 mb-1" size={18} />
                        <p className="font-display font-bold text-parchment-200">Тайна сциталы разгадана!</p>
                        <p className="text-xs text-parchment-500 font-mono">Запомните вторую половину кода двери: 19</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SOLVER FOR LOCK */}
              {activeRiddle === 'lock' && (
                <div className="space-y-6 flex flex-col h-full justify-between">
                  <div>
                    <span className="text-[10px] font-display text-parchment-500 uppercase tracking-widest block font-bold mb-1">
                      Дверной Механический Засов
                    </span>
                    <h3 className="text-xl font-display font-bold text-parchment-200 border-b border-parchment-900/30 pb-2">
                      Кованый Кодовый Замок
                    </h3>

                    <div className="bg-gradient-to-b from-[#121d33] to-[#0a1120] border-2 border-[#1e2d4a] rounded p-4 text-sm font-serif text-parchment-200 italic leading-relaxed mt-4 shadow-inner relative">
                      Тяжелая литая плита из вороненой стали преграждает выход из башни. Зубчатые цилиндры соединены со штифтом засова. Наберите обе части найденного шифра (4 цифры).
                    </div>

                    {/* Numeric Dial Rotators (Realistic heavy metal cylinders) */}
                    <div className="flex justify-center items-center gap-4 py-8">
                      {lockDigits.map((digit, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              changeDigit(idx, 1);
                              triggerAudio('🔊 Сухой щелчок зубьев...');
                            }}
                            className="w-9 h-9 rounded-full border border-[#1e2d4a] bg-[#0a1120] hover:bg-[#121d33] text-sky-400 font-bold flex items-center justify-center cursor-pointer select-none shadow-md hover:text-white"
                          >
                            ▲
                          </button>
                          
                          {/* Dial Cylinder */}
                          <div className="w-16 h-24 rounded bg-gradient-to-b from-[#060a13] via-[#102a43]/40 to-[#060a13] border-2 border-[#486581] flex items-center justify-center text-4xl font-display font-bold text-white shadow-2xl relative overflow-hidden">
                            <span>{digit}</span>
                            {/* Inner horizontal shadow slit for realistic visual depth */}
                            <div className="absolute top-1/2 left-0 right-0 h-[3px] bg-black/60 pointer-events-none"></div>
                            {/* Metallic rivets decoration */}
                            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-black/40"></div>
                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-black/40"></div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              changeDigit(idx, -1);
                              triggerAudio('🔊 Сухой щелчок зубьев...');
                            }}
                            className="w-9 h-9 rounded-full border border-[#1e2d4a] bg-[#0a1120] hover:bg-[#121d33] text-sky-400 font-bold flex items-center justify-center cursor-pointer select-none shadow-md hover:text-white"
                          >
                            ▼
                          </button>
                        </div>
                      ))}
                    </div>

                    {lockError && (
                      <div className="text-xs font-serif text-red-400 text-center italic bg-red-950/20 border-2 border-dashed border-red-900/30 p-2.5 rounded">
                        {lockError}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-parchment-900/30">
                    <button
                      type="button"
                      id="btn-unlock-door"
                      onClick={submitLock}
                      className="w-full bg-gradient-to-b from-[#334e68] to-[#102a43] hover:from-[#486581] hover:to-[#334e68] border border-[#243e56] text-parchment-100 py-3.5 rounded text-sm font-display font-bold tracking-widest transition-all cursor-pointer shadow-lg active:translate-y-0.5"
                    >
                      ОТВОРИТЬ ВРАТА
                    </button>
                  </div>
                </div>
              )}

              {/* EMPTY STATE (Instructions card) */}
              {!activeRiddle && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-4 border-dashed border-[#1e2d4a]/40 rounded-lg bg-[#060a13]/50 my-auto h-4/5 select-none relative animate-fade-in">
                  <Scroll className="text-sky-400 mb-4 animate-pulse" size={44} />
                  <h4 className="text-base font-display font-bold text-sky-300 uppercase tracking-widest mb-2.5">
                    Выберите предмет
                  </h4>
                  <p className="text-sm font-serif text-parchment-400 max-w-xs leading-relaxed italic">
                    Осмотрите шкаф, бюст, картину, дверь или замок, чтобы открыть связанную с ними загадку.
                  </p>
                </div>
              )}

            </div>
          </div>

          {/* ----------------------------------------------------
              Interactive Cryptographer Study / Room (Right Column)
             ---------------------------------------------------- */}
          <div className="min-w-0 flex-1 flex flex-col overflow-hidden bg-[#070b12] relative z-0">
            
            {/* Upper area with beautiful gothic wooden desk layout */}
            <div className="min-h-0 flex-1 p-2 overflow-hidden flex items-stretch justify-stretch relative">
              
              {/* Cozy Room Chamber border Frame */}
              <div className="h-full w-full min-w-0 bg-[#1a1009] border-4 border-[#6f4a25]/70 rounded-xl p-2 shadow-2xl relative overflow-hidden">
                
                {/* Iron rivet details on study frame */}
                <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-sky-400/50"></div>
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-sky-400/50"></div>
                <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-sky-400/50"></div>
                <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-sky-400/50"></div>

                {/* Cozy Candle lighting setup */}
                <div className="hidden">
                  <div className="flex flex-col items-center bg-[#070b12]/40 px-2 py-1 rounded border border-[#101b2e]">
                    <div className="w-2.5 h-6 bg-gradient-to-b from-sky-400 to-[#102a43] rounded-t-xs relative flex items-center justify-center">
                      {/* Burning flame */}
                      <div className="absolute -top-3 w-2 h-4 bg-gradient-to-t from-blue-600 via-sky-400 to-white rounded-full animate-candle blur-[0.5px] shadow-[0_0_8px_rgba(56,189,248,0.8)]"></div>
                    </div>
                    <span className="text-[9px] font-display text-parchment-500 tracking-wider mt-1">Очаг</span>
                  </div>
                </div>

                {/* Interactive medieval study canvas */}
                <div className="relative h-full min-h-0 w-full overflow-hidden rounded-lg border-2 border-[#8a6124]/60 bg-[#130d09] p-1.5 shadow-inner select-none">
                  <div className="pointer-events-none absolute inset-0 rounded-lg shadow-[inset_0_0_34px_rgba(215,184,109,0.16)]"></div>
                  <StudyViewCanvas
                    activeRiddle={activeRiddle}
                    cabinetOpen={cabinetOpen}
                    drawerOpen={drawerOpen}
                    strapTaken={strapTaken}
                    caesarSolved={caesarSolved}
                    vigenereSolved={vigenereSolved}
                    scytaleSolved={scytaleSolved}
                    onCabinetClick={handleCabinetClick}
                    onTakeStrap={handleTakeStrap}
                    onNightstandClick={handleNightstandClick}
                    onPaintingClick={handlePaintingClick}
                    onDoorHandleClick={handleDoorHandleClick}
                    onLockClick={handleLockClick}
                  />
                </div>

                {/* Point-and-Click Interactive Objects Grid */}
                <div className="hidden">
                  
                  {/* Hotspot: Cabinet (Шкаф/Сундук) */}
                  <div 
                    id="cabinet-hotspot"
                    onClick={handleCabinetClick}
                    className={`border-2 rounded-md p-4 flex flex-col justify-between transition-all duration-300 cursor-pointer relative select-none ${
                      cabinetOpen 
                        ? 'bg-[#0f192e]/80 border-[#334e68]/60 shadow-inner' 
                        : 'bg-[#101f30]/30 border-[#1e2d4a]/40 hover:border-[#486581] hover:bg-[#101f30]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Archive className={cabinetOpen ? 'text-sky-400 animate-pulse' : 'text-parchment-700'} size={22} />
                      <span className="text-[9px] font-display text-parchment-600 tracking-wider">Сундук</span>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-display font-bold text-parchment-200">Кованый Шкаф</p>
                      <p className="text-[11px] font-serif text-parchment-500 mt-1 leading-tight">
                        {cabinetOpen 
                          ? (strapTaken ? 'Створки распахнуты. Внутри пусто.' : 'Открыт! Внутри висит кожаный пояс!') 
                          : 'Тяжелый запертый шкаф. Дверцы скрипят.'}
                      </p>
                    </div>

                    {cabinetOpen && !strapTaken && (
                      <button
                        onClick={handleTakeStrap}
                        className="mt-3 bg-gradient-to-b from-[#334e68] to-[#102a43] hover:from-[#486581] hover:to-[#334e68] text-parchment-100 text-[10px] font-display py-1.5 px-2 rounded-sm border border-[#486581] animate-pulse text-center tracking-widest cursor-pointer"
                      >
                        ЗАБРАТЬ ПОЯС
                      </button>
                    )}
                  </div>

                  {/* Hotspot: Nightstand with Caesar Bust */}
                  <div 
                    id="nightstand-hotspot"
                    onClick={handleNightstandClick}
                    className={`border-2 rounded-md p-4 flex flex-col justify-between transition-all duration-300 cursor-pointer relative select-none ${
                      drawerOpen 
                        ? 'bg-[#0f192e]/80 border-[#334e68]/60 shadow-inner' 
                        : 'bg-[#101f30]/30 border-[#1e2d4a]/40 hover:border-[#486581] hover:bg-[#101f30]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Compass className={drawerOpen ? 'text-sky-400' : 'text-parchment-700'} size={22} />
                      <span className="text-[9px] font-display text-parchment-600 tracking-wider">Алтарь</span>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-display font-bold text-parchment-200">Бюст Цезаря</p>
                      <p className="text-[11px] font-serif text-parchment-500 mt-1 leading-tight">
                        {drawerOpen 
                          ? 'Шуфляда выдвинута. Виднеется старый свиток.' 
                          : 'Пьедестал с бюстом римского правителя.'}
                      </p>
                    </div>

                    {drawerOpen && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveRiddle('caesar');
                        }}
                        className="mt-3 bg-[#0a1120] hover:bg-[#121d33] border border-[#1e2d4a] text-sky-400 text-[10px] py-1.5 rounded-sm text-center font-display tracking-wider cursor-pointer"
                      >
                        ЧИТАТЬ СВИТОК
                      </button>
                    )}
                  </div>

                  {/* Hotspot: Painting */}
                  <div 
                    id="painting-hotspot"
                    onClick={handlePaintingClick}
                    className={`border-2 rounded-md p-4 flex flex-col justify-between transition-all duration-300 cursor-pointer relative select-none ${
                      activeRiddle === 'vigenere' 
                        ? 'bg-[#0f192e]/80 border-[#334e68]/60 shadow-inner' 
                        : 'bg-[#101f30]/30 border-[#1e2d4a]/40 hover:border-[#486581] hover:bg-[#101f30]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Key className={vigenereSolved ? 'text-emerald-500' : 'text-parchment-700'} size={22} />
                      <span className="text-[9px] font-display text-parchment-600 tracking-wider">Холст</span>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-display font-bold text-parchment-200">Портрет Алхимика</p>
                      <p className="text-[11px] font-serif text-parchment-500 mt-1 leading-tight">
                        {vigenereSolved 
                          ? 'Картина сдвинута. Тайник отворился: код 47!' 
                          : 'В раму картины врезаны рунические замки.'}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveRiddle('vigenere');
                      }}
                      className="mt-3 bg-[#0a1120] hover:bg-[#121d33] border border-[#1e2d4a] text-sky-400 text-[10px] py-1.5 rounded-sm text-center font-display tracking-wider cursor-pointer"
                    >
                      ИЗУЧИТЬ ПОРТРЕТ
                    </button>
                  </div>

                  {/* Hotspot: Door Handle (Дубовая рукоять) */}
                  <div 
                    id="door-handle-hotspot"
                    onClick={handleDoorHandleClick}
                    className={`border-2 rounded-md p-4 flex flex-col justify-between transition-all duration-300 cursor-pointer relative select-none ${
                      activeRiddle === 'scytale' 
                        ? 'bg-[#0f192e]/80 border-[#334e68]/60 shadow-inner' 
                        : 'bg-[#101f30]/30 border-[#1e2d4a]/40 hover:border-[#486581] hover:bg-[#101f30]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <RefreshCw className={scytaleSolved ? 'text-emerald-500 animate-spin-slow' : 'text-parchment-700'} size={22} />
                      <span className="text-[9px] font-display text-parchment-600 tracking-wider">Запор</span>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-display font-bold text-parchment-200">Дубовый Засов</p>
                      <p className="text-[11px] font-serif text-parchment-500 mt-1 leading-tight">
                        {scytaleSolved 
                          ? 'Пояс намотан на дерево. Раскрыт код 19!' 
                          : 'Круглая рукоять, обточенная мастером.'}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveRiddle('scytale');
                      }}
                      className="mt-3 bg-[#0a1120] hover:bg-[#121d33] border border-[#1e2d4a] text-sky-400 text-[10px] py-1.5 rounded-sm text-center font-display tracking-wider cursor-pointer"
                    >
                      {strapTaken ? 'НАМОТАТЬ ПОЯС' : 'ОСМОТРЕТЬ РУКОЯТЬ'}
                    </button>
                  </div>

                  {/* Hotspot: Combination Lock */}
                  <div 
                    id="lock-hotspot"
                    onClick={handleLockClick}
                    className={`border-2 rounded-md p-4 flex flex-col justify-between transition-all duration-300 cursor-pointer relative select-none ${
                      activeRiddle === 'lock' 
                        ? 'bg-[#0f192e]/80 border-[#334e68]/60 shadow-inner' 
                        : 'bg-[#101f30]/30 border-[#1e2d4a]/40 hover:border-[#486581] hover:bg-[#101f30]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Lock className="text-parchment-750" size={22} />
                      <span className="text-[9px] font-display text-parchment-600 tracking-wider">Код</span>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-display font-bold text-parchment-200">Кодовый Стык</p>
                      <p className="text-[11px] font-serif text-parchment-500 mt-1 leading-tight">
                        Массивная чугунная пластина блокирует петли.
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveRiddle('lock');
                      }}
                      className="mt-3 bg-gradient-to-r from-[#102a43] to-[#0a1120] hover:from-[#334e68] border border-[#243e56] text-parchment-200 text-[10px] py-1.5 rounded-sm text-center font-display tracking-wider cursor-pointer shadow-md"
                    >
                      НАБРАТЬ ШИФР
                    </button>
                  </div>

                </div>

              </div>

            </div>

            {/* ----------------------------------------------------
                Inventory Bar (Инвентарь с коваными ячейками)
               ---------------------------------------------------- */}
            <div className="h-14 shrink-0 bg-[#09111e] border-t border-b border-[#1e2d4a] px-4 flex items-center gap-3 select-none">
              <span className="text-xs font-display font-bold text-sky-400 uppercase tracking-widest block">
                Инвентарь:
              </span>
              
              <div className="flex-1 flex gap-3 overflow-x-auto py-1">
                {inventory.length > 0 ? (
                  inventory.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-[#101f30] border-2 border-[#334e68]/50 rounded px-4 py-1.5 text-xs font-serif text-parchment-200 flex items-center gap-2.5 shadow-md"
                      title="Кожаный ремень со странными рунами. Намотайте его на дубовую рукоять двери."
                    >
                      <FileText size={14} className="text-sky-400 animate-pulse" />
                      <span className="font-display text-[11px] font-bold tracking-wider">Кожаный пояс</span>
                      <span className="text-[9px] text-sky-500 font-mono">(ВЯТДТ...)</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs font-serif text-parchment-600 italic flex items-center gap-1.5">
                    ✠ Ячейки вашей сумы пусты. Исследуйте замок...
                  </span>
                )}
              </div>

              {/* Reset Game button in inventory area */}
              <button
                onClick={handleReset}
                className="text-[11px] font-display text-parchment-600 hover:text-red-400 flex items-center gap-1 bg-[#040810] hover:bg-red-950/20 border border-[#101b2e] hover:border-red-900/30 px-3 py-1.5 rounded-sm cursor-pointer transition-all active:translate-y-0.5"
              >
                <RotateCcw size={12} />
                <span>Отречься</span>
              </button>
            </div>

            {/* ----------------------------------------------------
                Chronological actions log console (Ledger Book Look)
               ---------------------------------------------------- */}
            <div className="h-44 shrink-0 bg-[#040810] p-3 font-serif text-xs overflow-y-auto space-y-1 select-text border-t-2 border-[#1e2d4a]">
              <span className="text-[10px] font-display uppercase font-bold text-parchment-600 block mb-1.5 tracking-wider">
                Летопись действий в башне:
              </span>
              {logs.map((log, lidx) => (
                <div key={lidx} className="text-parchment-400 flex gap-2 items-start leading-relaxed text-xs md:text-sm">
                  <span className="text-parchment-600 font-bold shrink-0 select-none">❧</span>
                  <span className={lidx === 0 ? 'text-parchment-200 font-bold' : ''}>{log}</span>
                </div>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* ----------------------------------------------------
          4. VICTORY SCREEN (Победный экран)
         ---------------------------------------------------- */}
      {currentScreen === 'victory' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center max-w-xl mx-auto space-y-8 z-10 animate-fade-in relative">
          
          <div className="w-24 h-24 rounded-full border-4 border-sky-400 bg-[#0a1120] flex items-center justify-center text-sky-400 mx-auto shadow-2xl animate-pulse">
            <Unlock size={48} />
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-display font-bold text-sky-400 tracking-wider drop-shadow-md">
              Свобода Обретена!
            </h2>
            <div className="h-0.5 w-24 bg-[#1e2d4a] mx-auto"></div>
            <p className="text-2xl font-serif text-parchment-200 italic">
              «Башня отпускает тех, кто сумел прочесть сокрытое»
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#0e1626] via-[#101f30] to-[#070b12] border-4 border-[#334e68]/60 p-8 rounded shadow-2xl text-parchment-200 text-base leading-relaxed font-serif space-y-5">
            <p className="text-justify text-parchment-200">
              Тяжелая засовная створка с грохотом рухнула, открывая спасительный проход наружу. Хлынувший ночной воздух наполнил легкие прохладой свободы, а бледные лучи лунного диска осветили дорогу через старинный арочный мост.
            </p>
            <p className="text-justify text-parchment-200 font-bold">
              Вы превзошли великие исторические умы древности! Логические каноны Гая Юлия Цезаря, Блеза Виженера и полководцев Лакедемона послужили вашим золотым щитом и мечом. Врата криптографии отворились перед вашей мудростью!
            </p>
          </div>

          <button
            onClick={handleReset}
            className="bg-gradient-to-b from-[#334e68] to-[#102a43] hover:from-[#486581] hover:to-[#334e68] border-2 border-[#243e56] text-parchment-100 font-display font-bold py-3.5 px-10 rounded tracking-widest transition-all cursor-pointer shadow-2xl transform hover:-translate-y-0.5 active:translate-y-0"
          >
            ВНОВЬ ИСПЫТАТЬ СУДЬБУ
          </button>
        </div>
      )}

      {/* ----------------------------------------------------
          Wiki Panel Overlay Modal (Grimoire Codex)
         ---------------------------------------------------- */}
      {wikiOpen && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setWikiOpen(false);
            }
          }}
        >
          <div className="w-full max-w-5xl h-[85vh] rounded-xl overflow-hidden shadow-2xl flex flex-col relative">
            <button
              id="wiki-close-btn"
              type="button"
              aria-label="Закрыть энциклопедию"
              onClick={() => setWikiOpen(false)}
              className="absolute right-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-parchment-500/50 bg-[#060a13]/95 text-parchment-200 shadow-2xl transition-all hover:border-sky-300 hover:bg-[#102a43] hover:text-white active:scale-95"
            >
              <X size={20} />
            </button>
            <WikiPanel onClose={() => setWikiOpen(false)} />
          </div>
        </div>
      )}

    </div>
  );
}
