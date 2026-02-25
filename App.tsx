
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

type GameState = 'BOOT' | 'PLAYING' | 'ACCESS_GRANTED' | 'FINAL_ROUND' | 'VAULT_LOCK' | 'VICTORY' | 'GAMEOVER';

const TOTAL_TIME = 180;

interface Level {
  id: number;
  title: string;
  type: string;
  question: string;
  answer: string;
}

// SIGNIFICANTLY HARDER QUESTION POOLS
const POOLS: Level[][] = [
  // LEVEL 1: Advanced Mathematical Patterns (Polynomials & Shifts)
  [
    { id: 1, title: "SEQUENCE SIGMA", type: "Pattern Recognition", question: "Gap variance detected: 2, 12, 36, 80, 150, ... Find the next integer.", answer: "252" }, // n^3 + n^2
    { id: 1, title: "PRIME OFFSET", type: "Pattern Recognition", question: "Modular shift: 3, 10, 29, 66, 127, ... Identify the next node.", answer: "218" }, // n^3 + 2
    { id: 1, title: "RECURSIVE DEPTH", type: "Pattern Recognition", question: "Identify the pattern: 1, 4, 13, 40, 121, ...", answer: "364" }, // 3n + 1
    { id: 1, title: "DELTA ARRAY", type: "Pattern Recognition", question: "Analyze: 6, 24, 60, 120, 210, ... Find the next limit.", answer: "336" }, // n(n+1)(n+2) starting at n=1, or n^3 - n
    { id: 1, title: "BINARY GROWTH", type: "Pattern Recognition", question: "Sequence: 1, 3, 7, 15, 31, 63, ...", answer: "127" }, // 2^n - 1
    { id: 1, title: "BINARY GROWTH", type: "Pattern Recognition", question: "Sequence: 2, 6, 15, 35, 77, ... Find the next integer.", answer: "143" }, // product of the consecutive primes
    { id: 1, title: "BINARY GROWTH", type: "Pattern Recognition", question: "Sequence: 1, 2, 4, 7, 11, ... Find the next integer.", answer: "16" }, //+1, +2, +3, +4, +5
    { id: 1, title: "BINARY GROWTH", type: "Pattern Recognition", question: "Sequence: 2, 5, 10, 17, 26, ... Find the next integer.", answer: "37" } // n^2 + 1
  ],
  // LEVEL 2: Complex Set & Constraint Logic
  [
    { id: 2, title: "THE OVERLAP", type: "Logical Constraints", question: "In a tech group of 100, 85 have a phone, 75 have a laptop. What is the absolute MINIMUM number of members who MUST have both?", answer: "60" },
    { id: 2, title: "CLOCK LOGIC", type: "Situational Logic", question: "The hands of a clock are perfectly aligned at 12:00. At 3:15, what is the exact degree of the angle between the hour and minute hand?", answer: "7.5" },
    { id: 2, title: "TRUTH PARADOX", type: "Deduction", question: "A says: 'Exactly two of us are lying.' B says: 'Exactly one of us is lying.' C says: 'Exactly zero of us are lying.' Who is telling the truth?", answer: "B" },
    { id: 2, title: "COLOR GRID", type: "Constraint Logic", question: "Four hats: Red, Blue, Green, Yellow. The Green hat is somewhere to the left of the Red hat. The Yellow hat is next to the Blue hat. The Blue hat is at an edge. If the Red hat is not at an edge, what is the hat in the 3rd position?", answer: "Red" },
    { id: 2, title: "DICE CONSTANT", type: "Logic", question: "A standard 6-sided die is rolled. If the top faces are 1, 2, and 3, what is the sum of the bottom faces?", answer: "15" }, // 7-n logic: 6+5+4
    { id: 2, title: "VOID FREQUENCY", type: "Abstract Logic", question: "I am once in a minute, twice in a moment, but never in a thousand years. What am I?", answer: "M" },
  ],
  // LEVEL 3: Deep Symbolic & Scientific Logic
  [
    { id: 3, title: "ATOMIC DRIFT", type: "Cryptic Sequence", question: "Decipher the elemental flow: H, He, Li, Be, B, C, N, ...", answer: "O" }, // Periodic table
    { id: 3, title: "PLANETARY NODE", type: "Sequence Logic", question: "M, V, E, M, J, S, U, ... What is the final terrestrial coordinate?", answer: "N" }, // Planets
    { id: 3, title: "KEYBOARD SHIFT", type: "Sequence Logic", question: "Z, X, C, V, B, ...", answer: "N" }, // Bottom row QWERTY
    { id: 3, title: "LOOK-AND-SAY", type: "Meta-Logic", question: "Describe the previous: 1, 11, 21, 1211, 111221, ...", answer: "312211" },
    { id: 3, title: "FACTORIAL STEP", type: "Mathematical Logic", question: "Sequence: 1, 2, 6, 24, 120, ...", answer: "720" },
    { id: 3, title: "INFINITUS LOCK", type: "Meta-Deduction", question: "If there are 3 apples and you take away 2, how many apples do YOU have?", answer: "2" },
  ],
  // LEVEL 4: Multi-Step Deduction
  [
    { id: 4, title: "SIBLING RATIO", type: "Deduction", question: "Each boy in a family has as many sisters as brothers, but each girl has only half as many sisters as brothers. How many brothers are there?", answer: "4" },
    { id: 4, title: "RACE PROTOCOL", type: "Deduction", question: "In a race, you overtake the person in 2nd place. What place are you in now?", answer: "2" },
    { id: 4, title: "CALENDAR LOGIC", type: "Logic", question: "If the day before yesterday was three days after Monday, what day is today?", answer: "Friday" },
    { id: 4, title: "TIME SYMMETRY", type: "Logic", question: "How many times do the hands of a clock overlap in a 24-hour period?", answer: "22" },
    { id: 4, title: "EQUATION TRAP", type: "Logic", question: "If 1=5, 2=25, 3=125, 4=625, then 5=?", answer: "1" },
    { id: 5, title: "NUMERICAL DEPTH", type: "Logic", question: "How many times can you subtract 10 from 100?", answer: "1" }, // Because next time it's from 90
  ]
];

const VAULT_POOL: Level[] = [
  { id: 5, title: "SHADOW KEY", type: "Cipher", question: "Decode A1Z26: 12-1-19-20 12-15-3-11", answer: "LAST LOCK" },
  { id: 5, title: "ETERNAL CODE", type: "Cipher", question: "Decode A1Z26: 9-14-6-9-14-9-20-21-19", answer: "INFINITUS" },
  { id: 5, title: "CAMPUS BREACH", type: "Cipher", question: "Decode A1Z26: 8-1-3-11 19-18-13", answer: "HACK SRM" },
  { id: 5, title: "ULTIMATE EVENT", type: "Cipher", question: "Decode A1Z26: 2-5-19-20 6-5-19-20", answer: "BEST FEST" },
  { id: 5, title: "CROSS PROTOCOL", type: "Cipher", question: "Decode A1Z26: 2-5-18-26-9 24 14-20-12", answer: "BERZI X NTL" },
  { id: 5, title: "MIRROR DATA", type: "Lateral Thinking", question: "What is 3/7 chicken, 2/3 cat, and 2/4 goat?", answer: "Chicago" }, // Chi (3/7), Ca (2/3), Go (2/4)
  { id: 5, title: "THE TRIPLE T", type: "Meta-Deduction", question: "What begins with T, ends with T, and has T in it?", answer: "Teapot" },
  { id: 5, title: "THE 28-DAY ILLUSION", type: "Meta-Deduction", question: "How many months have 28 days?", answer: "12" },
  { id: 5, title: "THE TRIPLE T", type: "Meta-Deduction", question: "What comes once in a second, twice in a decade, and never in a century?", answer: "D" },
  { id: 5, title: "THE INVISIBLE VOICE", type: "Meta-Deduction", question: "I speak without a mouth and hear without ears. What am I?", answer: "echo" }
];

/**
 * Refined Math Club Logo
 * Combination of Σ, Δ, λ, π symbols in a 360-degree rotating circular badge.
 */
const MathClubLogo = () => {
  return (
    <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
      {/* Rotating Circular Ring */}
      <div className="absolute inset-0 border-4 border-red-600 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-sm animate-spin-slow">
        {/* Decorative inner notches */}
        <div className="absolute inset-1 border border-dashed border-white/30 rounded-full"></div>
      </div>
      
      {/* Centered Overlapping Symbols */}
      <div className="relative flex items-center justify-center">
        <span className="font-syncopate font-black text-red-600 text-3xl opacity-90 select-none" style={{ textShadow: '0 0 10px rgba(255,0,0,0.6)' }}>Δ</span>
        <span className="absolute font-syncopate font-black text-cyan-400 text-xl translate-x-1 translate-y-1 opacity-80 select-none">Σ</span>
        <span className="absolute font-charter font-black text-purple-500 text-sm -translate-x-3 -translate-y-2 opacity-80 select-none">λ</span>
      </div>
      
      {/* Tooltip on container hover */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/95 px-3 py-1 rounded-lg text-[9px] font-syncopate uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity border border-white/10">
        SRM AP Math Club
      </div>
    </div>
  );
};

/**
 * Enhanced Lock Vault Logo
 * Starts 'locked', automatically animates to 'open' on completion.
 */
const LockVaultLogo = ({ isOpen = false }: { isOpen?: boolean }) => (
  <div className={`relative w-14 h-14 md:w-16 md:h-16 ${!isOpen ? 'animate-rotate-slow' : 'scale-110'}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(0,242,255,0.9)] transition-all duration-1000">
      <defs>
        <linearGradient id="lockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#ff00ff' }} />
          <stop offset="50%" style={{ stopColor: '#00ffff' }} />
          <stop offset="100%" style={{ stopColor: '#00ff00' }} />
        </linearGradient>
      </defs>
      {/* Outer Glow Ring */}
      <circle cx="50" cy="50" r="46" fill="none" stroke="url(#lockGrad)" strokeWidth="1" strokeDasharray="10 5" className={isOpen ? 'opacity-0' : 'animate-pulse'} />
      
      {/* Lock Shackle - Animates Open */}
      <path 
        d={isOpen ? "M38 40 V22 a12 12 0 0 1 24 0 V30" : "M38 45 V35 a12 12 0 0 1 24 0 V45"} 
        fill="none" 
        stroke="url(#lockGrad)" 
        strokeWidth="5" 
        strokeLinecap="round" 
        className="transition-all duration-700 ease-out"
        style={{ transform: isOpen ? 'translateY(-8px) rotate(-20deg)' : 'none', transformOrigin: '70% 45%' }}
      />

      {/* Main Lock Body */}
      <rect x="30" y="45" width="40" height="32" rx="4" fill="#111" stroke="url(#lockGrad)" strokeWidth="4" />
      
      {/* Status LED */}
      <circle cx="50" cy="61" r="3" fill={isOpen ? "#00ff41" : "#ff0000"} className={isOpen ? "shadow-[0_0_10px_#00ff41]" : "animate-pulse"} />
      <path d="M50 65 L50 72" stroke={isOpen ? "#00ff41" : "url(#lockGrad)"} strokeWidth="2" strokeLinecap="round" />
    </svg>
  </div>
);

const InteractiveBackground = () => {
  const [entities, setEntities] = useState<any[]>([]);
  const requestRef = useRef<number>();

  useEffect(() => {
    const mathSymbols = ['π', 'Δ', 'λ', '∫', 'Σ', '∞', '√', 'θ', 'Ω', 'μ', 'φ', 'δ', '∂', '∇', '≈', '≠', '±', 'i', 'x²', 'lim', 'n!', 'ζ', 'Γ', '≅', '∈', '∏'];
    const initialEntities = Array.from({ length: 350 }).map((_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      char: mathSymbols[Math.floor(Math.random() * mathSymbols.length)],
      size: 15 + Math.random() * 45,
      opacity: 0.2 + Math.random() * 0.5,
      color: `hsl(${Math.random() * 360}, 80%, 70%)`,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 2.5
    }));
    setEntities(initialEntities);

    const update = () => {
      setEntities(prev => prev.map(entity => {
        let { x, y, vx, vy, rotation, rotationSpeed } = entity;
        x += vx; y += vy; rotation += rotationSpeed;
        if (x < -100) x = window.innerWidth + 100;
        if (x > window.innerWidth + 100) x = -100;
        if (y < -100) y = window.innerHeight + 100;
        if (y > window.innerHeight + 100) y = -100;
        return { ...entity, x, y, rotation };
      }));
      requestRef.current = requestAnimationFrame(update);
    };
    requestRef.current = requestAnimationFrame(update);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-black">
      {entities.map(entity => (
        <div key={entity.id} className="interactive-entity" style={{ left: entity.x, top: entity.y, width: entity.size, height: entity.size, opacity: entity.opacity, color: entity.color, transform: `rotate(${entity.rotation}deg)`, textShadow: `0 0 10px ${entity.color}` }}>
          <span style={{ fontSize: entity.size, fontWeight: '900' }}>{entity.char}</span>
        </div>
      ))}
    </div>
  );
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('BOOT');
  const [playerName, setPlayerName] = useState('');
  const [sessionRounds, setSessionRounds] = useState<Level[]>([]);
  const [sessionVault, setSessionVault] = useState<Level | null>(null);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [userInput, setUserInput] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success', msg: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentLevel = gameState === 'VAULT_LOCK' ? sessionVault : sessionRounds[currentLevelIdx];

  const stopTimer = useCallback(() => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState('GAMEOVER');
          stopTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  const handleReset = () => {
    stopTimer();
    setGameState('BOOT');
    setPlayerName('');
    setSessionRounds([]);
    setSessionVault(null);
    setCurrentLevelIdx(0);
    setTimeLeft(TOTAL_TIME);
    setUserInput('');
    setAttempts(0);
    setScore(0);
    setFeedback(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBoot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    const chosenRounds = POOLS.map(pool => pool[Math.floor(Math.random() * pool.length)]);
    const chosenVault = VAULT_POOL[Math.floor(Math.random() * VAULT_POOL.length)];
    setSessionRounds(chosenRounds);
    setSessionVault(chosenVault);
    setCurrentLevelIdx(0);
    setTimeLeft(TOTAL_TIME);
    setAttempts(0);
    setUserInput('');
    setFeedback(null);
    setGameState('PLAYING');
    startTimer();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentLevel) return;
    const sanitizedInput = userInput.trim().toUpperCase();
    const correctAnswer = currentLevel.answer.toUpperCase();

    if (sanitizedInput === correctAnswer) {
      setFeedback({ type: 'success', msg: 'LAYER DECRYPTED.' });
      setTimeout(() => {
        if (gameState === 'PLAYING') {
          if (currentLevelIdx === 2) {
            setGameState('ACCESS_GRANTED');
          } else if (currentLevelIdx === 3) {
            setGameState('FINAL_ROUND');
          } else {
            setCurrentLevelIdx(prev => prev + 1);
          }
          setUserInput('');
          setFeedback(null);
        } else if (gameState === 'VAULT_LOCK') {
          setScore(Math.max(0, 10000 + (timeLeft * 20) - (attempts * 100)));
          setGameState('VICTORY');
          stopTimer();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 1000);
    } else {
      setAttempts(prev => prev + 1);
      setFeedback({ type: 'error', msg: 'INCORRECT CODE.' });
    }
  };

  useEffect(() => { return () => stopTimer(); }, [stopTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center py-20 px-4 relative overflow-x-hidden bg-black">
      <InteractiveBackground />

      {/* GLOBAL HEADER */}
      {gameState !== 'BOOT' && (
        <header className="fixed top-0 left-0 w-full p-4 md:px-12 grid grid-cols-3 items-center z-[100] border-b backdrop-blur-md bg-black/60 border-white/5">
          <div className="flex items-center gap-4">
            <LockVaultLogo isOpen={gameState === 'VICTORY'} />
            <h1 className="font-syncopate text-sm md:text-xl font-black hidden sm:block text-white">LOGIC LOCKDOWN</h1>
          </div>
          <div className="text-center">
            <h2 className="font-orbitron font-black text-xl md:text-4xl tracking-[0.3em] animate-rainbow">INFINITUS 2026</h2>
            {(gameState === 'ACCESS_GRANTED' || gameState === 'FINAL_ROUND') && (
              <p className={`text-xl font-orbitron font-black mt-2 ${timeLeft < 30 ? 'text-red-600 animate-pulse' : 'text-white'}`}>
                TIME REMAINING: {formatTime(timeLeft)}
              </p>
            )}
          </div>
          <div className="flex items-center justify-end gap-4 group">
            <div className="text-right hidden sm:block">
              <p className="font-syncopate text-sm md:text-xl font-black uppercase tracking-widest text-white">Math Club</p>
            </div>
            <MathClubLogo />
          </div>
        </header>
      )}

      {/* BOOT SCREEN */}
      {gameState === 'BOOT' && (
        <div className="max-w-4xl w-full text-center space-y-12 animate-fade-in z-10 flex flex-col items-center">
          <div className="space-y-4">
             <h4 className="text-white font-syncopate text-2xl md:text-5xl tracking-[0.8em] font-black mb-6">LOGIC LOCKDOWN</h4>
             <h2 className="text-6xl md:text-[8rem] font-syncopate font-black text-white tracking-tighter italic animate-rainbow leading-none">INFINITUS</h2>
             <h3 className="text-5xl md:text-8xl font-syncopate font-black italic text-white leading-none animate-rainbow">2026</h3>
          </div>
          
          <div className="max-w-2xl w-full p-12 md:p-16 bg-[#ffdae9] flex flex-col items-center border-4 border-black mt-6 transition-all hover:scale-105 shadow-[0_0_80px_rgba(255,218,233,0.4)]">
            <div className="mb-10 text-center w-full border-b-4 border-black pb-8">
               <h2 className="text-black font-charter text-xl md:text-3xl font-black tracking-widest uppercase">LOGIC LOCKDOWN</h2>
            </div>
            
            <form onSubmit={handleBoot} className="w-full space-y-12">
              <div className="space-y-6">
                <label className="text-[28px] text-black font-bold uppercase tracking-[0.4em] block text-center font-charter">NAME</label>
                <input
                  type="text"
                  required
                  placeholder="IDENTITY..."
                  className="w-full bg-white border-4 border-black p-8 rounded-2xl font-charter text-2xl text-black focus:outline-none transition-all uppercase text-center tracking-widest shadow-inner"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-black text-white font-syncopate py-10 rounded-2xl border-b-8 border-gray-600 shadow-2xl hover:bg-gray-900 active:translate-y-2 active:border-b-0 transition-all uppercase tracking-[0.8em] text-lg font-black"
              >
                INITIALIZE BREACH
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PLAYING SCREEN (Sky Blue Question Page) */}
      {gameState === 'PLAYING' && currentLevel && (
        <main className="w-full max-w-3xl p-10 md:p-20 space-y-12 animate-fade-in mt-20 z-10 bg-sky-200 border-4 border-white rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-b border-white/50 pb-12">
            <div className="space-y-4">
              <span className="text-[13px] font-black text-slate-700 bg-white/40 px-6 py-2 rounded-full border border-white/50 uppercase tracking-widest font-orbitron">{currentLevel.type}</span>
              <h2 className="text-3xl md:text-4xl font-syncopate font-black text-slate-900 leading-tight">LVL {currentLevelIdx + 1}: {currentLevel.title}</h2>
            </div>
            <div className="text-right p-6 bg-white/40 rounded-3xl border border-white/50 w-full md:w-auto shadow-sm">
              <p className="text-[12px] text-slate-700 font-black mb-2 uppercase tracking-widest">Buffer Time</p>
              <p className={`text-6xl font-orbitron font-black ${timeLeft < 30 ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>{formatTime(timeLeft)}</p>
            </div>
          </div>

          <div className="bg-sky-100 p-16 rounded-[2.5rem] border-4 border-white shadow-xl relative transition-transform hover:scale-[1.01]">
            <p className="text-2xl md:text-3xl text-slate-900 font-orbitron font-bold italic leading-relaxed text-center">"{currentLevel.question}"</p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-10">
            <div className="space-y-4 text-center">
              <label className="text-[12px] font-orbitron font-black text-slate-700 uppercase tracking-widest block mb-2">DECRYPT LAYER</label>
              <input
                autoFocus
                type="text"
                placeholder="..."
                className={`w-full max-w-md mx-auto bg-white border-4 ${feedback?.type === 'error' ? 'border-red-600 animate-shake' : 'border-transparent'} p-5 rounded-full font-orbitron text-lg md:text-xl text-center focus:outline-none focus:border-slate-900 transition-all uppercase text-slate-900 tracking-[0.2em] shadow-lg block`}
                value={userInput}
                onChange={(e) => { setUserInput(e.target.value); setFeedback(null); }}
              />
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white font-syncopate py-12 rounded-full font-black hover:bg-black uppercase tracking-[0.8em] text-xl shadow-2xl active:scale-95 transition-all">UNSEAL LAYER</button>
          </form>
          
          {feedback && (
            <div className={`text-center font-black animate-pulse uppercase tracking-[0.4em] transition-all duration-500 ${feedback.type === 'error' ? 'text-red-600 text-lg' : 'text-[#006400] text-4xl md:text-6xl font-charter'}`}>
              {feedback.msg}
            </div>
          )}
        </main>
      )}

      {/* ACCESS GRANTED TRANSITION */}
      {gameState === 'ACCESS_GRANTED' && (
        <div className="text-center space-y-16 animate-fade-in z-10 w-full max-w-5xl pt-20 flex flex-col items-center">
          <h2 className="text-[10vw] font-syncopate font-black text-white tracking-tighter italic animate-rainbow">ACCESS GRANTED</h2>
          <div className="w-80 h-3 bg-white/10 rounded-full overflow-hidden relative">
            <div className="h-full bg-white w-full animate-loading-bar"></div>
          </div>
          <button onClick={() => { setCurrentLevelIdx(3); setGameState('PLAYING'); window.scrollTo(0,0); }} className="px-24 py-12 bg-white text-black font-syncopate text-3xl font-black rounded-full hover:scale-110 active:scale-90 transition-all uppercase tracking-widest shadow-[0_0_50px_rgba(255,255,255,0.4)]">CONTINUE BREACH</button>
        </div>
      )}

      {/* FINAL ROUND TRANSITION */}
      {gameState === 'FINAL_ROUND' && (
        <div className="text-center space-y-16 animate-fade-in z-10 w-full max-w-5xl pt-20 flex flex-col items-center">
          <h2 className="text-[10vw] font-syncopate font-black text-white tracking-tighter italic animate-rainbow">FINAL ROUND</h2>
          <div className="w-80 h-3 bg-white/10 rounded-full overflow-hidden relative">
            <div className="h-full bg-white w-full animate-loading-bar"></div>
          </div>
          <button onClick={() => { setGameState('VAULT_LOCK'); window.scrollTo(0,0); }} className="px-24 py-12 bg-white text-black font-syncopate text-3xl font-black rounded-full hover:scale-110 active:scale-90 transition-all uppercase tracking-widest shadow-[0_0_50px_rgba(255,255,255,0.4)]">BREACH FINAL LOCK</button>
        </div>
      )}

      {/* VAULT LOCK (Final Lock - Light Green Background) */}
      {gameState === 'VAULT_LOCK' && sessionVault && (
        <main className="w-full max-w-4xl bg-emerald-200 p-16 md:p-32 rounded-[5rem] space-y-20 shadow-[0_40px_150px_rgba(0,0,0,0.5)] animate-fade-in mt-20 z-10 border-4 border-white">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-b border-white/50 pb-12">
            <div className="space-y-6">
              <h2 className="text-7xl md:text-[8rem] font-syncopate font-black text-slate-900 tracking-[0.2em] italic leading-tight uppercase">FINAL</h2>
              <p className="text-[14px] font-black text-slate-600 tracking-[1.5em] uppercase">INFINITUS CORE</p>
            </div>
            <div className="text-right p-6 bg-white/40 rounded-3xl border border-white/50 w-full md:w-auto shadow-sm">
              <p className="text-[12px] text-slate-700 font-black mb-2 uppercase tracking-widest">Buffer Time</p>
              <p className={`text-6xl font-orbitron font-black ${timeLeft < 30 ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>{formatTime(timeLeft)}</p>
            </div>
          </div>
          
          <div className="bg-emerald-100 p-20 rounded-[4rem] border-8 border-white shadow-2xl">
            <p className="text-3xl md:text-4xl text-slate-900 font-black text-center italic leading-relaxed">"{sessionVault.question}"</p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-16">
            <div className="text-center space-y-4">
               <input 
                autoFocus 
                type="text" 
                placeholder="..." 
                className="w-full max-w-lg mx-auto bg-white border-b-8 border-emerald-500 p-6 font-orbitron text-xl md:text-2xl text-center focus:outline-none focus:border-slate-900 uppercase text-slate-900 tracking-[0.2em]" 
                value={userInput} 
                onChange={(e) => { setUserInput(e.target.value); setFeedback(null); }} 
              />
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white font-syncopate py-14 rounded-full font-black uppercase tracking-[1em] text-3xl shadow-[0_30px_60px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all">TERMINATE ENCRYPTION</button>
          </form>
          
          {feedback && (
            <div className={`text-center font-black animate-pulse uppercase tracking-[0.4em] transition-all duration-500 ${feedback.type === 'error' ? 'text-red-600 text-lg' : 'text-[#006400] text-4xl md:text-6xl font-charter'}`}>
              {feedback.msg}
            </div>
          )}
        </main>
      )}

      {/* VICTORY SCREEN - "ACCOMPLISHED" */}
      {gameState === 'VICTORY' && (
        <div className="max-w-4xl w-full flex flex-col items-center p-12 md:p-16 bg-[#dcfce7] border-4 border-white rounded-[4rem] animate-fade-in z-[150] mt-10 shadow-2xl text-slate-900 overflow-hidden">
            <div className="mb-10 scale-[2.0]">
               <LockVaultLogo isOpen={true} />
            </div>
            <h2 className="text-5xl md:text-8xl font-syncopate font-black mb-10 italic text-center uppercase tracking-widest text-[#006400] w-full">ACCOMPLISHED</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-10 border-y-4 border-slate-900/10 w-full">
              <div className="flex flex-col items-center justify-center p-4">
                <p className="text-2xl md:text-3xl text-slate-600 uppercase font-black mb-2 tracking-[0.1em] text-center font-charter">Final Score</p>
                <p className="text-4xl md:text-7xl font-orbitron font-black text-slate-900">{score}</p>
              </div>
              <div className="flex flex-col items-center justify-center p-4">
                <p className="text-2xl md:text-3xl text-slate-600 uppercase font-black mb-2 tracking-[0.1em] text-center font-charter">Clearance Time</p>
                <p className="text-4xl md:text-7xl font-orbitron font-black text-slate-900">{formatTime(timeLeft)}</p>
              </div>
            </div>
            <button onClick={handleReset} className="mt-14 px-16 py-8 bg-slate-900 text-white font-black font-syncopate uppercase tracking-[0.4em] rounded-full text-2xl hover:scale-105 active:scale-95 transition-all shadow-xl">Re-Initiate Session</button>
        </div>
      )}

      {/* GAME OVER */}
      {gameState === 'GAMEOVER' && (
        <div className="max-w-2xl w-full text-center space-y-20 p-24 bg-red-950 border-[15px] border-red-900 rounded-[6rem] animate-fade-in z-10 pt-20">
          <h2 className="text-8xl font-syncopate font-black text-red-500 tracking-tighter italic animate-pulse">FAILED</h2>
          <p className="font-orbitron text-2xl text-red-300 font-bold uppercase tracking-[0.5em]">System Wipe Initiated.</p>
          <button onClick={handleReset} className="w-full bg-red-50 text-white font-syncopate py-14 rounded-full font-black uppercase tracking-[1.2em] shadow-2xl text-4xl hover:scale-105 transition-all">REBOOT</button>
        </div>
      )}

      {/* Footer Credits */}
      {gameState !== 'BOOT' && (
        <div className="mt-32 transition-opacity z-10 text-center flex flex-col items-center gap-6 pb-20 w-full max-w-[90vw] border-t-2 border-white/10 text-white">
          <div className="mt-10 flex flex-row flex-wrap justify-center gap-x-24 md:gap-x-32 font-syncopate font-black text-xl md:text-2xl uppercase tracking-[0.2em] items-start text-center">
            <div className="flex flex-col"><span className="block">Math</span><span className="block">Club</span></div>
            <div className="flex flex-col"><span className="block">SRM</span><span className="block">AP</span></div>
            <div className="flex flex-col"><span className="block animate-rainbow">Infinitus</span><span className="block animate-rainbow">2026</span></div>
            <div className="flex flex-col"><span className="block">Logic</span><span className="block">Arena</span></div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-15px); } 40% { transform: translateX(15px); } 60% { transform: translateX(-8px); } 80% { transform: translateX(8px); } }
        .animate-shake { animation: shake 0.12s ease-in-out infinite; }
        @keyframes loading-bar { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-loading-bar { animation: loading-bar 2.8s infinite linear; }
        @keyframes rotate-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-rotate-slow { animation: rotate-slow 10s linear infinite; }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        @keyframes spin-fast { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-fast { animation: spin-fast 1.5s linear infinite; }
      `}</style>
    </div>
  );
}
