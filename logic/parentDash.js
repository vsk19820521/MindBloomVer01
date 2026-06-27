/**
 * logic/parentDash.js — Parent Dashboard
 *
 * Extracted from app.js during Phase 2 refactoring.
 * Manages the parent gate, drawing review queue, day override,
 * difficulty/category stats, calendar views, and diagnostics.
 */

import { StorageService } from "./storage.js";
import { SoundManager } from "../helpers/sound.js";
import { Logger } from "../helpers/logger.js";
import { startConfetti, spawnEmojiBurst } from "./ui/celebrate.js";
import { renderHeader, renderTimeStats } from "./ui/header.js";

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Opens the parent gate screen (hides dashboard content until PIN entered).
 */
export function loadParentGate() {
  const parentGate = document.getElementById("parent-gate");
  const parentDashboardContent = document.getElementById("parent-dashboard-content");

  parentGate.classList.remove("hidden");
  parentDashboardContent.classList.add("hidden");
  document.getElementById("parent-gate-input").value = "";
  document.getElementById("parent-gate-error").classList.add("hidden");
}

/**
 * Renders the full parent dashboard (after gate has been passed).
 */
export function renderParentDashboard(currentUser, PUZZLES) {
  document.getElementById("parent-day-override").value = currentUser.gameState.currentDay;
  renderParentDrawings(currentUser, PUZZLES);
  renderParentDifficultyStats(currentUser, PUZZLES);
  renderParentCategoryStats(currentUser, PUZZLES);
  renderParentCalendarView(currentUser);
  renderTimeStats(currentUser);
}

/**
 * Wire all parent dashboard event listeners.
 * Call once during init.
 * @param {function} getCurrentUser — returns current user
 * @param {function} getPUZZLES — returns loaded puzzles
 * @param {function} setViewingDay — sets app viewingDay
 */
export function setupParentControls(getCurrentUser, getPUZZLES, setViewingDay) {
  const parentGateInput = document.getElementById("parent-gate-input");
  const btnParentGateSubmit = document.getElementById("btn-parent-gate-submit");
  const parentGateError = document.getElementById("parent-gate-error");
  const parentDashboardContent = document.getElementById("parent-dashboard-content");
  const parentGate = document.getElementById("parent-gate");
  const parentDayOverride = document.getElementById("parent-day-override");
  const btnParentDaySet = document.getElementById("btn-parent-day-set");
  const btnParentForceDay = document.getElementById("btn-parent-force-day");
  const btnParentResetUser = document.getElementById("btn-parent-reset-user");
  const btnParentDownloadLogs = document.getElementById("btn-parent-download-logs");
  const btnParentLoadPrevMonth = document.getElementById("btn-parent-load-prev-month");
  const parentCalendarView = document.getElementById("parent-calendar-view");

  // Gate submit
  btnParentGateSubmit.addEventListener("click", () => {
    SoundManager.playClick();
    const currentUser = getCurrentUser();
    const inputVal = parentGateInput.value;
    const expectedCode = currentUser ? (currentUser.parentCode || "0000") : "0000";

    if (StorageService.verifyParentGate(inputVal, expectedCode)) {
      SoundManager.playSuccess();
      parentGate.classList.add("hidden");
      parentDashboardContent.classList.remove("hidden");
      renderParentDashboard(currentUser, getPUZZLES());
    } else {
      SoundManager.playError();
      parentGateError.classList.remove("hidden");
      parentGateError.innerText = "Incorrect code! Parents only.";
      parentGateInput.value = "";
    }
  });

  // Day override: set
  btnParentDaySet.addEventListener("click", () => {
    const currentUser = getCurrentUser();
    const PUZZLES = getPUZZLES();
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
      renderParentDashboard(currentUser, PUZZLES);
      setViewingDay(newDay);
    }
  });

  // Day override: force next
  btnParentForceDay.addEventListener("click", () => {
    const currentUser = getCurrentUser();
    const PUZZLES = getPUZZLES();
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
    renderParentDashboard(currentUser, PUZZLES);
    setViewingDay(nextDay);
  });

  // Reset child progress
  btnParentResetUser.addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all game history and coins? This cannot be undone!")) {
      const currentUser = getCurrentUser();
      const PUZZLES = getPUZZLES();
      currentUser.gameState.coins = 0;
      currentUser.gameState.currentDay = 1;
      currentUser.gameState.unlockedUpToDay = 1;
      currentUser.gameState.level = 1;
      currentUser.gameState.completedPuzzles = {};
      StorageService.updateGameState(currentUser.gameState);

      SoundManager.playSuccess();
      alert("Profile reset successful!");
      setViewingDay(1);
      renderHeader(currentUser);
      renderParentDashboard(currentUser, PUZZLES);
    }
  });

  // Download diagnostic logs
  btnParentDownloadLogs.addEventListener("click", () => {
    SoundManager.playClick();
    Logger.exportDiagnostics(getCurrentUser());
  });

  // Previous month toggle
  if (btnParentLoadPrevMonth) {
    btnParentLoadPrevMonth.addEventListener("click", () => {
      SoundManager.playClick();
      parentCalendarView.showPreviousMonth = !parentCalendarView.showPreviousMonth;
      renderParentCalendarView(getCurrentUser());
    });
  }
}

// ── Internal rendering helpers ─────────────────────────────────────────────

function renderParentDifficultyStats(currentUser, PUZZLES) {
  const parentDifficultyStats = document.getElementById("parent-difficulty-stats");
  if (!parentDifficultyStats) return;
  parentDifficultyStats.innerHTML = "";

  const levels = ["Easy", "Medium", "Hard"];

  levels.forEach(lvl => {
    const solved = PUZZLES.filter(p => {
      if (p.difficulty !== lvl) return false;
      const rec = currentUser.gameState.completedPuzzles[p.id];
      return rec && rec.correct === true;
    }).length;

    let totalAttempts = 0;
    PUZZLES.forEach(p => {
      if (p.difficulty === lvl) {
        const rec = currentUser.gameState.completedPuzzles[p.id];
        if (rec) {
          if (rec.attempts && rec.attempts.length > 0) {
            totalAttempts += rec.attempts.length;
          } else if (rec.answered) {
            totalAttempts += 1;
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

function renderParentCategoryStats(currentUser, PUZZLES) {
  const parentCategoryStats = document.getElementById("parent-category-stats");
  if (!parentCategoryStats) return;
  parentCategoryStats.innerHTML = "";

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
        if (rec.correct === true) {
          succeeded++;
        }
      }
    });

    return { category: cat, totalAttempts, succeeded };
  });

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

function renderParentCalendarView(currentUser) {
  const parentCalendarView = document.getElementById("parent-calendar-view");
  const btnParentLoadPrevMonth = document.getElementById("btn-parent-load-prev-month");
  if (!parentCalendarView) return;
  parentCalendarView.innerHTML = "";

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  if (parentCalendarView.showPreviousMonth === undefined) {
    parentCalendarView.showPreviousMonth = false;
  }

  if (btnParentLoadPrevMonth) {
    btnParentLoadPrevMonth.innerText = parentCalendarView.showPreviousMonth
      ? "➖ Hide Previous Month"
      : "📅 Load Previous Month";
  }

  if (parentCalendarView.showPreviousMonth) {
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear = currentYear - 1;
    }
    renderMonthCalendar(prevYear, prevMonth, parentCalendarView, currentUser);
  }

  renderMonthCalendar(currentYear, currentMonth, parentCalendarView, currentUser);
}

function renderMonthCalendar(year, month, container, currentUser) {
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
  const todayStr = new Date().toLocaleDateString('en-CA');

  for (let i = 0; i < firstDayIndex; i++) {
    const el = document.createElement("div");
    el.className = "calendar-day-cell empty";
    grid.appendChild(el);
  }

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

function renderParentDrawings(currentUser, PUZZLES) {
  const parentReviewList = document.getElementById("parent-review-list");
  const noDrawingsText = document.getElementById("no-drawings-text");
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
        approveDrawing(id, currentUser, PUZZLES);
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

function approveDrawing(puzzleId, currentUser, PUZZLES) {
  const puzzle = PUZZLES.find(p => p.id === puzzleId);
  const record = currentUser.gameState.completedPuzzles[puzzleId];

  if (record && record.pendingApproval) {
    record.pendingApproval = false;
    record.correct = true;

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

    currentUser.gameState.coins += puzzle.coinsReward + bonusCoins;
    StorageService.updateGameState(currentUser.gameState);

    SoundManager.playCoin();
    startConfetti();
    spawnEmojiBurst(12, currentUser);
    renderHeader(currentUser);
    renderParentDashboard(currentUser, PUZZLES);
  }
}
