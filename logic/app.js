/**
 * logic/app.js — Main Application Orchestrator
 *
 * Thin entry point: loads data, initialises modules, and manages top-level
 * routing between the auth screen and the main game view.
 *
 * All domain logic lives in dedicated modules:
 *   auth.js       — login / register / logout forms
 *   puzzle.js     — puzzle deck, arena, answer engine, canvas drawing
 *   gameState.js  — date-change checks, day advancement, review queue
 *   parentDash.js — parent gate, drawing review, stats, calendar
 *   ui/header.js  — header bar, avatar selector, sound/theme, time stats
 *   ui/history.js — puzzle history tab
 *   ui/celebrate.js — confetti, level-up modal, ambient emoji
 */

import { StorageService } from "./storage.js";
import { SoundManager } from "../helpers/sound.js";

// Module imports
import { setupAuth, resetAuthForms } from "./auth.js";
import { renderPuzzleStrip, setupPuzzleControls } from "./puzzle.js";
import { checkDateChange, checkAndTriggerReviews, setupReviewModal } from "./gameState.js";
import { loadParentGate, setupParentControls } from "./parentDash.js";
import { renderHeader, renderAvatarSelector, setupSoundAndTheme, renderTimeStats, renderLevelsProgress, renderConsistencyScore } from "./ui/header.js";
import { renderHistoryTab } from "./ui/history.js";
import { initConfetti, setupCelebrationModal, spawnFloatingEmoji } from "./ui/celebrate.js";

// ── App state ──────────────────────────────────────────────────────────────
let PUZZLES = [];
let currentUser = null;
let viewingDay = 1;

// Accessor helpers (passed to modules so they can read/write shared state)
const getCurrentUser = () => currentUser;
const getPUZZLES = () => PUZZLES;
const getViewingDay = () => viewingDay;
const setViewingDay = (d) => { viewingDay = d; };

// ── DOM handles ────────────────────────────────────────────────────────────
const authView = document.getElementById("auth-view");
const mainView = document.getElementById("main-view");

// ── Initialisation ─────────────────────────────────────────────────────────

async function init() {
  // 1. Load puzzle data
  try {
    const response = await fetch("data/puzzles.json?v=" + Date.now());
    PUZZLES = await response.json();
  } catch (e) {
    console.error("Failed to load puzzles.json:", e);
    alert("Could not load puzzles.json. Make sure the HTTP server is running!");
    return;
  }

  // 2. Load global puzzle averages (non-blocking)
  StorageService.getPuzzleAverages().catch(e => {
    console.warn("Failed to fetch puzzle averages:", e);
  });

  // 3. Wire one-time event listeners across all modules
  setupAuth({
    onLoginSuccess: (user) => {
      currentUser = user;
      showMainApp();
    },
    onLogout: () => {
      currentUser = null;
      showAuthScreen();
    }
  });

  setupPuzzleControls(getCurrentUser, getPUZZLES, getViewingDay, setViewingDay);
  setupParentControls(getCurrentUser, getPUZZLES, setViewingDay);
  setupSoundAndTheme(getCurrentUser);
  setupReviewModal(getCurrentUser);
  setupCelebrationModal();
  initConfetti();

  // Nav tab clicks
  setupTabNavigation();

  // Ambient emoji loop
  setInterval(() => spawnFloatingEmoji(currentUser), 2200);

  // Kids Zone calendar controls
  setupKidsCalendar();

  // 4. Check for existing session
  currentUser = StorageService.getCurrentUser();
  if (currentUser) {
    showMainApp();
  } else {
    showAuthScreen();
  }
}

// ── Routing ────────────────────────────────────────────────────────────────

function showAuthScreen() {
  authView.classList.remove("hidden");
  mainView.classList.add("hidden");
  resetAuthForms();
}

function showMainApp() {
  authView.classList.add("hidden");
  mainView.classList.remove("hidden");

  const childWelcomeBanner = document.getElementById("child-welcome-banner");
  childWelcomeBanner.innerHTML = `Hello, ${currentUser.childAvatar} <strong>${currentUser.childFirstName} ${currentUser.childLastName}</strong>! 👋`;

  // Date lock checker
  checkDateChange(currentUser, PUZZLES);

  // Load theme
  const userTheme = (currentUser.gameState && currentUser.gameState.theme) || "unicorn";
  document.documentElement.setAttribute("data-theme", userTheme);
  const themeContainer = document.getElementById("theme-selector");
  if (themeContainer) {
    themeContainer.querySelectorAll(".theme-btn").forEach(b => {
      b.classList.toggle("selected", b.getAttribute("data-theme-val") === userTheme);
    });
  }

  // Load sound preference
  const isMuted = (currentUser.gameState && currentUser.gameState.isMuted) || false;
  SoundManager.muted = isMuted;
  const btnSoundToggle = document.getElementById("btn-sound-toggle");
  if (btnSoundToggle) {
    btnSoundToggle.innerText = isMuted ? "🔇 Mute" : "🔊 Sound On";
  }

  viewingDay = currentUser.gameState.currentDay;

  switchTab("play");
  renderHeader(currentUser);
  renderAvatarSelector(currentUser);
  renderLevelsProgress(currentUser);
  renderConsistencyScore(currentUser);

  // Trigger daily brain power-up review if needed
  checkAndTriggerReviews(currentUser, PUZZLES);
}

// ── Tab Navigation ─────────────────────────────────────────────────────────

function switchTab(tab) {
  const tabPlay = document.getElementById("tab-play");
  const tabHistory = document.getElementById("tab-history");
  const tabKids = document.getElementById("tab-kids");
  const tabParent = document.getElementById("tab-parent");

  const playSection = document.getElementById("play-section");
  const historySection = document.getElementById("history-section");
  const kidsSection = document.getElementById("kids-section");
  const parentSection = document.getElementById("parent-section");

  [tabPlay, tabHistory, tabKids, tabParent].forEach(t => t && t.classList.remove("active"));
  [playSection, historySection, kidsSection, parentSection].forEach(s => s && s.classList.add("hidden"));

  SoundManager.playClick();

  if (tab === "play") {
    tabPlay && tabPlay.classList.add("active");
    playSection && playSection.classList.remove("hidden");
    renderPuzzleStrip(currentUser, PUZZLES, viewingDay);
  } else if (tab === "history") {
    tabHistory && tabHistory.classList.add("active");
    historySection && historySection.classList.remove("hidden");
    renderHistoryTab(currentUser, PUZZLES);
  } else if (tab === "kids") {
    tabKids && tabKids.classList.add("active");
    kidsSection && kidsSection.classList.remove("hidden");
    try { renderAvatarSelector(currentUser); } catch (e) { console.error("Failed to render avatar selector:", e); }
    try { renderCalendar(); } catch (e) { console.error("Failed to render calendar:", e); }
    try { renderTimeStats(currentUser); } catch (e) { console.error("Failed to render time stats:", e); }
  } else if (tab === "parent") {
    tabParent && tabParent.classList.add("active");
    parentSection && parentSection.classList.remove("hidden");
    loadParentGate();
  }
}

function setupTabNavigation() {
  document.getElementById("tab-play").addEventListener("click", () => switchTab("play"));
  document.getElementById("tab-history").addEventListener("click", () => switchTab("history"));
  document.getElementById("tab-kids").addEventListener("click", () => switchTab("kids"));
  document.getElementById("tab-parent").addEventListener("click", () => switchTab("parent"));
}

// ── Kids Zone Calendar ─────────────────────────────────────────────────────

let calendarDate = new Date();

function renderCalendar() {
  const monthDisplay = document.getElementById("calendar-month-year");
  const daysContainer = document.getElementById("calendar-days");
  if (!monthDisplay || !daysContainer || !currentUser) return;

  daysContainer.innerHTML = "";

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  monthDisplay.innerText = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Empty padding cells
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.style.padding = "10px";
    daysContainer.appendChild(emptyCell);
  }

  // Count completions per date
  const completedDates = {};
  const completedPuzzles = (currentUser.gameState && currentUser.gameState.completedPuzzles) || {};

  Object.keys(completedPuzzles).forEach(pid => {
    const r = completedPuzzles[pid];
    if (r && r.answered && r.timeSolved) {
      const dateStr = r.timeSolved;
      completedDates[dateStr] = (completedDates[dateStr] || 0) + 1;
    }
  });

  // Render day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement("div");
    dayCell.innerText = day;

    dayCell.style.padding = "8px";
    dayCell.style.borderRadius = "50%";
    dayCell.style.display = "flex";
    dayCell.style.alignItems = "center";
    dayCell.style.justifyContent = "center";
    dayCell.style.fontSize = "0.95rem";
    dayCell.style.fontWeight = "600";
    dayCell.style.width = "38px";
    dayCell.style.height = "38px";
    dayCell.style.margin = "0 auto";
    dayCell.style.transition = "all 0.2s";

    const mmStr = String(month + 1).padStart(2, "0");
    const ddStr = String(day).padStart(2, "0");
    const dateKey = `${year}-${mmStr}-${ddStr}`;

    const puzzlesCompletedCount = completedDates[dateKey] || 0;

    if (puzzlesCompletedCount > 0) {
      dayCell.style.background = "var(--success)";
      dayCell.style.color = "white";
      dayCell.title = `You solved ${puzzlesCompletedCount} puzzle(s) on this day! ⭐`;
      dayCell.style.boxShadow = "0 2px 6px rgba(76, 175, 80, 0.4)";
      dayCell.style.cursor = "pointer";
      dayCell.addEventListener("mouseover", () => { dayCell.style.transform = "scale(1.15)"; });
      dayCell.addEventListener("mouseout", () => { dayCell.style.transform = "scale(1)"; });
    } else {
      dayCell.style.background = "rgba(0,0,0,0.04)";
      dayCell.style.color = "var(--text-main)";
    }

    const today = new Date();
    if (today.getFullYear() === year && today.getMonth() === month && today.getDate() === day) {
      dayCell.style.border = "2px solid var(--accent-color)";
    }

    daysContainer.appendChild(dayCell);
  }
}

function setupKidsCalendar() {
  const calendarPrev = document.getElementById("calendar-prev");
  const calendarNext = document.getElementById("calendar-next");
  if (calendarPrev) {
    calendarPrev.addEventListener("click", () => {
      SoundManager.playClick();
      calendarDate.setMonth(calendarDate.getMonth() - 1);
      renderCalendar();
    });
  }
  if (calendarNext) {
    calendarNext.addEventListener("click", () => {
      SoundManager.playClick();
      calendarDate.setMonth(calendarDate.getMonth() + 1);
      renderCalendar();
    });
  }
}

// ── Start ──────────────────────────────────────────────────────────────────
init();
