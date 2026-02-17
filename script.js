const video = document.getElementById("featureVideo");
const theaterVideo = document.getElementById("theaterVideo");
const soundToggle = document.getElementById("soundToggle");
const theaterBtn = document.getElementById("theaterBtn");
const closeTheater = document.getElementById("closeTheater");
const theater = document.getElementById("theater");
const autoplayHint = document.getElementById("autoplayHint");
const scrollBar = document.getElementById("scrollBar");
const cursorAura = document.getElementById("cursorAura");
const countdown = document.getElementById("countdown");
const volumeControl = document.getElementById("volumeControl");
const volumeLabel = document.getElementById("volumeLabel");

async function autoplayWithSoundAttempt() {
  video.muted = false;
  video.volume = 1;

  try {
    await video.play();
    soundToggle.textContent = "靜音";
    autoplayHint.classList.add("hidden");
  } catch {
    video.muted = true;
    await video.play().catch(() => {});
    soundToggle.textContent = "開啟聲音";
    autoplayHint.classList.remove("hidden");
  }
}

soundToggle.addEventListener("click", async () => {
  if (video.paused) await video.play().catch(() => {});
  video.muted = !video.muted;
  soundToggle.textContent = video.muted ? "開啟聲音" : "靜音";
  autoplayHint.classList.toggle("hidden", !video.muted);
});

volumeControl.addEventListener("input", () => {
  const value = Number(volumeControl.value);
  video.volume = value;
  theaterVideo.volume = value;
  volumeLabel.textContent = `${Math.round(value * 100)}%`;
  if (value > 0 && video.muted) {
    video.muted = false;
    soundToggle.textContent = "靜音";
    autoplayHint.classList.add("hidden");
  }
});

window.addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const p = max > 0 ? (window.scrollY / max) * 100 : 0;
  scrollBar.style.width = `${Math.max(0, Math.min(100, p))}%`;
});

window.addEventListener("mousemove", (e) => {
  cursorAura.style.left = `${e.clientX}px`;
  cursorAura.style.top = `${e.clientY}px`;
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("show");
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

function attachTilt(el) {
  el.addEventListener("mousemove", (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    const rx = (0.5 - y) * 7;
    const ry = (x - 0.5) * 8;
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  });
  el.addEventListener("mouseleave", () => {
    el.style.transform = "";
  });
}
document.querySelectorAll(".tilt").forEach(attachTilt);

theaterBtn.addEventListener("click", async () => {
  theater.classList.remove("hidden");
  theaterVideo.currentTime = video.currentTime;
  theaterVideo.muted = video.muted;
  theaterVideo.volume = video.volume;
  await theaterVideo.play().catch(() => {});
});

function closeTheaterPanel() {
  theater.classList.add("hidden");
  theaterVideo.pause();
}

closeTheater.addEventListener("click", closeTheaterPanel);
theater.addEventListener("click", (e) => {
  if (e.target === theater) closeTheaterPanel();
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !theater.classList.contains("hidden")) closeTheaterPanel();
});

function updateCountdown() {
  const target = new Date("2026-03-01T00:00:00+08:00").getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) {
    countdown.textContent = "現正熱播中";
    return;
  }

  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  countdown.textContent = `發售倒數：${d}天 ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

window.addEventListener("DOMContentLoaded", () => {
  autoplayWithSoundAttempt();
  updateCountdown();
  setInterval(updateCountdown, 1000);
});
