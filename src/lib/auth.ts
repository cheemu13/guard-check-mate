const KEY = "icici-supervisor";

export function login(username: string) {
  window.localStorage.setItem(KEY, username);
}

export function logout() {
  window.localStorage.removeItem(KEY);
}

export function currentUser(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY);
}
