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

  let res;
  let payload;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
    payload = await parseJsonSafe(res);
  } catch (error) {
    throw new ApiError(
      `Unable to connect to backend at ${API_BASE_URL}. Make sure backend is running.`,
      0,
      { cause: error?.message || "network_error" }
    );
  }

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
  list: async (token) =>
    apiFetch("/api/users/", {
      method: "GET",
      token,
    }),
  getById: async (token, id) =>
    apiFetch(`/api/users/${id}`, {
      method: "GET",
      token,
    }),
  update: async (token, id, body) =>
    apiFetch(`/api/users/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify(body),
    }),
  delete: async (token, id) =>
    apiFetch(`/api/users/${id}`, {
      method: "DELETE",
      token,
    }),
};

export const householdsApi = {
  list: async (token, { page = 1, limit = 10, search = "" } = {}) => {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) q.set("search", search);
    return apiFetch(`/api/households?${q.toString()}`, { method: "GET", token });
  },
  getById: async (token, id) =>
    apiFetch(`/api/households/${id}`, {
      method: "GET",
      token,
    }),
  update: async (token, id, body) =>
    apiFetch(`/api/households/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify(body),
    }),
  delete: async (token, id) =>
    apiFetch(`/api/households/${id}`, {
      method: "DELETE",
      token,
    }),
  allWithZones: async (token) =>
    apiFetch("/api/households/all-with-zones", {
      method: "GET",
      token,
    }),
  myHouseholds: async (token) =>
    apiFetch("/api/households/my-households", {
      method: "GET",
      token,
    }),
  myWithZones: async (token) =>
    apiFetch("/api/households/my-with-zones", {
      method: "GET",
      token,
    }),
  create: async (token, body) =>
    apiFetch("/api/households", {
      method: "POST",
      token,
      body: JSON.stringify(body),
    }),
  zones: async (token, householdId) =>
    apiFetch(`/api/households/${householdId}/zones`, {
      method: "GET",
      token,
    }),
  createZone: async (token, householdId, body) =>
    apiFetch(`/api/households/${householdId}/zones`, {
      method: "POST",
      token,
      body: JSON.stringify(body),
    }),
};

export const savingPlansApi = {
  create: async (token, body) =>
    apiFetch("/SavingPlan", {
      method: "POST",
      token,
      body: JSON.stringify(body),
    }),
  getAll: async (token) =>
    apiFetch("/SavingPlan", {
      method: "GET",
      token,
    }),
  getCalculation: async (token) =>
    apiFetch("/SavingPlan/calculation", {
      method: "GET",
      token,
    }),
};

export const zonesApi = {
  update: async (token, zoneId, body) =>
    apiFetch(`/api/zones/${zoneId}`, {
      method: "PUT",
      token,
      body: JSON.stringify(body),
    }),
  delete: async (token, zoneId) =>
    apiFetch(`/api/zones/${zoneId}`, {
      method: "DELETE",
      token,
    }),
};


export const activitiesApi = {
  list: async (token) => 
    apiFetch("/api/activities", { method: "GET", token }),
  getById: async (token, id) =>
    apiFetch(`/api/activities/${id}`, { method: "GET", token }),
  create: async (token, body) =>
    apiFetch("/api/activities", {
      method: "POST",
      token,
      body: JSON.stringify(body),
    }),
  update: async (token, id, body) =>
    apiFetch(`/api/activities/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify(body),
    }),
  delete: async (token, id) =>
    apiFetch(`/api/activities/${id}`, { method: "DELETE", token }),
};

export const usageApi = {
  list: async (
    token,
    {
      page = 1,
      limit = 10,
      activityType = "",
      source = "",
      startDate = "",
      endDate = "",
      sort = "-occurredAt",
    } = {}
  ) => {
    const q = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sort,
    });

    if (activityType) q.set("activityType", activityType);
    if (source) q.set("source", source);
    if (startDate) q.set("startDate", startDate);
    if (endDate) q.set("endDate", endDate);

    return apiFetch(`/usage?${q.toString()}`, { method: "GET", token });
  },
  getById: async (token, id) =>
    apiFetch(`/usage/${id}`, {
      method: "GET",
      token,
    }),
  create: async (token, body) =>
    apiFetch("/usage", {
      method: "POST",
      token,
      body: JSON.stringify(body),
    }),
  update: async (token, id, body) =>
    apiFetch(`/usage/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify(body),
    }),
  delete: async (token, id) =>
    apiFetch(`/usage/${id}`, {
      method: "DELETE",
      token,
    }),
  carbonStats: async (token, { startDate = "", endDate = "" } = {}) => {
    const q = new URLSearchParams();
    if (startDate) q.set("startDate", startDate);
    if (endDate) q.set("endDate", endDate);
    return apiFetch(`/usage/carbon-stats${q.toString() ? `?${q.toString()}` : ""}`, {
      method: "GET",
      token,
    });
  },
  dailyWaterUsage: async (token, { days = 30 } = {}) => {
    const q = new URLSearchParams({ days: String(days) });
    return apiFetch(`/usage/daily-water-usage?${q.toString()}`, {
      method: "GET",
      token,
    });
  },
  carbonByActivity: async (token, { startDate = "", endDate = "" } = {}) => {
    const q = new URLSearchParams();
    if (startDate) q.set("startDate", startDate);
    if (endDate) q.set("endDate", endDate);
    return apiFetch(`/usage/carbon-by-activity${q.toString() ? `?${q.toString()}` : ""}`, {
      method: "GET",
      token,
    });
  },
  carbonTrend: async (token, { days = 30 } = {}) => {
    const q = new URLSearchParams({ days: String(days) });
    return apiFetch(`/usage/carbon-trend?${q.toString()}`, {
      method: "GET",
      token,
    });
  },
  carbonLeaderboard: async (token, { startDate = "", endDate = "", limit = 5 } = {}) => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (startDate) q.set("startDate", startDate);
    if (endDate) q.set("endDate", endDate);
    return apiFetch(`/usage/carbon-leaderboard?${q.toString()}`, {
      method: "GET",
      token,
    });
  },
};


