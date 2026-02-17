const altVideo = document.getElementById("altVideo");
const altSoundToggle = document.getElementById("altSoundToggle");
const altHint = document.getElementById("altHint");
const spotlight = document.getElementById("spotlight");
const bars = document.querySelectorAll("#bars span");

async function autoPlayWithSound() {
  altVideo.muted = false;
  altVideo.volume = 1;

  try {
    await altVideo.play();
    altSoundToggle.textContent = "靜音";
    altHint.classList.add("hidden");
  } catch {
    altVideo.muted = true;
    await altVideo.play().catch(() => {});
    altSoundToggle.textContent = "開啟聲音";
    altHint.classList.remove("hidden");
  }
}

altSoundToggle.addEventListener("click", async () => {
  if (altVideo.paused) await altVideo.play().catch(() => {});
  altVideo.muted = !altVideo.muted;
  altSoundToggle.textContent = altVideo.muted ? "開啟聲音" : "靜音";
  altHint.classList.toggle("hidden", !altVideo.muted);
});

window.addEventListener("mousemove", (e) => {
  spotlight.style.left = `${e.clientX}px`;
  spotlight.style.top = `${e.clientY}px`;
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("show");
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll(".reveal-up").forEach((el) => revealObserver.observe(el));

function attachTilt(el) {
  el.addEventListener("mousemove", (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    const rx = (0.5 - y) * 6;
    const ry = (x - 0.5) * 7;
    el.style.transform = `perspective(850px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  });

  el.addEventListener("mouseleave", () => {
    el.style.transform = "";
  });
}

document.querySelectorAll(".tilt").forEach(attachTilt);

let barTimer = null;

function animateBars(intense = false) {
  bars.forEach((bar) => {
    const base = intense ? 50 : 22;
    const extra = Math.random() * (intense ? 50 : 65);
    bar.style.height = `${Math.min(100, base + extra)}%`;
  });
}

const barWrap = document.getElementById("bars");
barWrap.addEventListener("mouseenter", () => animateBars(true));
barWrap.addEventListener("mouseleave", () => animateBars(false));

window.addEventListener("DOMContentLoaded", () => {
  autoPlayWithSound();
  animateBars(false);
  barTimer = setInterval(() => animateBars(false), 320);
});

window.addEventListener("beforeunload", () => {
  if (barTimer) clearInterval(barTimer);
});
