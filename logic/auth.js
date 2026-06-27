/**
 * logic/auth.js — Authentication Form Handling
 *
 * Extracted from app.js during Phase 2 refactoring.
 * Manages login/register form UI, form submission, and logout.
 */

import { StorageService } from "./storage.js";
import { SoundManager } from "../helpers/sound.js";

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Wires all authentication event listeners.
 * @param {object} callbacks
 *   - onLoginSuccess(user)   — called after successful login
 *   - onLogout()             — called after logout
 */
export function setupAuth(callbacks) {
  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const btnLogout = document.getElementById("btn-logout");

  // Tab switching
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
  const regForm = document.getElementById("register-form");
  if (regForm) {
    regForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideAuthError();
      console.log("Submit event intercepted by auth.js!");

      const password = document.getElementById("reg-password").value;
      const confirmPassword = document.getElementById("reg-confirm-password").value;
      if (password !== confirmPassword) {
        console.log("Passwords do not match");
        SoundManager.playError();
        showAuthError("Passwords do not match. Please retype your password.");
        return;
      }

      const parentCode = document.getElementById("parent-code").value.trim();
      if (!/^\d{4}$/.test(parentCode)) {
        console.log("Invalid parent code");
        SoundManager.playError();
        showAuthError("Parent secret code must be exactly 4 digits!");
        return;
      }

      console.log("Validation passed, calling StorageService.registerUser");
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
        callbacks.onLoginSuccess(loginRes.user);
      }
    } else {
      SoundManager.playError();
      showAuthError(res.error);
    }
  });
  } // END of if (regForm)

  // Login submit
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAuthError();
    const u = document.getElementById("login-username").value;
    const p = document.getElementById("login-password").value;

    const res = await StorageService.loginUser(u, p);
    if (res.success) {
      SoundManager.playSuccess();
      callbacks.onLoginSuccess(res.user);
    } else {
      SoundManager.playError();
      showAuthError(res.error);
    }
  });

  // Logout
  btnLogout.addEventListener("click", () => {
    SoundManager.playClick();
    StorageService.logoutUser();
    callbacks.onLogout();
  });
}

/**
 * Resets both auth forms to their default state.
 */
export function resetAuthForms() {
  document.getElementById("login-form").reset();
  document.getElementById("register-form").reset();
  document.getElementById("tab-login").click();
}

// ── Internal helpers ───────────────────────────────────────────────────────

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
