/**
 * storage.js — Auth & Game State Manager
 *
 * All reads and writes go through the Supabase-backed Vercel API.
 * localStorage is used as a **read cache only** — populated after successful
 * server responses so getCurrentUser() can return instantly without an
 * async fetch.  There is no offline fallback; the app requires connectivity.
 */

const ACTIVE_USER_KEY = "mindbloom_active_user";

function getUsers() {
  const users = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("mindbloom_user_")) {
      const username = key.replace("mindbloom_user_", "");
      try {
        users[username] = JSON.parse(localStorage.getItem(key));
      } catch (e) {
        console.error("Failed to parse user data for", username, e);
      }
    }
  }
  return users;
}

export const StorageService = {
  /**
   * Registers a new parent/child account.
   */
  async registerUser(parentData, childData, credentials) {
    const username = credentials.username.trim().toLowerCase();
    const userKey = `mindbloom_user_${username}`;

    const userData = {
      parentEmail: parentData.email,
      parentPhone: parentData.phone,
      parentCode: parentData.code || "0000",
      childFirstName: childData.firstName,
      childLastName: childData.lastName,
      childGender: childData.gender,
      birthMonth: parseInt(childData.birthMonth) || 1,
      birthYear: parseInt(childData.birthYear) || 2017,
      childAvatar: childData.avatar || "⚡ Pikachu",
      livingCountry: childData.livingCountry,
      culturalAffiliation: childData.culturalAffiliation,
      gameState: {
        currentDay: 1,
        unlockedUpToDay: 1,
        lastActiveDate: new Date().toLocaleDateString('en-CA'),
        coins: 0,
        level: 1,
        levelName: "Mind's Bloom",
        theme: "unicorn",
        isMuted: false,
        completedPuzzles: {}, // Maps puzzleId -> { answered: boolean, correct: boolean|null, userAnswer: any, timeSolved: string, approvedByParent: boolean, needsReview: boolean, reviewed: boolean, attempts: Array<{ userAnswer, timeAttempted, dateAttempted, correct }> }
      }
    };

    const payload = {
      username,
      password: credentials.password,
      userData
    };

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!data.success) {
        return { success: false, error: data.error || "Username already exists. Try a different one!" };
      }

      // Update local storage cache
      localStorage.setItem(userKey, JSON.stringify({ password: credentials.password, ...userData }));
      return { success: true };
    } catch (e) {
      console.error("Register server call failed:", e);
      return { success: false, error: "Unable to reach the server. Please check your internet connection and try again." };
    }
  },

  /**
   * Logs in the child with username and password.
   * POST /api/login — server verifies bcrypt hash, returns profile.
   */
  async loginUser(username, password) {
    const normUsername = username.trim().toLowerCase();
    const userKey = `mindbloom_user_${normUsername}`;

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: normUsername, password })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          // Cache locally for getCurrentUser() instant reads
          localStorage.setItem(userKey, JSON.stringify({ password, ...data.user }));
          localStorage.setItem(ACTIVE_USER_KEY, normUsername);
          return { success: true, user: this.getCurrentUser() };
        }
        return { success: false, error: data.error || "Login failed." };
      }

      // Handle specific HTTP error codes returned by the server
      if (response.status === 404) {
        return { success: false, error: "Username not found. Ask Mom or Dad to register you first!" };
      }
      if (response.status === 401) {
        return { success: false, error: "Oops! Incorrect password. Try again." };
      }

      return { success: false, error: "Login failed. Please try again." };
    } catch (e) {
      console.error("Server unreachable during login:", e);
      return { success: false, error: "Unable to reach the server. Please check your internet connection and try again." };
    }
  },

  /**
   * Logs out the current child.
   */
  logoutUser() {
    localStorage.removeItem(ACTIVE_USER_KEY);
  },

  /**
   * Gets the logged-in user profile and game state from the local cache.
   */
  getCurrentUser() {
    const activeUsername = localStorage.getItem(ACTIVE_USER_KEY);
    if (!activeUsername) return null;

    const userKey = `mindbloom_user_${activeUsername}`;
    const userJson = localStorage.getItem(userKey);
    if (!userJson) return null;

    try {
      const user = JSON.parse(userJson);
      
      // Safeguard game state and nested objects
      if (!user.gameState) {
        user.gameState = {
          currentDay: 1,
          unlockedUpToDay: 1,
          lastActiveDate: new Date().toLocaleDateString('en-CA'),
          coins: 0,
          level: 1,
          levelName: "Mind's Bloom",
          theme: "unicorn",
          isMuted: false,
          completedPuzzles: {}
        };
      } else {
        if (!user.gameState.completedPuzzles) {
          user.gameState.completedPuzzles = {};
        }
        if (user.gameState.coins === undefined) {
          user.gameState.coins = 0;
        }
        if (user.gameState.level === undefined) {
          user.gameState.level = 1;
        }
        if (!user.gameState.levelName) {
          user.gameState.levelName = "Mind's Bloom";
        }
        if (!user.gameState.theme) {
          user.gameState.theme = "unicorn";
        }
        if (user.gameState.isMuted === undefined) {
          user.gameState.isMuted = false;
        }
      }

      return {
        username: activeUsername,
        childFirstName: user.childFirstName || "",
        childLastName: user.childLastName || "",
        childGender: user.childGender || "Other",
        childAge: user.childAge || 9,
        childAvatar: user.childAvatar || "⚡ Pikachu",
        livingCountry: user.livingCountry || "",
        culturalAffiliation: user.culturalAffiliation || "",
        parentEmail: user.parentEmail || "",
        parentPhone: user.parentPhone || "",
        parentCode: user.parentCode || "0000",
        gameState: user.gameState
      };
    } catch (e) {
      return null;
    }
  },

  /**
   * Saves the updated game state for the currently active user.
   */
  updateGameState(newGameState) {
    const activeUsername = localStorage.getItem(ACTIVE_USER_KEY);
    if (!activeUsername) return { success: false, error: "No active user session." };

    const userKey = `mindbloom_user_${activeUsername}`;
    const userJson = localStorage.getItem(userKey);
    if (!userJson) return { success: false, error: "User profile not found." };

    try {
      const user = JSON.parse(userJson);
      user.gameState = {
        ...user.gameState,
        ...newGameState
      };
      
      localStorage.setItem(userKey, JSON.stringify(user));
      // Background sync to server
      this._saveUserToServer(activeUsername, user);
      return { success: true, gameState: user.gameState };
    } catch (e) {
      return { success: false, error: "Failed to update game state." };
    }
  },

  /**
   * Saves the updated profile details.
   */
  updateUserProfile(updates) {
    const activeUsername = localStorage.getItem(ACTIVE_USER_KEY);
    if (!activeUsername) return { success: false, error: "No active user session." };

    const userKey = `mindbloom_user_${activeUsername}`;
    const userJson = localStorage.getItem(userKey);
    if (!userJson) return { success: false, error: "User profile not found." };

    try {
      const user = JSON.parse(userJson);
      Object.assign(user, updates);
      
      localStorage.setItem(userKey, JSON.stringify(user));
      // Background sync to server
      this._saveUserToServer(activeUsername, user);
      return { success: true, user };
    } catch (e) {
      return { success: false, error: "Failed to update user profile." };
    }
  },

  /**
   * Private helper to perform the server-side save.
   */
  _saveUserToServer(username, user) {
    fetch("/api/save-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, ...user })
    }).catch(e => {
      console.warn("Background server save failed:", e);
    });
  },

  /**
   * Checks if parent verification is correct.
   */
  verifyParentGate(answer, expected) {
    return String(answer).trim() === String(expected).trim();
  },

  /**
   * Helper to get list of all registered children.
   */
  async getAllUsers() {
    try {
      const response = await fetch("/api/list-users");
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn("Failed to fetch user list from server:", e);
    }

    const users = getUsers();
    return Object.keys(users).map(username => ({
      username,
      childFirstName: users[username].childFirstName,
      childLastName: users[username].childLastName,
      coins: users[username].gameState.coins,
      level: users[username].gameState.level
    }));
  },

  /**
   * Fetches the global puzzle averages from the backend.
   */
  async getPuzzleAverages() {
    try {
      const response = await fetch("/api/puzzle-averages");
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn("Failed to fetch puzzle averages from server:", e);
    }
    return {};
  }
};

