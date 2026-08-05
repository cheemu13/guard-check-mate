const KEY = "icici-session";

export type Role = "guard" | "supervisor";

export interface Session {
  role: Role;
  /** Employee ID for guards, username for supervisors. */
  id: string;
  name: string;
  branch?: string;
}

export function login(session: Session) {
  window.localStorage.setItem(KEY, JSON.stringify(session));
}

export function logout() {
  window.localStorage.removeItem(KEY);
}

export function currentSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}
