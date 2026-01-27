const STORAGE_KEY = "sidebets_client_key";

function generateKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `client-${Math.random().toString(36).slice(2, 12)}`;
}

export function getClientKey() {
  if (typeof window === "undefined") {
    return "server-client";
  }

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) {
      return existing;
    }
    const key = generateKey();
    window.localStorage.setItem(STORAGE_KEY, key);
    return key;
  } catch (error) {
    console.warn("Falling back to ephemeral client key", error);
    return generateKey();
  }
}
