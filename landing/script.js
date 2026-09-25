const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Build a small, looping amplitude display to make the hero feel like a live
// instrument without relying on a video or a stock image.
const bars = document.querySelector('.wave-bars');
if (bars && !reduceMotion) {
  for (let i = 0; i < 52; i += 1) {
    const bar = document.createElement('i');
    const wave = Math.abs(Math.sin((i / 51) * Math.PI * 2.2));
    bar.style.setProperty('--h', `${5 + wave * 24}px`);
    bar.style.setProperty('--dur', `${0.45 + ((i * 17) % 80) / 100}s`);
    bar.style.setProperty('--delay', `${-((i * 13) % 60) / 100}s`);
    bars.append(bar);
  }
}

// Fade sections in as they enter view. Leave content visible when observers
// or motion preferences make animation unavailable.
const revealItems = document.querySelectorAll('.reveal');
if (!reduceMotion && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('in-view'));
}

// A small, original Web Audio loop gives the animated player a real voice.
// Sound starts only after the visitor presses Play, as required by browsers.
const demoButton = document.querySelector('#demo-toggle');
const demoStage = document.querySelector('#demo-stage');
const demoStatus = document.querySelector('#demo-status');
const reelFrames = [...document.querySelectorAll('.reel-frame')];
const reelStep = document.querySelector('#reel-step');
const reelTitle = document.querySelector('#reel-title');
const reelCaptions = [
  'TWO HANDS. ONE INSTRUMENT.',
  'PINCH A NOTE. PLAY A MELODY.',
  'HOLD A CHORD. FEEL IT RING.',
  'TURN YOUR WRIST. OPEN THE FILTER.',
  'GESTURE IN. SOUND OUT.',
];
const melody = [72, 76, 79, 76, 74, 72, 67, 69, 72, 76, 81, 79, 76, 74, 72, 69];
const chords = [
  { name: 'C MAJOR', root: 48, notes: [60, 64, 67] },
  { name: 'F MAJOR', root: 41, notes: [60, 65, 69] },
  { name: 'G MAJOR', root: 43, notes: [59, 62, 67] },
  { name: 'A MINOR', root: 45, notes: [60, 64, 69] },
];
let reelIndex = 0;
let reelTimer;
let audioContext;
let masterGain;
let scheduler;
let nextNoteTime = 0;
let step = 0;

function showReelFrame(index) {
  reelIndex = index % reelFrames.length;
  reelFrames.forEach((frame, frameIndex) => {
    frame.classList.toggle('is-active', frameIndex === reelIndex);
  });
  reelStep.textContent = `${String(reelIndex + 1).padStart(2, '0')} / 05`;
  reelTitle.textContent = reelCaptions[reelIndex];
}

function startIdleReel() {
  window.clearInterval(reelTimer);
  if (!reduceMotion) {
    reelTimer = window.setInterval(() => showReelFrame(reelIndex + 1), 2600);
  }
}

startIdleReel();

function midiFrequency(midi) {
  return 440 * (2 ** ((midi - 69) / 12));
}

function playVoice(midi, when, duration, waveform, volume) {
  const oscillator = audioContext.createOscillator();
  const envelope = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  oscillator.type = waveform;
  oscillator.frequency.setValueAtTime(midiFrequency(midi), when);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(waveform === 'sine' ? 1500 : 3000, when);
  envelope.gain.setValueAtTime(0.0001, when);
  envelope.gain.exponentialRampToValueAtTime(volume, when + 0.025);
  envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  oscillator.connect(filter);
  filter.connect(envelope);
  envelope.connect(masterGain);
  oscillator.start(when);
  oscillator.stop(when + duration + 0.035);
}

function playKick(when) {
  const oscillator = audioContext.createOscillator();
  const envelope = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(115, when);
  oscillator.frequency.exponentialRampToValueAtTime(48, when + 0.13);
  envelope.gain.setValueAtTime(0.12, when);
  envelope.gain.exponentialRampToValueAtTime(0.0001, when + 0.16);
  oscillator.connect(envelope);
  envelope.connect(masterGain);
  oscillator.start(when);
  oscillator.stop(when + 0.18);
}

function scheduleStep(when, index) {
  const beat = index % melody.length;
  const chord = chords[Math.floor(beat / 4)];
  if (index % 8 === 0) showReelFrame(Math.floor(index / 8) % reelFrames.length);
  playVoice(melody[beat], when, 0.22, 'triangle', 0.11);
  if (beat % 4 === 0) {
    chord.notes.forEach((note) => playVoice(note, when, 1.03, 'sine', 0.023));
    playVoice(chord.root, when, 0.42, 'triangle', 0.065);
    playKick(when);
    demoStatus.textContent = `NOW PLAYING · ${chord.name}`;
  }
}

function runScheduler() {
  const stepDuration = 60 / 104 / 2;
  while (nextNoteTime < audioContext.currentTime + 0.12) {
    scheduleStep(nextNoteTime, step);
    nextNoteTime += stepDuration;
    step += 1;
  }
}

async function startDemo() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    demoStatus.textContent = 'WEB AUDIO IS NOT AVAILABLE HERE';
    return;
  }
  audioContext = new AudioContextClass();
  await audioContext.resume();
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.44;
  masterGain.connect(audioContext.destination);
  window.clearInterval(reelTimer);
  showReelFrame(0);
  step = 0;
  nextNoteTime = audioContext.currentTime + 0.08;
  scheduler = window.setInterval(runScheduler, 30);
  demoStage.classList.add('is-playing');
  demoButton.setAttribute('aria-pressed', 'true');
  demoButton.querySelector('.play-icon').textContent = 'Ⅱ';
  demoButton.querySelector('.demo-button-label').textContent = 'Pause the music';
  demoStatus.textContent = 'NOW PLAYING · C MAJOR';
}

function stopDemo() {
  window.clearInterval(scheduler);
  scheduler = undefined;
  demoStage.classList.remove('is-playing');
  demoButton.setAttribute('aria-pressed', 'false');
  demoButton.querySelector('.play-icon').textContent = '▶';
  demoButton.querySelector('.demo-button-label').textContent = 'Play a little music';
  demoStatus.textContent = 'SOUND OFF · YOUR TURN';
  if (audioContext && masterGain) {
    const contextToClose = audioContext;
    masterGain.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.06);
    window.setTimeout(() => contextToClose.close(), 450);
  }
  audioContext = undefined;
  masterGain = undefined;
  startIdleReel();
}

demoButton?.addEventListener('click', async () => {
  if (scheduler !== undefined) {
    stopDemo();
    return;
  }
  try {
    await startDemo();
  } catch {
    stopDemo();
    demoStatus.textContent = 'COULD NOT START AUDIO · TRY AGAIN';
  }
});
