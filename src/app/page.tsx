'use client'

import { useRef, useEffect, useState, useMemo } from 'react';

export type TimeString = '00:00' | `${number}:${number}` | `${number}:0${number}`; // Formato "MM:SS"
export type CycleType = 'notStarted' | 'work' | 'break' | 'longBreak';

export type PomodoroType = {
  time: TimeString,
  currentCycle: number,
  currentCycleType: CycleType,
  isPaused: boolean,
  isRunning: boolean,
  intervalId: NodeJS.Timeout | null,
}

export default function Home() {
  const [title, setTitle] = useState<string>('Pomodoro');
  const [pauseAtEnd, setPauseAtEnd] = useState<boolean>(false);
  const [pomodoro, setPomodoro] = useState<PomodoroType>({
    time: '00:00',
    currentCycle: 0,
    currentCycleType: 'notStarted',
    isPaused: false,
    isRunning: false,
    intervalId: null,
  });

  const pauseAtEndRef = useRef<boolean>(pauseAtEnd);

  const workTime = 50; // 50
  const breakTime = 10; // 10
  const longBreakTime = 15;  // 15
  const workCycles = 2;

  const titles = useMemo(() => ({
    work: 'TRABALHE',
    break: 'FAÇA UMA PAUSA',
    longBreak: 'FAÇA UMA PAUSA LONGA',
    notStarted: 'Pomodoro',
  }), []);

  const cycleTypeTime = {
    notStarted: workTime,
    work: workTime,
    break: breakTime,
    longBreak: longBreakTime,
  };

  const startPomodoro = async () => {
    const newPomodoro = {
      time: '00:00',
      currentCycle: 0,
      currentCycleType: 'work',
      isPaused: false,
      isRunning: true,
      intervalId: null
    } as PomodoroType;
    run(newPomodoro);
  };
  
  const pausePomodoro = () => {
    setPomodoro({...pomodoro, isPaused: true, isRunning: false});
    clearInterval(pomodoro.intervalId as NodeJS.Timeout);
  };

  const continuePomodoro = () => {
    if(pauseAtEnd) {
      setPauseAtEnd(false);
    }

    const newPomodoro = { ...pomodoro, isPaused: false, isRunning: true, } as PomodoroType;
    run(newPomodoro);
  };

  const cancelPomodoro = () => {
    clearInterval(pomodoro.intervalId as NodeJS.Timeout);
    setPomodoro({time: '00:00', currentCycle: 0, currentCycleType: 'notStarted', isPaused: false, isRunning: false, intervalId: null});
  };

  const pauseAtEndOfCyclePomodoro = () => {
    setPauseAtEnd(true);
  };

  const stopPauseAtEndOfCyclePomodoro = () => {
    setPauseAtEnd(false);
  };

  const getCycleTypeTime = (): number => {
    return cycleTypeTime[pomodoro.currentCycleType] ?? 0;
  }

  const getNextCycleType = (pomodoro: PomodoroType): CycleType => {
    if (pomodoro.currentCycleType === 'work' && pomodoro.currentCycle <= workCycles) {
      return 'break';
    } else if (pomodoro.currentCycleType === 'work' && pomodoro.currentCycle > workCycles) {
      return 'longBreak';
    } else {
      return 'work';
    }
  }

  const playAudio = (currentCycleType: CycleType) => {
    const audios = {
      work: 'resource/spongebob-fail.mp3',
      break: 'resource/ta-da_yrvBrlS.mp3',
      longBreak: 'resource/yippeeeeeeeeeeeeee.mp3',
      notStarted: 'resource/spongebob.mp3',
      default: 'resource/ta-da_yrvBrlS.mp3',
    }

    const audio = new Audio(audios[currentCycleType] ?? audios.default);

    audio.play().catch(
      error => console.error('Erro ao reproduzir áudio:', error)
    );
  };
  

  useEffect(() => {
    const title = titles[pomodoro.currentCycleType] ?? 'Pomodoro';
    setTitle(title);
  }, [pomodoro.currentCycleType, titles]);

  useEffect(() => {
    pauseAtEndRef.current = pauseAtEnd;
  }, [pauseAtEnd]);

  const run = (currentPomodoro: PomodoroType = pomodoro) =>  {
    const cycleTime = getCycleTypeTime();
    let newTime = currentPomodoro.time;
    let pauseNow = false;

    if(currentPomodoro !== pomodoro) {
      setPomodoro(currentPomodoro);
    }

    if(currentPomodoro.intervalId) {
      clearInterval(currentPomodoro.intervalId);
    }

    const interval = setInterval(() => {
      const [minutes, seconds] = newTime.split(':');
      
      if(parseInt(minutes) >= cycleTime ) {
        currentPomodoro.currentCycleType = getNextCycleType(currentPomodoro)
        currentPomodoro.currentCycle = currentPomodoro.currentCycleType == 'longBreak' ? 0 : currentPomodoro.currentCycle + 1;
        newTime = '00:00';
        pauseNow = pauseAtEndRef.current;

        playAudio(currentPomodoro.currentCycleType);
      } else if (seconds === '59') {
        newTime = `${parseInt(minutes) + 1}:00`;
      } else if (parseInt(seconds) < 9) {
        newTime = `${parseInt(minutes)}:0${parseInt(seconds) + 1}`;
      } else {
        newTime = `${parseInt(minutes)}:${parseInt(seconds) + 1}`;
      }

      if(pauseNow) {
        currentPomodoro.isPaused = true;
        currentPomodoro.isRunning = false;
        clearInterval(interval);
      }

      const data = {
        time: newTime,
        currentCycle: currentPomodoro.currentCycle,
        currentCycleType: currentPomodoro.currentCycleType,
        isPaused: currentPomodoro.isPaused,
        isRunning: currentPomodoro.isRunning,
        intervalId: interval
      } as PomodoroType
      
      setPomodoro(data);
    }, 100);
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">

        <div>
          <h2>
            { title }
          </h2>
        </div>

        <div>
          <div>
            { pomodoro.time }
          </div>

          <div className="flex flex-col gap-4">

            {!pomodoro.isPaused && !pomodoro.isRunning && (
              <button onClick={startPomodoro}>
                Start
              </button>
            )}

            {!pomodoro.isPaused && pomodoro.isRunning && (
              <button onClick={pausePomodoro}>
                PAUSAR
              </button>
            )}

            {!pomodoro.isPaused && pomodoro.isRunning && !pauseAtEnd && (
              <button onClick={pauseAtEndOfCyclePomodoro}>
                Pausar no fum do ciclo
              </button>
            )}

            {pomodoro.isRunning && pauseAtEnd && (
              <button onClick={stopPauseAtEndOfCyclePomodoro}>
                Parar pausa programada
              </button>
            )}

            {pomodoro.isPaused && !pomodoro.isRunning && (
              <button onClick={continuePomodoro}>
                Continuar
              </button>
            )}
            {pomodoro.isPaused && !pomodoro.isRunning && (
              <button onClick={cancelPomodoro}>
                Cancelar
              </button>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}