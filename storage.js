/**
 * storage.js - Auth & Game State Manager
 * Emulates a cloud database (like Supabase) using LocalStorage.
 * Separated from direct DOM manipulation to make cloud migration trivial.
 */

const USERS_KEY = "mindbloom_users";
const ACTIVE_USER_KEY = "mindbloom_active_user";

function getUsers() {
  const usersJson = localStorage.getItem(USERS_KEY);
  return usersJson ? JSON.parse(usersJson) : {};
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export const StorageService = {
  /**
   * Registers a new parent/child account.
   */
  registerUser(parentData, childData, credentials) {
    const users = getUsers();
    const username = credentials.username.trim().toLowerCase();

    if (users[username]) {
      return { success: false, error: "Username already exists. Try a different one!" };
    }

    users[username] = {
      password: credentials.password, // Stored as plain text for standalone ease (can hash later)
      parentEmail: parentData.email,
      parentPhone: parentData.phone,
      childName: childData.name,
      childGender: childData.gender,
      childAge: parseInt(childData.age) || 9,
      livingCountry: childData.livingCountry,
      culturalAffiliation: childData.culturalAffiliation,
      gameState: {
        currentDay: 1,
        unlockedUpToDay: 1,
        lastActiveDate: new Date().toISOString().split("T")[0],
        coins: 0,
        level: 1,
        levelName: "Mind Bloom",
        completedPuzzles: {}, // Maps puzzleId -> { answered: boolean, correct: boolean|null (for drawing), userAnswer: any, timeSolved: string, approvedByParent: boolean }
      }
    };

    saveUsers(users);
    return { success: true };
  },

  /**
   * Logs in the child with username and password.
   */
  loginUser(username, password) {
    const users = getUsers();
    const normUsername = username.trim().toLowerCase();

    if (!users[normUsername]) {
      return { success: false, error: "Username not found. Ask Mom or Dad to register you first!" };
    }

    if (users[normUsername].password !== password) {
      return { success: false, error: "Oops! Incorrect password. Try again." };
    }

    // Set active user session
    localStorage.setItem(ACTIVE_USER_KEY, normUsername);
    return { success: true, user: this.getCurrentUser() };
  },

  /**
   * Logs out the current child.
   */
  logoutUser() {
    localStorage.removeItem(ACTIVE_USER_KEY);
  },

  /**
   * Gets the logged-in user profile and game state.
   */
  getCurrentUser() {
    const activeUsername = localStorage.getItem(ACTIVE_USER_KEY);
    if (!activeUsername) return null;

    const users = getUsers();
    const user = users[activeUsername];
    if (!user) return null;

    return {
      username: activeUsername,
      childName: user.childName,
      childGender: user.childGender,
      childAge: user.childAge,
      livingCountry: user.livingCountry,
      culturalAffiliation: user.culturalAffiliation,
      parentEmail: user.parentEmail,
      parentPhone: user.parentPhone,
      gameState: user.gameState
    };
  },

  /**
   * Saves the updated game state for the currently active user.
   */
  updateGameState(newGameState) {
    const activeUsername = localStorage.getItem(ACTIVE_USER_KEY);
    if (!activeUsername) return { success: false, error: "No active user session." };

    const users = getUsers();
    if (!users[activeUsername]) return { success: false, error: "User profile not found." };

    users[activeUsername].gameState = {
      ...users[activeUsername].gameState,
      ...newGameState
    };

    saveUsers(users);
    return { success: true, gameState: users[activeUsername].gameState };
  },

  /**
   * Checks if parent verification is correct.
   * Simple parental gate: answers a random math quiz, or a configurable Parent PIN.
   * For simplicity, let's also allow checking parent credentials if needed.
   */
  verifyParentGate(answer, expected) {
    return parseInt(answer) === expected;
  },

  /**
   * Helper to get list of all registered children.
   */
  getAllUsers() {
    const users = getUsers();
    return Object.keys(users).map(username => ({
      username,
      childName: users[username].childName,
      coins: users[username].gameState.coins,
      level: users[username].gameState.level
    }));
  }
};
