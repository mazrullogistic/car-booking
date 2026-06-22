import { api, getToken, removeToken, setToken } from "./api";

const REFRESH_TOKEN_KEY = "auth_refresh_token";

export interface AuthUser {
  id: number;
  display_name: string;
  username: string;
  email: string;
  mobile?: string;
  tenant?: { id: number; name: string; code: string };
  branch?: { id: number; name: string };
  role?: { id: number; name: string; slug: string };
}

interface LoginApiResponse {
  token: string;
  refresh_token?: string;
  user: AuthUser;
}

interface RefreshApiResponse {
  token: string;
  refresh_token?: string;
  user: AuthUser;
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function removeRefreshToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function register(
  email: string,
  password: string,
): Promise<AuthUser> {
  const data = await api<{ user: AuthUser }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return data.user;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthUser> {
  const data = await api<LoginApiResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  if (data.refresh_token) setRefreshToken(data.refresh_token);
  return data.user;
}

export async function refreshSession(): Promise<AuthUser | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const data = await api<RefreshApiResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    setToken(data.token);
    if (data.refresh_token) setRefreshToken(data.refresh_token);
    return data.user;
  } catch {
    removeToken();
    removeRefreshToken();
    return null;
  }
}

export function logout(): void {
  removeToken();
  removeRefreshToken();
  if (typeof window !== "undefined") {
    window.location.href = "/admin/login";
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!getToken()) return null;
  try {
    const data = await api<{ user: AuthUser }>("/auth/me");
    return data.user;
  } catch {
    removeToken();
    return null;
  }
}
