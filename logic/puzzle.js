/**
 * logic/puzzle.js — Puzzle Loading, Rendering, Answer Submission & Canvas
 *
 * Extracted from app.js during Phase 2 refactoring.
 * Manages the puzzle deck strip, active puzzle arena, answer checking,
 * drawing canvas, and hint system.
 */

import { StorageService } from "./storage.js";
import { SoundManager } from "../helpers/sound.js";
import { startConfetti, spawnEmojiBurst } from "./ui/celebrate.js";
import { renderHeader } from "./ui/header.js";
import { checkAllDayPuzzlesCompleted } from "./gameState.js";

// ── Module state ───────────────────────────────────────────────────────────
let activePuzzle = null;
let activePuzzleStartTime = null;
export let puzzleTimerInterval = null;

// Canvas drawing state
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let brushColor = "black";
let brushSize = 5;
let isEraser = false;

// Canvas context (initialised in setupDrawingCanvas)
let ctx = null;

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Renders the daily puzzle strip and auto-loads the first incomplete puzzle.
 * @param {object} currentUser
 * @param {Array} PUZZLES
 * @param {number} viewingDay — mutable; managed by app.js
 * @param {function} setViewingDay — setter for viewingDay
 */
export function renderPuzzleStrip(currentUser, PUZZLES, viewingDay) {
  const dayDisplayLabel = document.getElementById("day-display-label");
  const dailyPuzzleDeck = document.getElementById("daily-puzzle-deck");
  const btnPrevDay = document.getElementById("btn-prev-day");
  const btnNextDay = document.getElementById("btn-next-day");

  dayDisplayLabel.innerText = `Day ${viewingDay}`;
  dailyPuzzleDeck.innerHTML = "";

  const maxDayInJson = PUZZLES.length > 0 ? Math.max(...PUZZLES.map(p => p.day)) : 1;
  const maxAvailableDay = Math.min(currentUser.gameState.unlockedUpToDay, maxDayInJson);

  btnPrevDay.disabled = viewingDay <= 1;
  btnNextDay.disabled = viewingDay >= maxAvailableDay;

  const dayPuzzles = PUZZLES.filter(p => p.day === parseInt(viewingDay));

  dayPuzzles.forEach((puzzle, index) => {
    const card = document.createElement("div");
    card.className = "puzzle-card";

    const record = currentUser.gameState.completedPuzzles[puzzle.id];
    const isCompleted = record && record.answered;

    // Sequence Locking
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

    let statusIcon = "⚡";
    if (isCompleted) {
      if (record.pendingApproval) statusIcon = "⏳";
      else if (record.correct) statusIcon = "✅";
      else statusIcon = "❌";
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
        loadActivePuzzle(puzzle, currentUser);
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
    loadActivePuzzle(toLoad, currentUser);
  }
}

/**
 * Sets up the day navigation buttons, hint button, submit button,
 * and drawing canvas.  Call once during init.
 * @param {function} getCurrentUser — returns the current user object
 * @param {function} getPUZZLES — returns the loaded PUZZLES array
 * @param {function} getViewingDay — returns the current viewingDay
 * @param {function} setViewingDay — sets viewingDay
 */
export function setupPuzzleControls(getCurrentUser, getPUZZLES, getViewingDay, setViewingDay) {
  const btnPrevDay = document.getElementById("btn-prev-day");
  const btnNextDay = document.getElementById("btn-next-day");
  const btnShowHint = document.getElementById("btn-show-hint");
  const btnSubmitAnswer = document.getElementById("btn-submit-answer");

  btnPrevDay.addEventListener("click", () => {
    const vd = getViewingDay();
    if (vd > 1) {
      setViewingDay(vd - 1);
      SoundManager.playClick();
      renderPuzzleStrip(getCurrentUser(), getPUZZLES(), vd - 1);
    }
  });

  btnNextDay.addEventListener("click", () => {
    const vd = getViewingDay();
    const currentUser = getCurrentUser();
    if (vd < currentUser.gameState.unlockedUpToDay) {
      setViewingDay(vd + 1);
      SoundManager.playClick();
      renderPuzzleStrip(currentUser, getPUZZLES(), vd + 1);
    }
  });

  // Hints Display
  btnShowHint.addEventListener("click", () => {
    SoundManager.playClick();
    const hintsCount = document.getElementById("hints-count");
    const hintDrawer = document.getElementById("hint-drawer");
    const hintText = document.getElementById("hint-text");

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

  // Submit Answer
  btnSubmitAnswer.addEventListener("click", () => {
    const currentUser = getCurrentUser();
    if (!activePuzzle) return;

    const record = currentUser.gameState.completedPuzzles[activePuzzle.id];
    if (record && record.answered) return;

    const secondsSpent = activePuzzleStartTime ? Math.max(1, Math.round((Date.now() - activePuzzleStartTime) / 1000)) : 10;
    activePuzzleStartTime = Date.now();

    const drawingBoard = document.getElementById("drawing-board");
    const mcContainer = document.getElementById("mc-container");
    const textAnswerInput = document.getElementById("text-answer-input");
    const PUZZLES = getPUZZLES();
    const viewingDay = getViewingDay();

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
      userAnswer = drawingBoard.toDataURL();

      const existingRecord = currentUser.gameState.completedPuzzles[activePuzzle.id] || { attempts: [] };
      const newAttempts = [...(existingRecord.attempts || [])];
      newAttempts.push({
        userAnswer: "[Canvas Drawing]",
        timeAttempted: new Date().toISOString(),
        dateAttempted: new Date().toLocaleDateString('en-CA'),
        correct: null,
        secondsSpent: secondsSpent
      });

      currentUser.gameState.completedPuzzles[activePuzzle.id] = {
        answered: true,
        correct: null,
        userAnswer: userAnswer,
        pendingApproval: true,
        coinsAwarded: 0,
        timeSolved: new Date().toLocaleDateString('en-CA'),
        attempts: newAttempts
      };

      SoundManager.playSuccess();
      StorageService.updateGameState(currentUser.gameState);
      alert("🎨 Super! Drawing submitted to Mom/Dad. Ask them to approve it in the Parent Zone!");
      renderPuzzleStrip(currentUser, PUZZLES, viewingDay);
      _handleDayCompletion(currentUser, PUZZLES, viewingDay);
      return;
    }

    // MC and Text evaluation
    if (isCorrect) {
      SoundManager.playCoin();

      const targetTime = activePuzzle.difficulty === "Easy" ? 20 : (activePuzzle.difficulty === "Medium" ? 30 : 40);
      const isSpeedBonus = (secondsSpent < targetTime);
      const bonusCoins = isSpeedBonus ? 2 : 0;

      currentUser.gameState.coins += activePuzzle.coinsReward + bonusCoins;

      const existingRecord = currentUser.gameState.completedPuzzles[activePuzzle.id] || { attempts: [] };
      const newAttempts = [...(existingRecord.attempts || [])];
      newAttempts.push({
        userAnswer: userAnswer,
        timeAttempted: new Date().toISOString(),
        dateAttempted: new Date().toLocaleDateString('en-CA'),
        correct: true,
        secondsSpent: secondsSpent
      });

      currentUser.gameState.completedPuzzles[activePuzzle.id] = {
        answered: true,
        correct: true,
        userAnswer: userAnswer,
        coinsAwarded: activePuzzle.coinsReward + bonusCoins,
        speedBonusAwarded: isSpeedBonus,
        timeSolved: new Date().toLocaleDateString('en-CA'),
        needsReview: existingRecord.needsReview || false,
        reviewed: existingRecord.reviewed || false,
        attempts: newAttempts
      };

      StorageService.updateGameState(currentUser.gameState);

      startConfetti();
      spawnEmojiBurst(12, currentUser);
      renderHeader(currentUser);
      renderPuzzleStrip(currentUser, PUZZLES, viewingDay);

      if (isSpeedBonus) {
        alert(`🎉 Awesome! You solved the puzzle in only ${secondsSpent}s (beating the Target Time of ${targetTime}s)! You earned 💎 ${activePuzzle.coinsReward} gold coins + 💎 2 Speed Bonus coins! 🚀`);
      } else {
        alert(`🎉 Correct! You earned 💎 ${activePuzzle.coinsReward} gold coins!`);
      }

      _handleDayCompletion(currentUser, PUZZLES, viewingDay);
    } else {
      SoundManager.playError();

      const existingRecord = currentUser.gameState.completedPuzzles[activePuzzle.id] || { attempts: [] };
      const newAttempts = [...(existingRecord.attempts || [])];
      newAttempts.push({
        userAnswer: userAnswer,
        timeAttempted: new Date().toISOString(),
        dateAttempted: new Date().toLocaleDateString('en-CA'),
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
      renderPuzzleStrip(currentUser, PUZZLES, viewingDay);
      alert(`❌ Oops! That is incorrect. You only get one attempt per puzzle. You can review the correct answer and explanation tomorrow! Let's try another puzzle! 🌟`);
      _handleDayCompletion(currentUser, PUZZLES, viewingDay);
    }
  });

  // Canvas
  setupDrawingCanvas();
}

// ── Internal helpers ───────────────────────────────────────────────────────

function _handleDayCompletion(currentUser, PUZZLES, viewingDay) {
  const { allDone, unlockedNewDay, nextDay } = checkAllDayPuzzlesCompleted(currentUser, PUZZLES);

  if (allDone) {
    // Only show the alert once per day to avoid spamming the user
    currentUser.gameState.dayCompletedAlerts = currentUser.gameState.dayCompletedAlerts || {};
    if (!currentUser.gameState.dayCompletedAlerts[currentUser.gameState.currentDay]) {
      currentUser.gameState.dayCompletedAlerts[currentUser.gameState.currentDay] = true;
      StorageService.updateGameState(currentUser.gameState);
      
      setTimeout(() => {
        if (unlockedNewDay) {
          alert(`🎉 Wonderful job! You completed all 5 puzzles for Day ${currentUser.gameState.currentDay}! Day ${nextDay} is now unlocked! Click the arrow to check it out! 🚀`);
        } else {
          alert(`🎉 Wonderful job! You completed all 5 puzzles for Day ${currentUser.gameState.currentDay}!`);
        }
        renderPuzzleStrip(currentUser, PUZZLES, viewingDay);
      }, 800);
    }
  }
}

function loadActivePuzzle(puzzle, currentUser) {
  activePuzzle = puzzle;
  activePuzzleStartTime = Date.now();

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
  const solutionPanel = document.getElementById("solution-panel");
  const solutionLockedBlock = document.getElementById("solution-locked-block");
  const solutionUnlockedBlock = document.getElementById("solution-unlocked-block");
  const solutionExplanationText = document.getElementById("solution-explanation-text");
  const btnSubmitAnswer = document.getElementById("btn-submit-answer");

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

  // Lazy-init canvas context
  if (!ctx) {
    ctx = drawingBoard.getContext("2d");
  }

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

  // Solution panel
  solutionPanel.classList.remove("hidden");
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

  // Timer logic
  const timerDisplay = document.getElementById("puzzle-timer-display");
  if (puzzleTimerInterval) clearInterval(puzzleTimerInterval);
  
  if (isCompleted) {
    if (timerDisplay) {
      const attempts = record.attempts || [];
      const timeSpent = attempts.length > 0 ? attempts[0].secondsSpent : 0;
      timerDisplay.innerText = `⏳ ${timeSpent}s`;
    }
  } else {
    if (timerDisplay) {
      timerDisplay.innerText = `⏳ 0s`;
      puzzleTimerInterval = setInterval(() => {
        const elapsed = Math.round((Date.now() - activePuzzleStartTime) / 1000);
        timerDisplay.innerText = `⏳ ${elapsed}s`;
      }, 1000);
    }
  }
}

function setupDrawingCanvas() {
  const drawingBoard = document.getElementById("drawing-board");

  // Lazy-init context
  if (!ctx) {
    ctx = drawingBoard.getContext("2d");
  }

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
    dot.addEventListener("click", () => {
      colorDots.forEach(d => d.classList.remove("active"));
      dot.classList.add("active");
      brushColor = dot.getAttribute("data-color");
      isEraser = false;
      document.getElementById("canvas-tool-brush").classList.add("active");
      document.getElementById("canvas-tool-eraser").classList.remove("active");
      SoundManager.playClick();
    });
  });

  document.getElementById("canvas-tool-brush").addEventListener("click", () => {
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
  const drawingBoard = document.getElementById("drawing-board");
  const rect = drawingBoard.getBoundingClientRect();
  lastX = e.clientX - rect.left;
  lastY = e.clientY - rect.top;
}

function draw(e) {
  if (!isDrawing) return;
  const drawingBoard = document.getElementById("drawing-board");
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
  const drawingBoard = document.getElementById("drawing-board");
  if (ctx) {
    ctx.clearRect(0, 0, drawingBoard.width, drawingBoard.height);
  }
}
