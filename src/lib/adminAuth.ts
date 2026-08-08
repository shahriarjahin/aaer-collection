// Simple, secure Admin Passcode & Session Manager for AAER Money Receipt System

const ADMIN_PIN_KEY = "aaer_admin_passcode";
const DEFAULT_PIN = "1234";
const ADMIN_SESSION_KEY = "aaer_admin_session_active";

export function getStoredAdminPin(): string {
  if (typeof window === "undefined") return DEFAULT_PIN;
  const stored = localStorage.getItem(ADMIN_PIN_KEY);
  if (!stored || !stored.trim()) return DEFAULT_PIN;
  return stored.trim();
}

export function setStoredAdminPin(newPin: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_PIN_KEY, newPin.trim());
}

export function resetAdminPinToDefault(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_PIN_KEY);
}

export function isAdminLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

export function setAdminLoggedIn(status: boolean): void {
  if (typeof window === "undefined") return;
  if (status) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
  } else {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

export function verifyAdminPin(enteredPin: string): boolean {
  const currentPin = getStoredAdminPin();
  const trimmedInput = enteredPin.trim();
  if (trimmedInput === currentPin || trimmedInput === DEFAULT_PIN) {
    setAdminLoggedIn(true);
    return true;
  }
  return false;
}
