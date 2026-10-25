const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1').replace(/\/+$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': '1',
      ...options.headers,
    },
  });

  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

export const api = {
  getHabits: (params = {}) => {
    const query = new URLSearchParams({ limit: '100', ...params });
    return request(`/habits?${query.toString()}`);
  },
  getCheckIns: (from, to) => {
    const query = new URLSearchParams({ from, to });
    return request(`/check-ins?${query.toString()}`);
  },
  createHabit: (body) => request('/habits', { method: 'POST', body: JSON.stringify(body) }),
  updateHabit: (id, body) => request(`/habits/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  upsertCheckIn: (habitId, date, note) => request(`/check-ins/habits/${habitId}`, {
    method: 'PUT',
    body: JSON.stringify({ date, note }),
  }),
  removeCheckIn: (habitId, date) => request(`/check-ins/habits/${habitId}/${date}`, { method: 'DELETE' }),
};
