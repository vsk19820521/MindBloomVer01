/**
 * logic/ui/celebrate.js — Confetti, Level-Up Modal & Ambient Emoji System
 *
 * Extracted from app.js during Phase 2 refactoring.
 * Exports visual celebration functions used by puzzle.js, parentDash.js, and header.js.
 */

import { SoundManager } from "../../helpers/sound.js";

// ── Ambient theme emoji map ────────────────────────────────────────────────
const THEME_EMOJIS = {
  unicorn:   ["🦄", "🌟", "☁️", "💖", "🌈", "✨"],
  dino:      ["🦖", "🦕", "🌴", "🦴", "🥚", "🍃"],
  kitty:     ["🐱", "🐾", "🧶", "🐟", "🍼", "✨"],
  butterfly: ["🦋", "🌸", "🌼", "🍃", "☀️", "🌺"],
  puppy:     ["🐶", "🐾", "🦴", "🎾", "🐕", "🐾"],
  dolphin:   ["🐬", "🐠", "🐚", "🌊", "🐋", "🐳"],
  forest:    ["🍄", "🌲", "🦉", "🦊", "🍀", "🍄"],
  candy:     ["🍭", "🍬", "🍩", "🧁", "🍪", "🍫"],
  space:     ["🚀", "🪐", "🛸", "👽", "☄️", "⭐"]
};

// ── Confetti state ─────────────────────────────────────────────────────────
let confettiCanvas;
let confettiCtx;
let confettiParticles = [];
let isConfettiRunning = false;

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Call once on startup to wire the confetti canvas and resize listener.
 */
export function initConfetti() {
  confettiCanvas = document.getElementById("confetti-canvas");
  confettiCtx = confettiCanvas.getContext("2d");

  window.addEventListener("resize", resizeConfettiCanvas);
  resizeConfettiCanvas();
}

/**
 * Fire a burst of confetti that auto-stops after 4 s.
 */
export function startConfetti() {
  confettiParticles = [];
  const colors = ["#ff5252", "#ffeb3b", "#2196f3", "#4caf50", "#e91e63", "#9c27b0", "#00bcd4"];

  for (let i = 0; i < 150; i++) {
    confettiParticles.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height - confettiCanvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * confettiCanvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0
    });
  }

  if (!isConfettiRunning) {
    isConfettiRunning = true;
    animateConfetti();
  }

  // Auto stop
  setTimeout(() => {
    isConfettiRunning = false;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }, 4000);
}

/**
 * Spawns a single floating emoji from the left or right edge.
 * Called on an interval and during bursts.
 * @param {object|null} currentUser — needed to check if someone is logged in
 */
export function spawnFloatingEmoji(currentUser) {
  const container = document.getElementById("ambient-container");
  if (!container || !currentUser) return;

  const currentTheme = document.documentElement.getAttribute("data-theme") || "unicorn";
  const emojis = THEME_EMOJIS[currentTheme] || THEME_EMOJIS.unicorn;
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];

  const element = document.createElement("div");
  element.className = "floating-emoji";
  element.innerText = emoji;

  const isLeft = Math.random() < 0.5;
  const startX = isLeft
    ? Math.random() * 15
    : 85 + Math.random() * 13;

  const duration = Math.random() * 5 + 8;
  const size = Math.random() * 1.5 + 2.5;
  const driftX = (isLeft ? (Math.random() * 50) : (Math.random() * -50)) + "px";
  const rotZ = (Math.random() * 360 - 180) + "deg";

  element.style.left = `${startX}vw`;
  element.style.animationDuration = `${duration}s`;
  element.style.fontSize = `${size}rem`;
  element.style.setProperty("--drift-x", driftX);
  element.style.setProperty("--rot-z", rotZ);

  container.appendChild(element);

  setTimeout(() => {
    element.remove();
  }, duration * 1000);
}

/**
 * Fires `count` emojis in rapid sequence (decorative burst effect).
 */
export function spawnEmojiBurst(count = 10, currentUser) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => spawnFloatingEmoji(currentUser), i * 140);
  }
}

/**
 * Shows the level-up celebration modal with confetti.
 */
export function triggerLevelUpCelebration(levelInfo, currentUser) {
  const modalLevelEmoji = document.getElementById("modal-level-emoji");
  const modalLevelName = document.getElementById("modal-level-name");
  const modalLevelCoins = document.getElementById("modal-level-coins");

  modalLevelEmoji.innerText = levelInfo.emoji;
  modalLevelName.innerText = levelInfo.name;
  modalLevelCoins.innerText = `You have accumulated ${currentUser.gameState.coins} gold coins!`;

  SoundManager.playLevelUp();
  startConfetti();

  document.getElementById("celebration-modal").classList.add("active");
}

/**
 * Wire the close button on the celebration modal.
 * Call once during init.
 */
export function setupCelebrationModal() {
  document.getElementById("btn-close-celebration").addEventListener("click", () => {
    SoundManager.playClick();
    document.getElementById("celebration-modal").classList.remove("active");
  });
}

// ── Internal helpers ───────────────────────────────────────────────────────

function resizeConfettiCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}

function animateConfetti() {
  if (!isConfettiRunning) return;

  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  confettiParticles.forEach((p, idx) => {
    p.tiltAngle += p.tiltAngleIncremental;
    p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
    p.x += Math.sin(p.tiltAngle);
    p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;

    confettiCtx.beginPath();
    confettiCtx.lineWidth = p.r;
    confettiCtx.strokeStyle = p.color;
    confettiCtx.moveTo(p.x + p.tilt + p.r / 2, p.y);
    confettiCtx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
    confettiCtx.stroke();

    // recycle
    if (p.y > confettiCanvas.height) {
      confettiParticles[idx] = p;
      p.x = Math.random() * confettiCanvas.width;
      p.y = -20;
    }
  });

  requestAnimationFrame(animateConfetti);
}
