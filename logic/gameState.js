/**
 * logic/gameState.js — Game State Management
 *
 * Extracted from app.js during Phase 2 refactoring.
 * Handles date-based day advancement and the daily "Brain Power-Up"
 * review queue for incorrectly answered puzzles.
 */

import { StorageService } from "./storage.js";
import { SoundManager } from "../helpers/sound.js";

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Checks if the calendar date has changed since the last session.
 * If the previous day was fully completed, advances currentDay.
 */
export function checkDateChange(currentUser, PUZZLES) {
  const today = new Date().toLocaleDateString('en-CA');
  const lastActive = currentUser.gameState.lastActiveDate;

  if (today !== lastActive) {
    // Check if the previous day was fully completed (all 5 puzzles answered)
    const currentDayPuzzles = PUZZLES.filter(p => p.day === parseInt(currentUser.gameState.currentDay));
    const allDone = currentDayPuzzles.every(p => {
      const solved = currentUser.gameState.completedPuzzles[p.id];
      return solved && solved.answered === true;
    });

    if (allDone) {
      const nextDay = currentUser.gameState.currentDay + 1;
      currentUser.gameState.currentDay = nextDay;
      currentUser.gameState.unlockedUpToDay = Math.max(currentUser.gameState.unlockedUpToDay, nextDay);
    }

    // Update active date
    currentUser.gameState.lastActiveDate = today;
    StorageService.updateGameState(currentUser.gameState);
  }
}

/**
 * Checks if all puzzles for the current day are done and unlocks the next day
 * if applicable.
 * @returns {{ allDone: boolean, unlockedNewDay: boolean, nextDay: number }}
 */
export function checkAllDayPuzzlesCompleted(currentUser, PUZZLES) {
  const currentDayPuzzles = PUZZLES.filter(p => p.day === parseInt(currentUser.gameState.currentDay));
  const allDone = currentDayPuzzles.length > 0 && currentDayPuzzles.every(p => {
    const r = currentUser.gameState.completedPuzzles[p.id];
    return r && r.answered;
  });

  let nextDay = currentUser.gameState.currentDay + 1;

  // We no longer unlock the next day immediately.
  // The next day is unlocked in checkDateChange() when the calendar date advances.
  let unlockedNewDay = false;

  return { allDone, unlockedNewDay, nextDay };
}

// ── Daily Review (Brain Power-Up) System ──────────────────────────────────

let reviewQueue = [];
let currentReviewIndex = 0;

/**
 * Scans completed puzzles for unreviewed incorrect attempts from previous
 * days and shows the review modal if any are found.
 */
export function checkAndTriggerReviews(currentUser, PUZZLES) {
  if (!currentUser || !currentUser.gameState || !currentUser.gameState.completedPuzzles) return;

  const today = new Date().toLocaleDateString('en-CA');
  reviewQueue = [];
  currentReviewIndex = 0;

  PUZZLES.forEach(puzzle => {
    const record = currentUser.gameState.completedPuzzles[puzzle.id];
    if (record && record.needsReview && !record.reviewed) {
      const hasPrevDayIncorrect = record.attempts && record.attempts.some(attempt => {
        return !attempt.correct && attempt.dateAttempted < today;
      });

      if (hasPrevDayIncorrect) {
        reviewQueue.push({ puzzle, record });
      }
    }
  });

  if (reviewQueue.length > 0) {
    showReviewModal(currentUser);
  }
}

/**
 * Wire the "Next" button on the review modal.
 * Call once during init.
 */
export function setupReviewModal(getCurrentUser) {
  const btnReviewNext = document.getElementById("btn-review-next");

  btnReviewNext.addEventListener("click", () => {
    SoundManager.playClick();
    const currentUser = getCurrentUser();
    const currentItem = reviewQueue[currentReviewIndex];
    if (currentItem) {
      const pid = currentItem.puzzle.id;
      currentUser.gameState.completedPuzzles[pid].reviewed = true;
      StorageService.updateGameState(currentUser.gameState);
    }

    currentReviewIndex++;
    showReviewModal(currentUser);
  });
}

// ── Internal helpers ───────────────────────────────────────────────────────

function showReviewModal(currentUser) {
  const reviewOverlay = document.getElementById("review-overlay");
  const reviewCategory = document.getElementById("review-category");
  const reviewDifficulty = document.getElementById("review-difficulty");
  const reviewTitle = document.getElementById("review-title");
  const reviewQuestion = document.getElementById("review-question");
  const reviewWrongAnswer = document.getElementById("review-wrong-answer");
  const reviewCorrectAnswer = document.getElementById("review-correct-answer");
  const reviewExplanation = document.getElementById("review-explanation");
  const btnReviewNext = document.getElementById("btn-review-next");

  if (currentReviewIndex >= reviewQueue.length) {
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
