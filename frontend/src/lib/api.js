const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5000";

async function parseJsonSafe(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export async function apiFetch(path, { token, ...init } = {}) {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const payload = await parseJsonSafe(res);

  if (!res.ok) {
    const message =
      (payload && typeof payload === "object" && payload.message) ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status, payload);
  }
  return payload;
}

export const authApi = {
  register: async ({ name, email, password, role }) =>
    apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role }),
    }),
  login: async ({ email, password }) =>
    apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
};

export const usersApi = {
  me: async (token) =>
    apiFetch("/api/users/profile", {
      method: "GET",
      token,
    }),
};

