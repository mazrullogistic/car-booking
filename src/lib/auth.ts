import { api, getToken, removeToken, setToken } from "./api";

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
  user: AuthUser;
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
  return data.user;
}

export function logout(): void {
  removeToken();
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
