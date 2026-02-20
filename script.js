const AUDIO_OWNER_KEY = 'alina_audio_owner_v1';
const AUDIO_CHANNEL_KEY = 'alina_audio_channel_v1';
const audioOwnerId = `${location.pathname}::${Date.now()}::${Math.random().toString(16).slice(2)}`;
const audioChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(AUDIO_CHANNEL_KEY) : null;

function setAudioOwner() {
  const payload = { ownerId: audioOwnerId, ts: Date.now() };
  try {
    localStorage.setItem(AUDIO_OWNER_KEY, JSON.stringify(payload));
  } catch (error) {}
  if (audioChannel) audioChannel.postMessage(payload);
}

function readAudioOwner() {
  try {
    const raw = localStorage.getItem(AUDIO_OWNER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initVideoInteractions();
  initCanvas();
  initScrollEffects();
  initSurveillanceMarquee();
  initInteractiveBox();
  initPointerAura();
});

function initSurveillanceMarquee() {
  const track1 = document.getElementById('marqueeTrack');
  const track2 = document.getElementById('marqueeTrackClone');
  if (!track1 || !track2 || typeof INTERVIEW_GIFS === 'undefined') return;

  const createItem = (gif, index) => {
    const item = document.createElement('div');
    item.className = 'surveillance-item';
    item.innerHTML = `
      <img src="${gif.src}" alt="${gif.name}" loading="lazy">
      <div class="meta-overlay">
        <span>CAM_0${index + 1}</span>
        <span>${gif.name}</span>
      </div>
    `;
    return item;
  };

  const displayList = [...INTERVIEW_GIFS, ...INTERVIEW_GIFS];
  displayList.forEach((gif, index) => {
    track1.appendChild(createItem(gif, index));
    track2.appendChild(createItem(gif, index));
  });

  const duration = `${displayList.length * 2.5}s`;
  track1.style.animationDuration = duration;
  track2.style.animationDuration = duration;
}

function initThemeToggle() {
  const toggleBtn = document.getElementById('themeToggle');
  const body = document.body;
  if (!toggleBtn || !body) return;

  const savedTheme = localStorage.getItem('theme') || 'dark';
  body.setAttribute('data-theme', savedTheme);

  toggleBtn.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateCanvasTheme(newTheme);
  });
}

function initVideoInteractions() {
  const videoWrapper = document.querySelector('.video-wrapper');
  const video = document.getElementById('mainVideo');
  const soundToggle = document.getElementById('soundToggle');
  const progressBar = document.querySelector('.time-progress');
  const soundStartHint = document.getElementById('soundStartHint');
  if (!videoWrapper || !video) return;

  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.muted = true;

  const setBufferingState = (isBuffering) => {
    videoWrapper.classList.toggle('is-buffering', isBuffering);
  };

  setBufferingState(true);
  ['loadstart', 'waiting', 'stalled', 'seeking'].forEach((evt) => {
    video.addEventListener(evt, () => setBufferingState(true));
  });
  ['loadeddata', 'canplay', 'playing', 'seeked'].forEach((evt) => {
    video.addEventListener(evt, () => setBufferingState(false));
  });

  const syncButton = () => {
    if (!soundToggle) return;
    const muted = video.muted;
    soundToggle.textContent = muted ? 'UNMUTE' : 'MUTE';
    soundToggle.setAttribute('aria-pressed', String(!muted));
    if (soundStartHint) soundStartHint.classList.toggle('hidden', !muted);
  };

  const forceMute = () => {
    video.muted = true;
    video.volume = 0;
    syncButton();
  };

  const requestUnmute = () => {
    setAudioOwner();
    video.muted = false;
    video.volume = 1;
    syncButton();
  };

  const autoPlayWithSoundFallback = async () => {
    const owner = readAudioOwner();
    const hasOtherOwner = owner && owner.ownerId !== audioOwnerId;
    if (hasOtherOwner) {
      forceMute();
      await video.play().catch(() => {});
      return;
    }

    try {
      requestUnmute();
      await video.play();
    } catch (error) {
      forceMute();
      await video.play().catch(() => {});
    }
  };

  video.addEventListener('error', () => {
    setBufferingState(false);
    video.setAttribute('controls', '');
    if (soundStartHint) {
      soundStartHint.textContent = '影片格式受限，請點擊播放或更換瀏覽器';
      soundStartHint.classList.remove('hidden');
    }
  });

  document.addEventListener('mousemove', (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 20;
    const y = (event.clientY / window.innerHeight - 0.5) * 20;
    videoWrapper.style.transform = `perspective(1000px) rotateY(${x * 0.5}deg) rotateX(${y * -0.5}deg)`;
  });

  if (soundToggle) {
    soundToggle.addEventListener('click', async () => {
      if (video.paused) await video.play().catch(() => {});
      if (video.muted) requestUnmute();
      else forceMute();
    });
  }

  window.addEventListener('storage', (event) => {
    if (event.key !== AUDIO_OWNER_KEY || !event.newValue) return;
    try {
      const payload = JSON.parse(event.newValue);
      if (payload.ownerId !== audioOwnerId) forceMute();
    } catch (error) {}
  });

  if (audioChannel) {
    audioChannel.addEventListener('message', (event) => {
      const payload = event.data;
      if (!payload || payload.ownerId === audioOwnerId) return;
      forceMute();
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !video.muted) forceMute();
  });

  video.addEventListener('loadedmetadata', syncButton);
  syncButton();
  autoPlayWithSoundFallback();

  if (progressBar) {
    video.addEventListener('timeupdate', () => {
      if (!video.duration) return;
      const p = (video.currentTime / video.duration) * 100;
      progressBar.style.width = `${p}%`;
    });
  }
}

let canvasCtx;
let canvasW;
let canvasH;
let particles = [];
let themeColor = { r: 255, g: 255, b: 255 };

function initCanvas() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  canvasCtx = canvas.getContext('2d');

  function resize() {
    canvasW = window.innerWidth;
    canvasH = window.innerHeight;
    canvas.width = canvasW;
    canvas.height = canvasH;
    createParticles();
  }

  window.addEventListener('resize', resize);
  resize();
  updateCanvasTheme(document.body.getAttribute('data-theme'));
  animateCanvas();
}

function updateCanvasTheme(theme) {
  themeColor = theme === 'dark' ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
}

function createParticles() {
  particles = [];
  const count = window.innerWidth < 768 ? 14 : 30;
  for (let i = 0; i < count; i += 1) {
    particles.push({
      x: Math.random() * canvasW,
      y: Math.random() * canvasH,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2,
      opacity: Math.random() * 0.5
    });
  }
}

function animateCanvas() {
  if (!canvasCtx) return;
  canvasCtx.clearRect(0, 0, canvasW, canvasH);

  particles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x = canvasW;
    if (p.x > canvasW) p.x = 0;
    if (p.y < 0) p.y = canvasH;
    if (p.y > canvasH) p.y = 0;
    canvasCtx.fillStyle = `rgba(${themeColor.r}, ${themeColor.g}, ${themeColor.b}, ${p.opacity})`;
    canvasCtx.beginPath();
    canvasCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    canvasCtx.fill();
  });

  requestAnimationFrame(animateCanvas);
}

function initScrollEffects() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    });
  }, { threshold: 0.1 });

  const elements = document.querySelectorAll('.album-item, .split-col');
  elements.forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    observer.observe(el);
  });
}

function initInteractiveBox() {
  const box = document.getElementById('interactiveBox');
  if (!box) return;
  const faces = box.querySelectorAll('.box-face');

  box.addEventListener('mousemove', (event) => {
    const rect = box.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    box.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${y * -8}deg)`;

    faces.forEach((face, index) => {
      const depth = index === 0 ? 16 : -16;
      face.style.transform = `translateZ(${depth}px) translate(${x * 8}px, ${y * 8}px)`;
    });
  });

  box.addEventListener('mouseleave', () => {
    box.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg)';
    faces.forEach((face, index) => {
      const depth = index === 0 ? 16 : -16;
      face.style.transform = `translateZ(${depth}px) translate(0, 0)`;
    });
  });
}

function initPointerAura() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const aura = document.createElement('div');
  aura.className = 'pointer-aura';
  document.body.appendChild(aura);
  window.addEventListener('mousemove', (event) => {
    aura.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
  });
}
