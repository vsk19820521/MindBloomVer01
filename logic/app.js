/**
 * app.js - Main Application Orchestrator
 * Connects StorageService, SoundManager, and PUZZLES to index.html.
 * Handles DOM rendering, interactive canvas, parent dashboard, and confetti.
 */

import { StorageService } from "./storage.js";
import { SoundManager } from "../helpers/sound.js";
import { Logger } from "../helpers/logger.js";

// Game State variable (loaded dynamically)
let PUZZLES = [];

// Game State variables
let currentUser = null;
let activeTab = "play"; // "play" | "history" | "parent"
let viewingDay = 1;
let activePuzzle = null;
let parentGateAnswer = null;
let activePuzzleStartTime = null;
let globalPuzzleAverages = {};

// Canvas drawing state
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let brushColor = "black";
let brushSize = 5;
let isEraser = false;

// LEVEL DEFINITIONS
const STAGE_LEVELS = [
  { name: "Mind Bloom", minCoins: 0, emoji: "🌸", badge: "Lvl 1" },
  { name: "Brain Bunny", minCoins: 150, emoji: "🐰", badge: "Lvl 2" },
  { name: "Puzzle Planet", minCoins: 400, emoji: "🪐", badge: "Lvl 3" },
  { name: "Think Tank", minCoins: 750, emoji: "🧠", badge: "Lvl 4" },
  { name: "Curious Kitten", minCoins: 1200, emoji: "🐱", badge: "Lvl 5" },
  { name: "Dino Explorer", minCoins: 1800, emoji: "🦖", badge: "Lvl 6" },
  { name: "Unicorn Sky", minCoins: 2500, emoji: "🌈", badge: "Lvl 7" },
  { name: "Raptor Ridge", minCoins: 3300, emoji: "🦅", badge: "Lvl 8" },
  { name: "Butterfly Meadow", minCoins: 4200, emoji: "🦋", badge: "Lvl 9" },
  { name: "Logic Legend", minCoins: 5200, emoji: "🏆", badge: "Lvl 10" }
];

// DOM Element Selectors
const authView = document.getElementById("auth-view");
const mainView = document.getElementById("main-view");
const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

const childWelcomeBanner = document.getElementById("child-welcome-banner");
const coinCounter = document.getElementById("coin-counter");
const levelTitleDisplay = document.getElementById("level-title-display");
const levelBadgeDisplay = document.getElementById("level-badge-display");
const btnSoundToggle = document.getElementById("btn-sound-toggle");
const themeSelector = document.getElementById("theme-selector");
const btnLogout = document.getElementById("btn-logout");

const tabPlay = document.getElementById("tab-play");
const tabHistory = document.getElementById("tab-history");
const tabKids = document.getElementById("tab-kids");
const tabParent = document.getElementById("tab-parent");
const kidsSection = document.getElementById("kids-section");

const playSection = document.getElementById("play-section");
const historySection = document.getElementById("history-section");
const parentSection = document.getElementById("parent-section");

const dayDisplayLabel = document.getElementById("day-display-label");
const btnPrevDay = document.getElementById("btn-prev-day");
const btnNextDay = document.getElementById("btn-next-day");
const dailyPuzzleDeck = document.getElementById("daily-puzzle-deck");

const activePuzzleArena = document.getElementById("active-puzzle-arena");
const puzzleTitle = document.getElementById("puzzle-title");
const puzzleCategory = document.getElementById("puzzle-category");
const puzzleDifficulty = document.getElementById("puzzle-difficulty");
const puzzleReward = document.getElementById("puzzle-reward");
const puzzleAvgTime = document.getElementById("puzzle-avg-time");
const puzzleQuestion = document.getElementById("puzzle-question");

const mcContainer = document.getElementById("mc-container");
const textContainer = document.getElementById("text-container");
const textAnswerInput = document.getElementById("text-answer-input");
const drawingContainer = document.getElementById("drawing-container");
const drawingBoard = document.getElementById("drawing-board");

const btnShowHint = document.getElementById("btn-show-hint");
const hintsCount = document.getElementById("hints-count");
const hintDrawer = document.getElementById("hint-drawer");
const hintText = document.getElementById("hint-text");
const btnSubmitAnswer = document.getElementById("btn-submit-answer");

const solutionPanel = document.getElementById("solution-panel");
const solutionLockedBlock = document.getElementById("solution-locked-block");
const solutionUnlockedBlock = document.getElementById("solution-unlocked-block");
const solutionExplanationText = document.getElementById("solution-explanation-text");

const historyDaysGrid = document.getElementById("history-days-grid");
const historyDetailView = document.getElementById("history-detail-view");
const historyDayTitle = document.getElementById("history-day-title");
const historyDayPuzzlesList = document.getElementById("history-day-puzzles-list");

const parentGate = document.getElementById("parent-gate");
const parentGateInput = document.getElementById("parent-gate-input");
const btnParentGateSubmit = document.getElementById("btn-parent-gate-submit");
const parentGateError = document.getElementById("parent-gate-error");
const parentDashboardContent = document.getElementById("parent-dashboard-content");

const parentDayOverride = document.getElementById("parent-day-override");
const btnParentDaySet = document.getElementById("btn-parent-day-set");
const btnParentForceDay = document.getElementById("btn-parent-force-day");
const btnParentResetUser = document.getElementById("btn-parent-reset-user");
const btnParentDownloadLogs = document.getElementById("btn-parent-download-logs");
const parentReviewList = document.getElementById("parent-review-list");
const noDrawingsText = document.getElementById("no-drawings-text");

const celebrationModal = document.getElementById("celebration-modal");
const modalLevelEmoji = document.getElementById("modal-level-emoji");
const modalLevelName = document.getElementById("modal-level-name");
const modalLevelCoins = document.getElementById("modal-level-coins");
const btnCloseCelebration = document.getElementById("btn-close-celebration");

// Review overlay DOM elements
const reviewOverlay = document.getElementById("review-overlay");
const reviewCategory = document.getElementById("review-category");
const reviewDifficulty = document.getElementById("review-difficulty");
const reviewTitle = document.getElementById("review-title");
const reviewQuestion = document.getElementById("review-question");
const reviewWrongAnswer = document.getElementById("review-wrong-answer");
const reviewCorrectAnswer = document.getElementById("review-correct-answer");
const reviewExplanation = document.getElementById("review-explanation");
const btnReviewNext = document.getElementById("btn-review-next");

// Parent Dashboard statistics DOM elements
const parentDifficultyStats = document.getElementById("parent-difficulty-stats");
const parentCategoryStats = document.getElementById("parent-category-stats");
const parentCalendarView = document.getElementById("parent-calendar-view");
const btnParentLoadPrevMonth = document.getElementById("btn-parent-load-prev-month");

// Canvas Drawing Context
const ctx = drawingBoard.getContext("2d");

// ================= AMBIENT THEME ANIMATIONS =================

const THEME_EMOJIS = {
  unicorn: ["🦄", "🌟", "☁️", "💖", "🌈", "✨"],
  dino: ["🦖", "🦕", "🌴", "🦴", "🥚", "🍃"],
  kitty: ["🐱", "🐾", "🧶", "🐟", "🍼", "✨"],
  butterfly: ["🦋", "🌸", "🌼", "🍃", "☀️", "🌺"],
  puppy: ["🐶", "🐾", "🦴", "🎾", "🐕", "🐾"],
  dolphin: ["🐬", "🐠", "🐚", "🌊", "🐋", "🐳"],
  forest: ["🍄", "🌲", "🦉", "🦊", "🍀", "🍄"],
  candy: ["🍭", "🍬", "🍩", "🧁", "🍪", "🍫"],
  space: ["🚀", "🪐", "🛸", "👽", "☄️", "⭐"]
};

function spawnFloatingEmoji() {
  const container = document.getElementById("ambient-container");
  if (!container || !currentUser) return;

  const currentTheme = document.documentElement.getAttribute("data-theme") || "unicorn";
  const emojis = THEME_EMOJIS[currentTheme] || THEME_EMOJIS.unicorn;
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];

  const element = document.createElement("div");
  element.className = "floating-emoji";
  element.innerText = emoji;

  // Spawning on either left side (0 to 15vw) or right side (85 to 98vw) to fly on the sides
  const isLeft = Math.random() < 0.5;
  const startX = isLeft 
    ? Math.random() * 15 
    : 85 + Math.random() * 13;

  const duration = Math.random() * 5 + 8; // 8s to 13s
  const size = Math.random() * 1.5 + 2.5; // Larger size: 2.5rem to 4.0rem
  const driftX = (isLeft ? (Math.random() * 50) : (Math.random() * -50)) + "px"; // Drift slightly outwards/inwards
  const rotZ = (Math.random() * 360 - 180) + "deg";

  element.style.left = `${startX}vw`;
  element.style.animationDuration = `${duration}s`;
  element.style.fontSize = `${size}rem`;
  element.style.setProperty("--drift-x", driftX);
  element.style.setProperty("--rot-z", rotZ);

  container.appendChild(element);

  // Remove elements after floating upwards
  setTimeout(() => {
    element.remove();
  }, duration * 1000);
}

function spawnEmojiBurst(count = 10) {
  for (let i = 0; i < count; i++) {
    setTimeout(spawnFloatingEmoji, i * 140);
  }
}

// 25 famous child cartoon avatars
const CARTOON_AVATARS = [
  { name: "Pikachu", emoji: "⚡" },
  { name: "Doraemon", emoji: "🐱" },
  { name: "Simba", emoji: "🦁" },
  { name: "Bluey", emoji: "🐶" },
  { name: "Peppa Pig", emoji: "🐷" },
  { name: "Mickey Mouse", emoji: "🐭" },
  { name: "Winnie Pooh", emoji: "🐻" },
  { name: "SpongeBob", emoji: "🧽" },
  { name: "Patrick Star", emoji: "⭐" },
  { name: "Olaf", emoji: "⛄" },
  { name: "Stitch", emoji: "🐨" },
  { name: "Toothless", emoji: "🐉" },
  { name: "Hello Kitty", emoji: "🎀" },
  { name: "Buzz Light", emoji: "🚀" },
  { name: "Woody", emoji: "🤠" },
  { name: "Elmo", emoji: "🔴" },
  { name: "Cookie Mon", emoji: "🍪" },
  { name: "Totoro", emoji: "🦉" },
  { name: "Sonic", emoji: "🦔" },
  { name: "Mario", emoji: "🍄" },
  { name: "Luigi", emoji: "🟢" },
  { name: "Ariel", emoji: "🧜‍♀️" },
  { name: "Elsa", emoji: "❄️" },
  { name: "Spider-Man", emoji: "🕷️" },
  { name: "Chase Pup", emoji: "👮" }
];

function renderAvatarSelector() {
  const grid = document.getElementById("kids-avatar-grid");
  if (!grid || !currentUser) return;
  grid.innerHTML = "";

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
      spawnEmojiBurst(6);
    });
    grid.appendChild(item);
  });
}

// ================= APP INITIALIZATION =================

async function init() {
  // Load puzzles from external puzzles.json
  try {
    const response = await fetch("data/puzzles.json?v=" + Date.now());
    PUZZLES = await response.json();
  } catch (e) {
    console.error("Failed to load puzzles.json:", e);
    alert("Could not load puzzles.json. Make sure the HTTP server is running!");
    return;
  }

  // Load global puzzle averages
  try {
    globalPuzzleAverages = await StorageService.getPuzzleAverages();
  } catch (e) {
    console.warn("Failed to fetch puzzle averages:", e);
  }

  // Check if session exists
  currentUser = StorageService.getCurrentUser();
  if (currentUser) {
    showMainApp();
  } else {
    showAuthScreen();
  }

  // Setup Event Listeners
  setupEventListeners();
  initConfetti();
  renderAvatarSelector();

  // Start background ambient floating elements loop
  setInterval(spawnFloatingEmoji, 2200);
}

// ================= ROUTING & VIEWS =================

function showAuthScreen() {
  authView.classList.remove("hidden");
  mainView.classList.add("hidden");
  resetAuthForms();
}

function showMainApp() {
  authView.classList.add("hidden");
  mainView.classList.remove("hidden");
  
  // Welcome and sync state
  childWelcomeBanner.innerHTML = `Hello, ${currentUser.childAvatar} <strong>${currentUser.childFirstName} ${currentUser.childLastName}</strong>! 👋`;
  
  // Date lock checker
  checkDateChange();

  // Load level and theme
  const userTheme = (currentUser.gameState && currentUser.gameState.theme) || "unicorn";
  document.documentElement.setAttribute("data-theme", userTheme);
  themeSelector.value = userTheme;

  // Load sound preference
  const isMuted = (currentUser.gameState && currentUser.gameState.isMuted) || false;
  SoundManager.muted = isMuted;
  if (btnSoundToggle) {
    btnSoundToggle.innerText = isMuted ? "🔇 Mute" : "🔊 Sound On";
  }
  
  viewingDay = currentUser.gameState.currentDay;
  
  switchTab("play");
  renderHeader();
  renderPuzzleStrip();
  
  // Trigger daily brain power-up review if needed
  checkAndTriggerReviews();
}

function resetAuthForms() {
  loginForm.reset();
  registerForm.reset();
  tabLogin.click();
}

function switchTab(tab) {
  activeTab = tab;
  
  if (tabPlay) tabPlay.classList.remove("active");
  if (tabHistory) tabHistory.classList.remove("active");
  if (tabKids) tabKids.classList.remove("active");
  if (tabParent) tabParent.classList.remove("active");
  
  if (playSection) playSection.classList.add("hidden");
  if (historySection) historySection.classList.add("hidden");
  if (kidsSection) kidsSection.classList.add("hidden");
  if (parentSection) parentSection.classList.add("hidden");

  SoundManager.playClick();
  
  if (tab === "play") {
    if (tabPlay) tabPlay.classList.add("active");
    if (playSection) playSection.classList.remove("hidden");
    renderPuzzleStrip();
  } else if (tab === "history") {
    if (tabHistory) tabHistory.classList.add("active");
    if (historySection) historySection.classList.remove("hidden");
    renderHistoryTab();
  } else if (tab === "kids") {
    if (tabKids) tabKids.classList.add("active");
    if (kidsSection) kidsSection.classList.remove("hidden");
    try {
      renderAvatarSelector();
    } catch (e) {
      console.error("Failed to render avatar selector:", e);
    }
    try {
      renderCalendar();
    } catch (e) {
      console.error("Failed to render calendar:", e);
    }
    try {
      renderTimeStats();
    } catch (e) {
      console.error("Failed to render time stats:", e);
    }
  } else if (tab === "parent") {
    if (tabParent) tabParent.classList.add("active");
    if (parentSection) parentSection.classList.remove("hidden");
    loadParentGate();
  }
}

// ================= AUTH EVENT HANDLERS =================

function showAuthError(message) {
  const authError = document.getElementById("auth-error");
  if (authError) {
    authError.innerText = message;
    authError.classList.remove("hidden");
  }
}

function hideAuthError() {
  const authError = document.getElementById("auth-error");
  if (authError) {
    authError.classList.add("hidden");
  }
}

tabLogin.addEventListener("click", () => {
  hideAuthError();
  tabLogin.classList.add("active");
  tabRegister.classList.remove("active");
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
  SoundManager.playClick();
});

tabRegister.addEventListener("click", () => {
  hideAuthError();
  tabRegister.classList.add("active");
  tabLogin.classList.remove("active");
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  SoundManager.playClick();
});

// Register submit
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAuthError();
  
  const password = document.getElementById("reg-password").value;
  const confirmPassword = document.getElementById("reg-confirm-password").value;
  if (password !== confirmPassword) {
    SoundManager.playError();
    showAuthError("Passwords do not match. Please retype your password.");
    return;
  }
  
  const parentCode = document.getElementById("parent-code").value.trim();
  if (!/^\d{4}$/.test(parentCode)) {
    SoundManager.playError();
    showAuthError("Parent secret code must be exactly 4 digits!");
    return;
  }

  const parentData = {
    email: document.getElementById("parent-email").value,
    phone: document.getElementById("parent-phone").value,
    code: parentCode
  };
  
  const childData = {
    firstName: document.getElementById("child-first-name").value,
    lastName: document.getElementById("child-last-name").value,
    gender: document.getElementById("child-gender").value,
    age: document.getElementById("child-age").value,
    avatar: document.getElementById("child-avatar").value,
    livingCountry: document.getElementById("child-country").value,
    culturalAffiliation: document.getElementById("child-culture").value
  };
  
  const credentials = {
    username: document.getElementById("reg-username").value,
    password: password
  };

  const res = await StorageService.registerUser(parentData, childData, credentials);
  if (res.success) {
    SoundManager.playSuccess();
    // Auto-login
    const loginRes = await StorageService.loginUser(credentials.username, credentials.password);
    if (loginRes.success) {
      currentUser = loginRes.user;
      showMainApp();
    }
  } else {
    SoundManager.playError();
    showAuthError(res.error);
  }
});

// Login submit
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAuthError();
  const u = document.getElementById("login-username").value;
  const p = document.getElementById("login-password").value;

  const res = await StorageService.loginUser(u, p);
  if (res.success) {
    SoundManager.playSuccess();
    currentUser = res.user;
    showMainApp();
  } else {
    SoundManager.playError();
    showAuthError(res.error);
  }
});

btnLogout.addEventListener("click", () => {
  SoundManager.playClick();
  StorageService.logoutUser();
  currentUser = null;
  showAuthScreen();
});

// ================= DATE MANAGEMENT =================

function checkDateChange() {
  const today = new Date().toISOString().split("T")[0];
  const lastActive = currentUser.gameState.lastActiveDate;
  
  if (today !== lastActive) {
    // Check if the previous day was fully completed (all 5 puzzles answered)
    const currentDayPuzzles = getPuzzlesForDay(currentUser.gameState.currentDay);
    const allDone = currentDayPuzzles.every(p => {
      const solved = currentUser.gameState.completedPuzzles[p.id];
      return solved && solved.answered === true;
    });

    if (allDone) {
      // Advance current day
      const nextDay = currentUser.gameState.currentDay + 1;
      currentUser.gameState.currentDay = nextDay;
      currentUser.gameState.unlockedUpToDay = Math.max(currentUser.gameState.unlockedUpToDay, nextDay);
    }
    
    // Update active date
    currentUser.gameState.lastActiveDate = today;
    StorageService.updateGameState(currentUser.gameState);
  }
}

// ================= HEADER & STATS =================

function renderHeader() {
  coinCounter.innerText = currentUser.gameState.coins;
  
  // Calculate Level
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
    const oldLevelNum = currentUser.gameState.level;
    const newLevelNum = STAGE_LEVELS.indexOf(activeLevel) + 1;
    
    // Level Up!
    currentUser.gameState.level = newLevelNum;
    currentUser.gameState.levelName = activeLevel.name;
    StorageService.updateGameState(currentUser.gameState);
    
    triggerLevelUpCelebration(activeLevel);
  }

  levelTitleDisplay.innerText = activeLevel.name;
  levelBadgeDisplay.innerText = activeLevel.badge;
  levelBadgeDisplay.style.background = `var(--accent-color)`;
}

// ================= SOUND & THEME =================

btnSoundToggle.addEventListener("click", () => {
  const isMuted = SoundManager.toggleMute();
  btnSoundToggle.innerText = isMuted ? "🔇 Mute" : "🔊 Sound On";
  if (currentUser && currentUser.gameState) {
    currentUser.gameState.isMuted = isMuted;
    StorageService.updateGameState({ isMuted: isMuted });
  }
  SoundManager.playClick();
});

themeSelector.addEventListener("change", (e) => {
  const newTheme = e.target.value;
  document.documentElement.setAttribute("data-theme", newTheme);
  if (currentUser && currentUser.gameState) {
    currentUser.gameState.theme = newTheme;
    StorageService.updateGameState({ theme: newTheme });
  }
  SoundManager.playClick();
  spawnEmojiBurst(8);
});

// ================= PUZZLE SELECTION & CARD DECK =================

function getPuzzlesForDay(dayNum) {
  return PUZZLES.filter(p => p.day === parseInt(dayNum));
}

function renderPuzzleStrip() {
  dayDisplayLabel.innerText = `Day ${viewingDay}`;
  dailyPuzzleDeck.innerHTML = "";
  
  const maxDayInJson = PUZZLES.length > 0 ? Math.max(...PUZZLES.map(p => p.day)) : 1;
  const maxAvailableDay = Math.min(currentUser.gameState.unlockedUpToDay, maxDayInJson);

  // Nav buttons locks
  btnPrevDay.disabled = viewingDay <= 1;
  btnNextDay.disabled = viewingDay >= maxAvailableDay;

  const dayPuzzles = getPuzzlesForDay(viewingDay);
  
  dayPuzzles.forEach((puzzle, index) => {
    const card = document.createElement("div");
    card.className = "puzzle-card";
    
    // Completion state
    const record = currentUser.gameState.completedPuzzles[puzzle.id];
    const isCompleted = record && record.answered;
    
    // Sequence Locking: Puzzle is locked if it's not completed AND any previous puzzle in the sequence is not completed
    let isSequenceLocked = false;
    if (viewingDay === currentUser.gameState.unlockedUpToDay) {
      for (let i = 0; i < index; i++) {
        const prevPuzzle = dayPuzzles[i];
        const prevRecord = currentUser.gameState.completedPuzzles[prevPuzzle.id];
        if (!prevRecord || !prevRecord.answered) {
          isSequenceLocked = true;
          break;
        }
      }
    }
    
    if (isCompleted) {
      if (record.correct === false && !record.pendingApproval) {
        card.classList.add("incorrect");
      } else {
        card.classList.add("completed");
      }
    } else if (isSequenceLocked) {
      card.classList.add("locked");
    }

    // Design layout
    let statusIcon = "⚡";
    if (isCompleted) {
      if (record.pendingApproval) {
        statusIcon = "⏳";
      } else if (record.correct) {
        statusIcon = "✅";
      } else {
        statusIcon = "❌";
      }
    } else if (isSequenceLocked) {
      statusIcon = "🔒";
    }

    card.innerHTML = `
      <div class="puzzle-number-badge">${puzzle.number}</div>
      <h4 class="puzzle-card-title">${puzzle.title}</h4>
      <div class="puzzle-reward-tag">💎 ${puzzle.coinsReward} Coins</div>
      <div class="puzzle-status-icon">${statusIcon}</div>
    `;

    card.addEventListener("click", () => {
      if (isSequenceLocked) {
        SoundManager.playError();
        alert("Solve the previous puzzles first to unlock this one!");
      } else {
        SoundManager.playClick();
        loadActivePuzzle(puzzle);
      }
    });

    dailyPuzzleDeck.appendChild(card);
  });

  // Auto-load first incomplete or first puzzle
  if (dayPuzzles.length > 0) {
    let toLoad = dayPuzzles[0];
    for (let i = 0; i < dayPuzzles.length; i++) {
      const p = dayPuzzles[i];
      const r = currentUser.gameState.completedPuzzles[p.id];
      const prevDone = i === 0 || (currentUser.gameState.completedPuzzles[dayPuzzles[i-1].id] && currentUser.gameState.completedPuzzles[dayPuzzles[i-1].id].answered);
      if ((!r || !r.answered) && prevDone) {
        toLoad = p;
        break;
      }
    }
    loadActivePuzzle(toLoad);
  }
}

btnPrevDay.addEventListener("click", () => {
  if (viewingDay > 1) {
    viewingDay--;
    SoundManager.playClick();
    renderPuzzleStrip();
  }
});

btnNextDay.addEventListener("click", () => {
  if (viewingDay < currentUser.gameState.unlockedUpToDay) {
    viewingDay++;
    SoundManager.playClick();
    renderPuzzleStrip();
  }
});

// ================= PUZZLE ARENA PLAY ENGINE =================

function loadActivePuzzle(puzzle) {
  activePuzzle = puzzle;
  activePuzzleStartTime = Date.now();
  activePuzzleArena.classList.remove("hidden");

  const targetTime = puzzle.difficulty === "Easy" ? 20 : (puzzle.difficulty === "Medium" ? 30 : 40);
  if (puzzleAvgTime) {
    puzzleAvgTime.innerText = `⏱️ Target Time: ${targetTime}s`;
  }
  
  puzzleTitle.innerText = puzzle.title;
  puzzleCategory.innerText = puzzle.category;
  puzzleDifficulty.innerText = puzzle.difficulty;
  puzzleReward.innerText = `💎 ${puzzle.coinsReward} Coins`;
  puzzleQuestion.innerText = puzzle.question;
  
  // Set difficulty styles
  puzzleDifficulty.className = "meta-tag";
  puzzleDifficulty.classList.add(`difficulty-${puzzle.difficulty.toLowerCase()}`);

  // Setup inputs
  mcContainer.classList.add("hidden");
  textContainer.classList.add("hidden");
  drawingContainer.classList.add("hidden");
  
  // Reset hint drawers
  hintDrawer.classList.add("hidden");
  btnShowHint.classList.remove("hidden");
  hintsCount.innerText = puzzle.hints.length;

  const record = currentUser.gameState.completedPuzzles[puzzle.id];
  const isCompleted = record && record.answered;

  if (puzzle.type === "multiple-choice") {
    mcContainer.classList.remove("hidden");
    mcContainer.innerHTML = "";
    puzzle.options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.innerText = opt;
      
      if (isCompleted && record.userAnswer === opt) {
        btn.classList.add("selected");
      }

      btn.addEventListener("click", () => {
        if (isCompleted) return;
        SoundManager.playClick();
        document.querySelectorAll(".option-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
      });
      mcContainer.appendChild(btn);
    });
  } else if (puzzle.type === "text-input") {
    textContainer.classList.remove("hidden");
    textAnswerInput.value = isCompleted ? record.userAnswer : "";
    textAnswerInput.disabled = isCompleted;
  } else if (puzzle.type === "drawing") {
    drawingContainer.classList.remove("hidden");
    clearCanvas();
    if (isCompleted && record.userAnswer) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = record.userAnswer;
    }
  }

  // Answer Solution reveal check
  solutionPanel.classList.remove("hidden");
  
  // Solution unlocks if the day is completed and date has passed (i.e. unlockedUpToDay > puzzle.day) OR parent override
  const isConsecutiveDay = currentUser.gameState.unlockedUpToDay > puzzle.day;
  if (isConsecutiveDay) {
    solutionLockedBlock.classList.add("hidden");
    solutionUnlockedBlock.classList.remove("hidden");
    solutionExplanationText.innerText = puzzle.explanation;
  } else {
    solutionLockedBlock.classList.remove("hidden");
    solutionUnlockedBlock.classList.add("hidden");
  }

  // Action Buttons toggle
  if (isCompleted) {
    btnSubmitAnswer.classList.add("hidden");
    btnShowHint.classList.add("hidden");
  } else {
    btnSubmitAnswer.classList.remove("hidden");
    btnShowHint.classList.remove("hidden");
  }
}

// Hints Display
btnShowHint.addEventListener("click", () => {
  SoundManager.playClick();
  const hintIndex = activePuzzle.hints.length - parseInt(hintsCount.innerText);
  
  if (hintIndex < activePuzzle.hints.length) {
    hintDrawer.classList.remove("hidden");
    hintText.innerText = `Hint: ${activePuzzle.hints[hintIndex]}`;
    
    const remaining = activePuzzle.hints.length - (hintIndex + 1);
    hintsCount.innerText = remaining;
    if (remaining <= 0) {
      btnShowHint.classList.add("hidden");
    }
  }
});

// ================= DAILY REVIEW (BRAIN POWER-UP) SYSTEM =================
let reviewQueue = [];
let currentReviewIndex = 0;

function checkAndTriggerReviews() {
  if (!currentUser || !currentUser.gameState || !currentUser.gameState.completedPuzzles) return;

  const today = new Date().toISOString().split("T")[0];
  reviewQueue = [];
  currentReviewIndex = 0;

  // Scan all puzzles in the system to find unreviewed previous-day incorrect attempts
  PUZZLES.forEach(puzzle => {
    const record = currentUser.gameState.completedPuzzles[puzzle.id];
    if (record && record.needsReview && !record.reviewed) {
      const hasPrevDayIncorrect = record.attempts && record.attempts.some(attempt => {
        return !attempt.correct && attempt.dateAttempted < today;
      });

      if (hasPrevDayIncorrect) {
        reviewQueue.push({
          puzzle,
          record
        });
      }
    }
  });

  if (reviewQueue.length > 0) {
    showReviewModal();
  }
}

function showReviewModal() {
  if (currentReviewIndex >= reviewQueue.length) {
    // All caught up!
    reviewOverlay.classList.add("hidden");
    SoundManager.playSuccess();
    alert("🎉 Fantastic job! You have reviewed all your tricky puzzles from yesterday. Your brain is now powered up! Let's start playing today's puzzles! 🚀");
    return;
  }

  reviewOverlay.classList.remove("hidden");
  const { puzzle, record } = reviewQueue[currentReviewIndex];

  reviewCategory.innerText = puzzle.category;
  reviewDifficulty.innerText = puzzle.difficulty;
  reviewDifficulty.className = "difficulty-badge";
  reviewDifficulty.classList.add(puzzle.difficulty.toLowerCase());
  reviewTitle.innerText = puzzle.title;
  reviewQuestion.innerText = puzzle.question;

  // Gather and format wrong attempts
  const wrongAnswers = record.attempts
    .filter(a => !a.correct)
    .map(a => `"${a.userAnswer}"`)
    .join(", ");
  reviewWrongAnswer.innerText = wrongAnswers || "No response recorded";

  reviewCorrectAnswer.innerText = `"${puzzle.correctAnswer}"`;
  reviewExplanation.innerText = puzzle.explanation || "No explanation is available.";

  // Dynamic button labels
  if (currentReviewIndex < reviewQueue.length - 1) {
    btnReviewNext.innerText = "Understood, show next! 👉";
  } else {
    btnReviewNext.innerText = "I understand this now! Let's Play! 🚀";
  }
}

btnReviewNext.addEventListener("click", () => {
  SoundManager.playClick();
  const currentItem = reviewQueue[currentReviewIndex];
  if (currentItem) {
    // Mark as reviewed
    const pid = currentItem.puzzle.id;
    currentUser.gameState.completedPuzzles[pid].reviewed = true;
    StorageService.updateGameState(currentUser.gameState);
  }

  currentReviewIndex++;
  showReviewModal();
});

// Submit/Check Answer click
btnSubmitAnswer.addEventListener("click", () => {
  if (!activePuzzle) return;

  const record = currentUser.gameState.completedPuzzles[activePuzzle.id];
  if (record && record.answered) return; // already solved

  const secondsSpent = activePuzzleStartTime ? Math.max(1, Math.round((Date.now() - activePuzzleStartTime) / 1000)) : 10;
  // reset timer for next attempt
  activePuzzleStartTime = Date.now();

  let isCorrect = false;
  let userAnswer = null;

  if (activePuzzle.type === "multiple-choice") {
    const selectedBtn = mcContainer.querySelector(".option-btn.selected");
    if (!selectedBtn) {
      alert("Please select one of the options!");
      return;
    }
    userAnswer = selectedBtn.innerText;
    isCorrect = (userAnswer === activePuzzle.correctAnswer);
  } else if (activePuzzle.type === "text-input") {
    userAnswer = textAnswerInput.value.trim();
    if (!userAnswer) {
      alert("Please type in an answer!");
      return;
    }
    isCorrect = (userAnswer.toLowerCase() === activePuzzle.correctAnswer.toLowerCase());
  } else if (activePuzzle.type === "drawing") {
    // Drawing verification logic
    userAnswer = drawingBoard.toDataURL();
    
    // Add to completed puzzles but marked as pending approval.
    // When parent approves, they will click verification and reward full coins.
    const existingRecord = currentUser.gameState.completedPuzzles[activePuzzle.id] || { attempts: [] };
    const newAttempts = [...(existingRecord.attempts || [])];
    newAttempts.push({
      userAnswer: "[Canvas Drawing]",
      timeAttempted: new Date().toISOString(),
      dateAttempted: new Date().toISOString().split("T")[0],
      correct: null,
      secondsSpent: secondsSpent
    });

    currentUser.gameState.completedPuzzles[activePuzzle.id] = {
      answered: true,
      correct: null, // pending review
      userAnswer: userAnswer,
      pendingApproval: true,
      coinsAwarded: 0,
      timeSolved: new Date().toISOString().split("T")[0],
      attempts: newAttempts
    };
    
    SoundManager.playSuccess();
    StorageService.updateGameState(currentUser.gameState);
    
    alert("🎨 Super! Drawing submitted to Mom/Dad. Ask them to approve it in the Parent Zone!");
    
    renderPuzzleStrip();
    checkAllDayPuzzlesCompleted();
    return;
  }

  // MC and Text evaluation
  if (isCorrect) {
    SoundManager.playCoin();
    
    const targetTime = activePuzzle.difficulty === "Easy" ? 20 : (activePuzzle.difficulty === "Medium" ? 30 : 40);
    const isSpeedBonus = (secondsSpent < targetTime);
    const bonusCoins = isSpeedBonus ? 2 : 0;
    
    // Add coins
    currentUser.gameState.coins += activePuzzle.coinsReward + bonusCoins;
    
    // Save completion
    const existingRecord = currentUser.gameState.completedPuzzles[activePuzzle.id] || { attempts: [] };
    const newAttempts = [...(existingRecord.attempts || [])];
    newAttempts.push({
      userAnswer: userAnswer,
      timeAttempted: new Date().toISOString(),
      dateAttempted: new Date().toISOString().split("T")[0],
      correct: true,
      secondsSpent: secondsSpent
    });

    currentUser.gameState.completedPuzzles[activePuzzle.id] = {
      answered: true,
      correct: true,
      userAnswer: userAnswer,
      coinsAwarded: activePuzzle.coinsReward + bonusCoins,
      speedBonusAwarded: isSpeedBonus,
      timeSolved: new Date().toISOString().split("T")[0],
      needsReview: existingRecord.needsReview || false,
      reviewed: existingRecord.reviewed || false,
      attempts: newAttempts
    };
    
    StorageService.updateGameState(currentUser.gameState);
    
    // Trigger effects
    startConfetti();
    spawnEmojiBurst(12);
    renderHeader();
    renderPuzzleStrip();
    
    if (isSpeedBonus) {
      alert(`🎉 Awesome! You solved the puzzle in only ${secondsSpent}s (beating the Target Time of ${targetTime}s)! You earned 💎 ${activePuzzle.coinsReward} gold coins + 💎 2 Speed Bonus coins! 🚀`);
    } else {
      alert(`🎉 Correct! You earned 💎 ${activePuzzle.coinsReward} gold coins!`);
    }
    
    checkAllDayPuzzlesCompleted();
  } else {
    SoundManager.playError();

    // Log incorrect attempt
    const existingRecord = currentUser.gameState.completedPuzzles[activePuzzle.id] || { attempts: [] };
    const newAttempts = [...(existingRecord.attempts || [])];
    newAttempts.push({
      userAnswer: userAnswer,
      timeAttempted: new Date().toISOString(),
      dateAttempted: new Date().toISOString().split("T")[0],
      correct: false,
      secondsSpent: secondsSpent
    });

    currentUser.gameState.completedPuzzles[activePuzzle.id] = {
      answered: true,
      correct: false,
      userAnswer: userAnswer,
      coinsAwarded: 0,
      timeSolved: "",
      needsReview: true,
      reviewed: false,
      attempts: newAttempts
    };

    StorageService.updateGameState(currentUser.gameState);
    
    renderPuzzleStrip();
    
    alert(`❌ Oops! That is incorrect. You only get one attempt per puzzle. You can review the correct answer and explanation tomorrow! Let's try another puzzle! 🌟`);
    
    checkAllDayPuzzlesCompleted();
  }
});

function checkAllDayPuzzlesCompleted() {
  const currentDayPuzzles = getPuzzlesForDay(currentUser.gameState.currentDay);
  const allDone = currentDayPuzzles.every(p => {
    const r = currentUser.gameState.completedPuzzles[p.id];
    return r && r.answered;
  });

  if (allDone) {
    const nextDay = currentUser.gameState.currentDay + 1;
    const maxDayInJson = PUZZLES.length > 0 ? Math.max(...PUZZLES.map(p => p.day)) : 1;
    
    let unlockedNewDay = false;
    if (nextDay <= maxDayInJson) {
      if (nextDay > currentUser.gameState.unlockedUpToDay) {
        currentUser.gameState.unlockedUpToDay = nextDay;
        StorageService.updateGameState(currentUser.gameState);
        unlockedNewDay = true;
      }
    }

    setTimeout(() => {
      if (unlockedNewDay) {
        alert(`🎉 Wonderful job! You completed all 5 puzzles for Day ${currentUser.gameState.currentDay}! Day ${nextDay} is now unlocked! Click the arrow to check it out! 🚀`);
      } else {
        alert(`🎉 Wonderful job! You completed all 5 puzzles for Day ${currentUser.gameState.currentDay}!`);
      }
      renderPuzzleStrip();
    }, 800);
  }
}

// ================= HISTORY REVIEW SYSTEM =================

function renderHistoryTab() {
  historyDaysGrid.innerHTML = "";
  historyDetailView.classList.add("hidden");

  // Get completed days
  const maxDay = currentUser.gameState.unlockedUpToDay;
  
  for (let d = 1; d <= maxDay; d++) {
    // Day card
    const card = document.createElement("div");
    card.className = "puzzle-card";
    
    const dayPuzzles = getPuzzlesForDay(d);
    const solvedCount = dayPuzzles.filter(p => {
      const r = currentUser.gameState.completedPuzzles[p.id];
      return r && r.answered;
    }).length;
    
    const isDayFull = (solvedCount === 5);
    if (isDayFull) {
      card.classList.add("completed");
    }

    card.innerHTML = `
      <div class="puzzle-number-badge" style="background: var(--accent-color); color: var(--accent-text)">D${d}</div>
      <h4 class="puzzle-card-title">Day ${d}</h4>
      <div style="font-size:0.85rem; color: var(--text-muted);">${solvedCount}/5 Solved</div>
      <div class="puzzle-status-icon">${isDayFull ? "🏆" : "✏️"}</div>
    `;

    card.addEventListener("click", () => {
      SoundManager.playClick();
      loadHistoryDayDetails(d);
    });

    historyDaysGrid.appendChild(card);
  }
}

function loadHistoryDayDetails(dayNum) {
  historyDetailView.classList.remove("hidden");
  historyDayTitle.innerText = `Day ${dayNum} Review & Explanations`;
  historyDayPuzzlesList.innerHTML = "";

  const dayPuzzles = getPuzzlesForDay(dayNum);
  
  dayPuzzles.forEach(puzzle => {
    const record = currentUser.gameState.completedPuzzles[puzzle.id];
    const item = document.createElement("div");
    item.className = "review-item glass-panel";
    item.style.padding = "18px";
    
    let userAnsDisplay = "No answer submitted";
    let scoreDisplay = "❌ Incomplete";

    if (record && record.answered) {
      if (puzzle.type === "drawing") {
        userAnsDisplay = `<img class="review-img" src="${record.userAnswer}" style="display:block; margin: 10px 0;">`;
        scoreDisplay = record.pendingApproval ? "⏳ Pending Review" : "✅ Approved";
      } else {
        userAnsDisplay = `<strong>Your Answer:</strong> ${record.userAnswer}`;
        scoreDisplay = record.correct ? "✅ Correct" : "❌ Incorrect";
      }
    }

    item.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px dashed var(--card-border); padding-bottom:8px; margin-bottom:12px;">
        <h4 style="color: var(--primary-color);">${puzzle.number}. ${puzzle.title}</h4>
        <span class="meta-tag">${scoreDisplay}</span>
      </div>
      <p style="margin-bottom:12px;"><strong>Question:</strong> ${puzzle.question}</p>
      <div style="margin-bottom:12px; font-size: 0.95rem; color: var(--text-muted);">${userAnsDisplay}</div>
      <div style="background: rgba(76, 175, 80, 0.08); border-left: 4px solid var(--success); padding: 12px; border-radius: var(--radius-sm);">
        <strong style="color: var(--success); display:block; margin-bottom:4px;">✨ Explanation:</strong>
        <p style="font-size:0.95rem; line-height: 1.5;">${puzzle.explanation}</p>
      </div>
    `;
    historyDayPuzzlesList.appendChild(item);
  });

  // Smooth scroll
  historyDetailView.scrollIntoView({ behavior: "smooth" });
}

// ================= PARENT GATE & SETTINGS =================

function loadParentGate() {
  parentGate.classList.remove("hidden");
  parentDashboardContent.classList.add("hidden");
  parentGateInput.value = "";
  parentGateError.classList.add("hidden");
}

btnParentGateSubmit.addEventListener("click", () => {
  SoundManager.playClick();
  const inputVal = parentGateInput.value;
  const expectedCode = currentUser ? (currentUser.parentCode || "0000") : "0000";
  
  if (StorageService.verifyParentGate(inputVal, expectedCode)) {
    SoundManager.playSuccess();
    parentGate.classList.add("hidden");
    parentDashboardContent.classList.remove("hidden");
    renderParentDashboard();
  } else {
    SoundManager.playError();
    parentGateError.classList.remove("hidden");
    parentGateError.innerText = "Incorrect code! Parents only.";
    parentGateInput.value = ""; // Clear incorrect input
  }
});

function renderParentDashboard() {
  parentDayOverride.value = currentUser.gameState.currentDay;
  renderParentDrawings();
  
  // Render new metrics
  renderParentDifficultyStats();
  renderParentCategoryStats();
  renderParentCalendarView();
  renderTimeStats();
}

function renderParentDifficultyStats() {
  if (!parentDifficultyStats) return;
  parentDifficultyStats.innerHTML = "";
  
  const levels = ["Easy", "Medium", "Hard"];
  
  levels.forEach(lvl => {
    // Count successful attempts (solved puzzles) of that difficulty
    const solved = PUZZLES.filter(p => {
      if (p.difficulty !== lvl) return false;
      const rec = currentUser.gameState.completedPuzzles[p.id];
      return rec && rec.answered;
    }).length;

    // Count total attempts of that difficulty
    let totalAttempts = 0;
    PUZZLES.forEach(p => {
      if (p.difficulty === lvl) {
        const rec = currentUser.gameState.completedPuzzles[p.id];
        if (rec) {
          if (rec.attempts && rec.attempts.length > 0) {
            totalAttempts += rec.attempts.length;
          } else if (rec.answered) {
            totalAttempts += 1; // Fallback for legacy records
          }
        }
      }
    });

    const percent = totalAttempts > 0 ? Math.round((solved / totalAttempts) * 100) : 0;
    
    const container = document.createElement("div");
    container.className = "parent-progress-bar-container";
    container.innerHTML = `
      <div class="parent-progress-bar-label">
        <span style="font-weight: bold;">${lvl}</span>
        <span>${solved}/${totalAttempts} (Solved: ${percent}%)</span>
      </div>
      <div class="parent-progress-bar-bg">
        <div class="parent-progress-bar-fill ${lvl.toLowerCase()}" style="width: ${percent}%;"></div>
      </div>
    `;
    parentDifficultyStats.appendChild(container);
  });
}

function renderParentCategoryStats() {
  if (!parentCategoryStats) return;
  parentCategoryStats.innerHTML = "";
  
  // Get all unique categories in PUZZLES
  const categories = [...new Set(PUZZLES.map(p => p.category))];
  
  const stats = categories.map(cat => {
    const catPuzzles = PUZZLES.filter(p => p.category === cat);
    
    let totalAttempts = 0;
    let succeeded = 0;
    
    catPuzzles.forEach(p => {
      const rec = currentUser.gameState.completedPuzzles[p.id];
      if (rec) {
        if (rec.attempts && rec.attempts.length > 0) {
          totalAttempts += rec.attempts.length;
        } else if (rec.answered) {
          totalAttempts += 1;
        }
        if (rec.answered) {
          succeeded++;
        }
      }
    });

    return {
      category: cat,
      totalAttempts,
      succeeded
    };
  });

  // Sort by succeeded count desc, then totalAttempts count desc
  stats.sort((a, b) => b.succeeded - a.succeeded || b.totalAttempts - a.totalAttempts);

  stats.forEach(item => {
    let badgeHtml = "";
    const percent = item.totalAttempts > 0 ? Math.round((item.succeeded / item.totalAttempts) * 100) : 0;
    
    if (item.totalAttempts > 0) {
      let badgeClass = "average";
      let badgeText = "Learning";
      const ratio = item.succeeded / item.totalAttempts;
      
      if (ratio >= 0.8) {
        badgeClass = "strength";
        badgeText = "Strength 🌟";
      } else if (ratio < 0.5) {
        badgeClass = "needs-work";
        badgeText = "Needs Work 💡";
      }
      
      badgeHtml = `<span class="skill-category-badge ${badgeClass}">${badgeText}</span>`;
    }

    const row = document.createElement("div");
    row.className = "skill-category-item";
    row.innerHTML = `
      <span class="skill-category-name" title="${item.category}">${item.category}</span>
      <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: auto; margin-right: 12px;">
        ${item.succeeded}/${item.totalAttempts} (Solved: ${percent}%)
      </span>
      ${badgeHtml}
    `;
    parentCategoryStats.appendChild(row);
  });
}

function renderMonthCalendar(year, month, container) {
  const monthName = new Date(year, month, 1).toLocaleString("default", { month: "short" });
  
  const monthCard = document.createElement("div");
  monthCard.style.cssText = "flex: 1; min-width: 250px; max-width: 320px;";
  
  const title = document.createElement("h5");
  title.style.cssText = "margin: 0 0 10px 0; font-size: 0.9rem; text-align: center; color: var(--text-muted); font-family: var(--font-title);";
  title.innerText = `${monthName} ${year}`;
  monthCard.appendChild(title);
  
  const grid = document.createElement("div");
  grid.className = "calendar-grid-container";
  
  const daysHeader = ["S", "M", "T", "W", "T", "F", "S"];
  daysHeader.forEach(h => {
    const el = document.createElement("div");
    el.className = "calendar-day-header";
    el.innerText = h;
    grid.appendChild(el);
  });

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split("T")[0];

  // Empty cells
  for (let i = 0; i < firstDayIndex; i++) {
    const el = document.createElement("div");
    el.className = "calendar-day-cell empty";
    grid.appendChild(el);
  }

  // Days of month
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    let attemptedCount = 0;
    let solvedCount = 0;

    if (currentUser && currentUser.gameState && currentUser.gameState.completedPuzzles) {
      Object.keys(currentUser.gameState.completedPuzzles).forEach(pid => {
        const rec = currentUser.gameState.completedPuzzles[pid];
        if (rec) {
          if (rec.answered && rec.timeSolved === dateStr) {
            solvedCount++;
          }
          const attemptedOnDate = rec.attempts && rec.attempts.some(att => att.dateAttempted === dateStr);
          if (attemptedOnDate) {
            attemptedCount++;
          }
        }
      });
    }

    const el = document.createElement("div");
    el.className = "calendar-day-cell";
    el.innerText = d;
    el.title = `${dateStr}: ${solvedCount} solved, ${attemptedCount} attempted`;

    if (solvedCount >= 5) {
      el.classList.add("full-completed");
    } else if (attemptedCount > 0 || solvedCount > 0) {
      el.classList.add("active-play");
    }

    if (dateStr === todayStr) {
      el.classList.add("today");
    }

    grid.appendChild(el);
  }

  monthCard.appendChild(grid);
  container.appendChild(monthCard);
}

function renderParentCalendarView() {
  if (!parentCalendarView) return;
  parentCalendarView.innerHTML = "";
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  if (parentCalendarView.showPreviousMonth === undefined) {
    parentCalendarView.showPreviousMonth = false;
  }
  
  if (btnParentLoadPrevMonth) {
    if (parentCalendarView.showPreviousMonth) {
      btnParentLoadPrevMonth.innerText = "➖ Hide Previous Month";
    } else {
      btnParentLoadPrevMonth.innerText = "📅 Load Previous Month";
    }
  }

  if (parentCalendarView.showPreviousMonth) {
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear = currentYear - 1;
    }
    renderMonthCalendar(prevYear, prevMonth, parentCalendarView);
  }
  
  renderMonthCalendar(currentYear, currentMonth, parentCalendarView);
}

// Bind Load Previous Month toggle click listener
if (btnParentLoadPrevMonth) {
  btnParentLoadPrevMonth.addEventListener("click", () => {
    SoundManager.playClick();
    parentCalendarView.showPreviousMonth = !parentCalendarView.showPreviousMonth;
    renderParentCalendarView();
  });
}

btnParentDaySet.addEventListener("click", () => {
  const newDay = parseInt(parentDayOverride.value);
  const maxDayInJson = PUZZLES.length > 0 ? Math.max(...PUZZLES.map(p => p.day)) : 1;
  if (newDay > maxDayInJson) {
    alert(`Oops! You cannot set the day past the maximum loaded day in puzzles.json (Day ${maxDayInJson}).`);
    return;
  }
  if (newDay >= 1 && newDay <= 100) {
    currentUser.gameState.currentDay = newDay;
    currentUser.gameState.unlockedUpToDay = Math.max(currentUser.gameState.unlockedUpToDay, newDay);
    StorageService.updateGameState(currentUser.gameState);
    SoundManager.playSuccess();
    alert(`Game day set to Day ${newDay}!`);
    renderParentDashboard();
    viewingDay = newDay;
  }
});

btnParentForceDay.addEventListener("click", () => {
  const maxDayInJson = PUZZLES.length > 0 ? Math.max(...PUZZLES.map(p => p.day)) : 1;
  const nextDay = currentUser.gameState.currentDay + 1;
  
  if (nextDay > maxDayInJson) {
    alert(`Oops! You have reached the end of the available puzzles in puzzles.json (Day ${maxDayInJson}). Please add more puzzle days to puzzles.json to continue!`);
    return;
  }
  
  currentUser.gameState.currentDay = nextDay;
  currentUser.gameState.unlockedUpToDay = Math.max(currentUser.gameState.unlockedUpToDay, nextDay);
  StorageService.updateGameState(currentUser.gameState);
  
  SoundManager.playSuccess();
  alert(`Tomorrow unlocked! Active Day is now Day ${nextDay}.`);
  renderParentDashboard();
  viewingDay = nextDay;
});

btnParentResetUser.addEventListener("click", () => {
  if (confirm("Are you sure you want to reset all game history and coins? This cannot be undone!")) {
    currentUser.gameState.coins = 0;
    currentUser.gameState.currentDay = 1;
    currentUser.gameState.unlockedUpToDay = 1;
    currentUser.gameState.level = 1;
    currentUser.gameState.completedPuzzles = {};
    StorageService.updateGameState(currentUser.gameState);
    
    SoundManager.playSuccess();
    alert("Profile reset successful!");
    viewingDay = 1;
    renderHeader();
    renderParentDashboard();
  }
});

btnParentDownloadLogs.addEventListener("click", () => {
  SoundManager.playClick();
  Logger.exportDiagnostics(currentUser);
});

function renderParentDrawings() {
  parentReviewList.innerHTML = "";
  let hasDrawings = false;

  Object.keys(currentUser.gameState.completedPuzzles).forEach(puzzleId => {
    const record = currentUser.gameState.completedPuzzles[puzzleId];
    
    if (record.answered && record.pendingApproval) {
      hasDrawings = true;
      const puzzle = PUZZLES.find(p => p.id === puzzleId);
      
      const item = document.createElement("div");
      item.className = "review-item";
      item.innerHTML = `
        <div>
          <strong style="color:var(--primary-color);">Day ${puzzle.day} Puzzle ${puzzle.number}: ${puzzle.title}</strong>
          <p style="font-size:0.9rem; color:var(--text-muted); margin-top:4px;">${puzzle.question}</p>
        </div>
        <div style="display: flex; gap: 20px; align-items: center; justify-content: space-around; flex-wrap: wrap; margin: 15px 0;">
          <div style="text-align: center; flex: 1; min-width: 150px;">
            <span style="font-size: 0.85rem; font-weight: bold; display: block; margin-bottom: 5px; color: var(--text-muted); font-family: var(--font-title);">${currentUser.childFirstName}'s Creation</span>
            <img class="review-img" src="${record.userAnswer}" style="border: 2px solid var(--primary-color); border-radius: var(--radius-sm); max-width: 100%; max-height: 150px; background: white;">
          </div>
          <div style="text-align: center; flex: 1; min-width: 150px;">
            <span style="font-size: 0.85rem; font-weight: bold; display: block; margin-bottom: 5px; color: var(--text-muted); font-family: var(--font-title);">Reference Model</span>
            <div style="border: 2px dashed var(--card-border); border-radius: var(--radius-sm); padding: 10px; display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.85); width: 100%; height: 150px; max-width: 200px; margin: 0 auto;">
              ${puzzle.referenceSvg || '<span style="color:var(--text-muted);">No reference SVG available</span>'}
            </div>
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-weight:bold; color:var(--accent-text);">Reward: 💎 ${puzzle.coinsReward} Coins</span>
          <button class="btn-primary btn-approve" data-id="${puzzleId}" style="padding:8px 16px; font-size:0.9rem;">Approve Submission & Give Coins</button>
        </div>
      `;
      
      item.querySelector(".btn-approve").addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        approveDrawing(id);
      });

      parentReviewList.appendChild(item);
    }
  });

  if (hasDrawings) {
    noDrawingsText.classList.add("hidden");
  } else {
    noDrawingsText.classList.remove("hidden");
  }
}

function approveDrawing(puzzleId) {
  const puzzle = PUZZLES.find(p => p.id === puzzleId);
  const record = currentUser.gameState.completedPuzzles[puzzleId];
  
  if (record && record.pendingApproval) {
    record.pendingApproval = false;
    record.correct = true;
    
    // Mark latest attempt correct for time metrics
    let secondsSpent = 10;
    if (record.attempts && record.attempts.length > 0) {
      const lastAttempt = record.attempts[record.attempts.length - 1];
      if (lastAttempt.correct === null) {
        lastAttempt.correct = true;
      }
      secondsSpent = lastAttempt.secondsSpent || 10;
    }
    
    const targetTime = puzzle.difficulty === "Easy" ? 20 : (puzzle.difficulty === "Medium" ? 30 : 40);
    const isSpeedBonus = (secondsSpent < targetTime);
    const bonusCoins = isSpeedBonus ? 2 : 0;
    
    record.coinsAwarded = puzzle.coinsReward + bonusCoins;
    record.speedBonusAwarded = isSpeedBonus;
    
    // Add coins
    currentUser.gameState.coins += puzzle.coinsReward + bonusCoins;
    StorageService.updateGameState(currentUser.gameState);
    
    SoundManager.playCoin();
    startConfetti();
    spawnEmojiBurst(12);
    renderHeader();
    renderParentDashboard();
  }
}

// ================= CANVAS DRAWING SYSTEM =================

function setupDrawingCanvas() {
  // Mouse events
  drawingBoard.addEventListener("mousedown", startDraw);
  drawingBoard.addEventListener("mousemove", draw);
  drawingBoard.addEventListener("mouseup", stopDraw);
  drawingBoard.addEventListener("mouseout", stopDraw);

  // Touch events for tablet/mobile
  drawingBoard.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    const mouseEvent = new MouseEvent("mousedown", {
      clientX: t.clientX,
      clientY: t.clientY
    });
    drawingBoard.dispatchEvent(mouseEvent);
    e.preventDefault();
  }, { passive: false });

  drawingBoard.addEventListener("touchmove", (e) => {
    const t = e.touches[0];
    const mouseEvent = new MouseEvent("mousemove", {
      clientX: t.clientX,
      clientY: t.clientY
    });
    drawingBoard.dispatchEvent(mouseEvent);
    e.preventDefault();
  }, { passive: false });

  drawingBoard.addEventListener("touchend", () => {
    const mouseEvent = new MouseEvent("mouseup", {});
    drawingBoard.dispatchEvent(mouseEvent);
  });

  // Tools Setup
  const colorDots = document.querySelectorAll(".color-dot");
  colorDots.forEach(dot => {
    dot.addEventListener("click", (e) => {
      colorDots.forEach(d => d.classList.remove("active"));
      dot.classList.add("active");
      brushColor = dot.getAttribute("data-color");
      isEraser = false;
      document.getElementById("canvas-tool-brush").classList.add("active");
      document.getElementById("canvas-tool-eraser").classList.remove("active");
      SoundManager.playClick();
    });
  });

  document.getElementById("canvas-tool-brush").addEventListener("click", (e) => {
    isEraser = false;
    document.getElementById("canvas-tool-brush").classList.add("active");
    document.getElementById("canvas-tool-eraser").classList.remove("active");
    SoundManager.playClick();
  });

  document.getElementById("canvas-tool-eraser").addEventListener("click", () => {
    isEraser = true;
    document.getElementById("canvas-tool-eraser").classList.add("active");
    document.getElementById("canvas-tool-brush").classList.remove("active");
    SoundManager.playClick();
  });

  document.getElementById("canvas-clear").addEventListener("click", () => {
    clearCanvas();
    SoundManager.playClick();
  });
}

function startDraw(e) {
  isDrawing = true;
  const rect = drawingBoard.getBoundingClientRect();
  lastX = e.clientX - rect.left;
  lastY = e.clientY - rect.top;
}

function draw(e) {
  if (!isDrawing) return;
  const rect = drawingBoard.getBoundingClientRect();
  const currentX = e.clientX - rect.left;
  const currentY = e.clientY - rect.top;

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(currentX, currentY);
  
  ctx.strokeStyle = isEraser ? "#ffffff" : brushColor;
  ctx.lineWidth = isEraser ? 20 : brushSize;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  lastX = currentX;
  lastY = currentY;
}

function stopDraw() {
  isDrawing = false;
}

function clearCanvas() {
  ctx.clearRect(0, 0, drawingBoard.width, drawingBoard.height);
}

// ================= CONFETTI CELEBRATION ENGINE =================

let confettiCanvas;
let confettiCtx;
let confettiParticles = [];
let isConfettiRunning = false;

function initConfetti() {
  confettiCanvas = document.getElementById("confetti-canvas");
  confettiCtx = confettiCanvas.getContext("2d");
  
  window.addEventListener("resize", resizeConfettiCanvas);
  resizeConfettiCanvas();
}

function resizeConfettiCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}

function startConfetti() {
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

// ================= LEVEL-UP WINDOW CELEBRATION =================

function triggerLevelUpCelebration(levelInfo) {
  modalLevelEmoji.innerText = levelInfo.emoji;
  modalLevelName.innerText = levelInfo.name;
  modalLevelCoins.innerText = `You have accumulated ${currentUser.gameState.coins} gold coins!`;
  
  SoundManager.playLevelUp();
  startConfetti();
  
  celebrationModal.classList.add("active");
}

btnCloseCelebration.addEventListener("click", () => {
  SoundManager.playClick();
  celebrationModal.classList.remove("active");
});

// ================= GLOBAL EVENT LISTENERS BINDINGS =================

// ================= KIDS ZONE CALENDAR SYSTEM =================
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

  // Render empty padding cells
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
      const dateStr = r.timeSolved; // YYYY-MM-DD
      completedDates[dateStr] = (completedDates[dateStr] || 0) + 1;
    }
  });

  // Render day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement("div");
    dayCell.innerText = day;
    
    // Day formatting
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
      dayCell.addEventListener("mouseover", () => {
        dayCell.style.transform = "scale(1.15)";
      });
      dayCell.addEventListener("mouseout", () => {
        dayCell.style.transform = "scale(1)";
      });
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

function setupEventListeners() {
  // Nav Tab clicks
  tabPlay.addEventListener("click", () => switchTab("play"));
  tabHistory.addEventListener("click", () => switchTab("history"));
  tabKids.addEventListener("click", () => switchTab("kids"));
  tabParent.addEventListener("click", () => switchTab("parent"));
  
  // Calendar Controls
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
  
  // Canvas drawing config
  setupDrawingCanvas();
}

function renderTimeStats() {
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

// Start
init();
