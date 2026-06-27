/**
 * logic/ui/history.js — Puzzle History Tab
 *
 * Extracted from app.js during Phase 2 refactoring.
 * Renders the history days grid and detail views for reviewing
 * previously completed puzzles.
 */

import { SoundManager } from "../../helpers/sound.js";

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Renders the history tab with one card per unlocked day.
 * @param {object} currentUser — the active user session
 * @param {Array} PUZZLES — the loaded puzzle data
 */
export function renderHistoryTab(currentUser, PUZZLES) {
  const historyDaysGrid = document.getElementById("history-days-grid");
  const historyDetailView = document.getElementById("history-detail-view");

  historyDaysGrid.innerHTML = "";
  historyDetailView.classList.add("hidden");

  const maxDay = currentUser.gameState.unlockedUpToDay;

  for (let d = 1; d <= maxDay; d++) {
    const card = document.createElement("div");
    card.className = "puzzle-card";

    const dayPuzzles = PUZZLES.filter(p => p.day === d);
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
      loadHistoryDayDetails(d, currentUser, PUZZLES);
    });

    historyDaysGrid.appendChild(card);
  }
}

// ── Internal helpers ───────────────────────────────────────────────────────

function loadHistoryDayDetails(dayNum, currentUser, PUZZLES) {
  const historyDetailView = document.getElementById("history-detail-view");
  const historyDayTitle = document.getElementById("history-day-title");
  const historyDayPuzzlesList = document.getElementById("history-day-puzzles-list");

  historyDetailView.classList.remove("hidden");
  historyDayTitle.innerText = `Day ${dayNum} Review & Explanations`;
  historyDayPuzzlesList.innerHTML = "";

  const dayPuzzles = PUZZLES.filter(p => p.day === parseInt(dayNum));

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
