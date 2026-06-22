/**
 * storage.js - Auth & Game State Manager
 * Integrates with Python server APIs for profile persistence.
 * Saves user profiles as separate user_{username}.json files on the server.
 * Retains LocalStorage as a local cache/fallback for instant lookups and offline support.
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
      childFirstName: childData.firstName,
      childLastName: childData.lastName,
      childGender: childData.gender,
      childAge: parseInt(childData.age) || 9,
      childAvatar: childData.avatar || "⚡ Pikachu",
      livingCountry: childData.livingCountry,
      culturalAffiliation: childData.culturalAffiliation,
      gameState: {
        currentDay: 1,
        unlockedUpToDay: 1,
        lastActiveDate: new Date().toISOString().split("T")[0],
        coins: 0,
        level: 1,
        levelName: "Mind Bloom",
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
      console.warn("Register server call failed. Attempting offline registration:", e);
      
      // Offline fallback check
      if (localStorage.getItem(userKey)) {
        return { success: false, error: "Username already exists. Try a different one!" };
      }
      localStorage.setItem(userKey, JSON.stringify({ password: credentials.password, ...userData }));
      return { success: true };
    }
  },

  /**
   * Logs in the child with username and password.
   */
  async loginUser(username, password) {
    const normUsername = username.trim().toLowerCase();
    const userKey = `mindbloom_user_${normUsername}`;

    try {
      const response = await fetch(`/api/get-user?username=${encodeURIComponent(normUsername)}`);
      if (response.ok) {
        const user = await response.json();
        if (user.password !== password) {
          return { success: false, error: "Oops! Incorrect password. Try again." };
        }
        
        // Cache locally and set active user session
        localStorage.setItem(userKey, JSON.stringify(user));
        localStorage.setItem(ACTIVE_USER_KEY, normUsername);
        return { success: true, user: this.getCurrentUser() };
      } else if (response.status === 404) {
        return { success: false, error: "Username not found. Ask Mom or Dad to register you first!" };
      }
    } catch (e) {
      console.warn("Server connection failed during login. Falling back to local cache:", e);
    }

    // LocalStorage fallback (offline support)
    const userJson = localStorage.getItem(userKey);
    if (!userJson) {
      return { success: false, error: "Username not found. Ask Mom or Dad to register you first!" };
    }

    let user;
    try {
      user = JSON.parse(userJson);
    } catch (e) {
      return { success: false, error: "Error reading user data." };
    }

    if (user.password !== password) {
      return { success: false, error: "Oops! Incorrect password. Try again." };
    }

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
          lastActiveDate: new Date().toISOString().split("T")[0],
          coins: 0,
          level: 1,
          levelName: "Mind Bloom",
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
          user.gameState.levelName = "Mind Bloom";
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
    return parseInt(answer) === expected;
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
  }
};

