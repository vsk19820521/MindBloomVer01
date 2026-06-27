/**
 * logic/ui/header.js — Header Rendering, Avatar Selector & Level Display
 *
 * Extracted from app.js during Phase 2 refactoring.
 * Manages the top bar (coins, level badge), avatar grid in Kids Zone,
 * and the sound/theme settings.
 */

import { StorageService } from "../storage.js";
import { SoundManager } from "../../helpers/sound.js";
import { spawnEmojiBurst, triggerLevelUpCelebration } from "./celebrate.js";

// 25 famous child cartoon avatars
const CARTOON_AVATARS = [
  { name: "Pikachu",    emoji: "⚡" },
  { name: "Doraemon",   emoji: "🐱" },
  { name: "Simba",      emoji: "🦁" },
  { name: "Bluey",      emoji: "🐶" },
  { name: "Peppa Pig",  emoji: "🐷" },
  { name: "Mickey Mouse", emoji: "🐭" },
  { name: "Winnie Pooh", emoji: "🐻" },
  { name: "SpongeBob",  emoji: "🧽" },
  { name: "Patrick Star", emoji: "⭐" },
  { name: "Olaf",       emoji: "⛄" },
  { name: "Stitch",     emoji: "🐨" },
  { name: "Toothless",  emoji: "🐉" },
  { name: "Hello Kitty", emoji: "🎀" },
  { name: "Buzz Light", emoji: "🚀" },
  { name: "Woody",      emoji: "🤠" },
  { name: "Elmo",       emoji: "🔴" },
  { name: "Cookie Mon", emoji: "🍪" },
  { name: "Totoro",     emoji: "🦉" },
  { name: "Sonic",      emoji: "🦔" },
  { name: "Mario",      emoji: "🍄" },
  { name: "Luigi",      emoji: "🟢" },
  { name: "Ariel",      emoji: "🧜‍♀️" },
  { name: "Elsa",       emoji: "❄️" },
  { name: "Spider-Man", emoji: "🕷️" },
  { name: "Chase Pup",  emoji: "👮" }
];

// Level definitions (shared read-only constant)
export const STAGE_LEVELS = [
  { name: "Mind Bloom",       minCoins: 0,    emoji: "🌸", badge: "Lvl 1" },
  { name: "Brain Bunny",      minCoins: 150,  emoji: "🐰", badge: "Lvl 2" },
  { name: "Puzzle Planet",    minCoins: 400,  emoji: "🪐", badge: "Lvl 3" },
  { name: "Think Tank",       minCoins: 750,  emoji: "🧠", badge: "Lvl 4" },
  { name: "Curious Kitten",   minCoins: 1200, emoji: "🐱", badge: "Lvl 5" },
  { name: "Dino Explorer",    minCoins: 1800, emoji: "🦖", badge: "Lvl 6" },
  { name: "Unicorn Sky",      minCoins: 2500, emoji: "🌈", badge: "Lvl 7" },
  { name: "Raptor Ridge",     minCoins: 3300, emoji: "🦅", badge: "Lvl 8" },
  { name: "Butterfly Meadow", minCoins: 4200, emoji: "🦋", badge: "Lvl 9" },
  { name: "Logic Legend",     minCoins: 5200, emoji: "🏆", badge: "Lvl 10" }
];

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Updates the header bar: coin count, level badge, and triggers level-up
 * celebration if appropriate.
 */
export function renderHeader(currentUser) {
  const coinCounter = document.getElementById("coin-counter");
  const levelTitleDisplay = document.getElementById("level-title-display");
  const levelBadgeDisplay = document.getElementById("level-badge-display");

  coinCounter.innerText = currentUser.gameState.coins;

  // Calculate level
  const totalCoins = currentUser.gameState.coins;
  let activeLevel = STAGE_LEVELS[0];

  for (let i = STAGE_LEVELS.length - 1; i >= 0; i--) {
    if (totalCoins >= STAGE_LEVELS[i].minCoins) {
      activeLevel = STAGE_LEVELS[i];
      break;
    }
  }

  // Check Level-up modal trigger
  if (currentUser.gameState.level < STAGE_LEVELS.indexOf(activeLevel) + 1) {
    const newLevelNum = STAGE_LEVELS.indexOf(activeLevel) + 1;

    // Level Up!
    currentUser.gameState.level = newLevelNum;
    currentUser.gameState.levelName = activeLevel.name;
    StorageService.updateGameState(currentUser.gameState);

    triggerLevelUpCelebration(activeLevel, currentUser);
  }

  levelTitleDisplay.innerText = activeLevel.name;
  levelBadgeDisplay.innerText = activeLevel.badge;
  levelBadgeDisplay.style.background = `var(--accent-color)`;
}

/**
 * Builds the avatar selection grid inside the Kids Zone.
 */
export function renderAvatarSelector(currentUser) {
  const grid = document.getElementById("kids-avatar-grid");
  if (!grid || !currentUser) return;
  grid.innerHTML = "";

  const childWelcomeBanner = document.getElementById("child-welcome-banner");
  const userAvatarText = String(currentUser.childAvatar || "");

  CARTOON_AVATARS.forEach(avatar => {
    const item = document.createElement("div");
    item.className = "avatar-item";
    if (userAvatarText.includes(avatar.name)) {
      item.classList.add("selected");
    }
    item.innerHTML = `
      <div class="avatar-item-emoji">${avatar.emoji}</div>
      <div class="avatar-item-name">${avatar.name}</div>
    `;
    item.addEventListener("click", () => {
      document.querySelectorAll("#kids-avatar-grid .avatar-item").forEach(el => el.classList.remove("selected"));
      item.classList.add("selected");

      // Update local cache and server profile
      currentUser.childAvatar = `${avatar.emoji} ${avatar.name}`;
      StorageService.updateUserProfile({ childAvatar: currentUser.childAvatar });

      // Update welcome banner immediately
      if (childWelcomeBanner) {
        childWelcomeBanner.innerHTML = `Hello, ${currentUser.childAvatar} <strong>${currentUser.childFirstName || ""} ${currentUser.childLastName || ""}</strong>! 👋`;
      }

      SoundManager.playClick();
      spawnEmojiBurst(6, currentUser);
    });
    grid.appendChild(item);
  });
}

/**
 * Sets up the sound toggle and theme selector listeners.
 * Call once during init.
 */
export function setupSoundAndTheme(getCurrentUser) {
  const btnSoundToggle = document.getElementById("btn-sound-toggle");
  const themeSelector = document.getElementById("theme-selector");

  btnSoundToggle.addEventListener("click", () => {
    const isMuted = SoundManager.toggleMute();
    btnSoundToggle.innerText = isMuted ? "🔇 Mute" : "🔊 Sound On";
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.gameState) {
      currentUser.gameState.isMuted = isMuted;
      StorageService.updateGameState({ isMuted: isMuted });
    }
    SoundManager.playClick();
  });

  // Event delegation for theme buttons
  themeSelector.addEventListener("click", (e) => {
    const btn = e.target.closest(".theme-btn");
    if (!btn) return;
    
    const newTheme = btn.getAttribute("data-theme-val");
    document.documentElement.setAttribute("data-theme", newTheme);
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.gameState) {
      currentUser.gameState.theme = newTheme;
      StorageService.updateGameState({ theme: newTheme });
    }
    SoundManager.playClick();
    
    // Update active state
    document.querySelectorAll(".theme-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    spawnEmojiBurst(8, currentUser);
  });
}

/**
 * Computes and displays average time stats in both Kids Zone and Parent Zone.
 */
export function renderTimeStats(currentUser) {
  let totalAttemptsCount = 0;
  let totalAttemptsSeconds = 0;
  let successAttemptsCount = 0;
  let successAttemptsSeconds = 0;

  if (currentUser && currentUser.gameState && currentUser.gameState.completedPuzzles) {
    const completedPuzzles = currentUser.gameState.completedPuzzles;
    Object.keys(completedPuzzles).forEach(pid => {
      const record = completedPuzzles[pid];
      if (record && record.attempts) {
        record.attempts.forEach(attempt => {
          const sec = attempt.secondsSpent || 10; // fallback for legacy
          totalAttemptsCount++;
          totalAttemptsSeconds += sec;

          if (attempt.correct === true) {
            successAttemptsCount++;
            successAttemptsSeconds += sec;
          }
        });
      }
    });
  }

  const avgAttempt = totalAttemptsCount > 0 ? Math.round(totalAttemptsSeconds / totalAttemptsCount) : 0;
  const avgSuccess = successAttemptsCount > 0 ? Math.round(successAttemptsSeconds / successAttemptsCount) : 0;

  // Update Kids Zone
  const kidsAttemptEl = document.getElementById("kids-avg-time-attempt");
  const kidsSuccessEl = document.getElementById("kids-avg-time-success");
  if (kidsAttemptEl) kidsAttemptEl.innerText = `${avgAttempt}s`;
  if (kidsSuccessEl) kidsSuccessEl.innerText = `${avgSuccess}s`;

  // Update Parent Zone
  const parentAttemptEl = document.getElementById("parent-avg-time-attempt");
  const parentSuccessEl = document.getElementById("parent-avg-time-success");
  if (parentAttemptEl) parentAttemptEl.innerText = `${avgAttempt}s`;
  if (parentSuccessEl) parentSuccessEl.innerText = `${avgSuccess}s`;
}
