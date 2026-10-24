// ResQGrid API Client & Offline Storage Manager

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const OFFLINE_DRAFTS_KEY = 'resqgrid_offline_drafts_v1';

// Helper for local offline draft storage
export const getOfflineDrafts = () => {
  try {
    const raw = localStorage.getItem(OFFLINE_DRAFTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to parse offline drafts', err);
    return [];
  }
};

export const saveOfflineDraft = (draft) => {
  const drafts = getOfflineDrafts();
  const newDraft = {
    ...draft,
    id: 'DRAFT-' + Date.now(),
    idempotency_key: draft.idempotency_key || `IDEM-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    saved_at: new Date().toISOString(),
    sync_status: 'NOT SENT — WAITING FOR CONNECTION'
  };
  drafts.unshift(newDraft);
  localStorage.setItem(OFFLINE_DRAFTS_KEY, JSON.stringify(drafts));
  return newDraft;
};

export const removeOfflineDraft = (draftId) => {
  const drafts = getOfflineDrafts().filter((d) => d.id !== draftId);
  localStorage.setItem(OFFLINE_DRAFTS_KEY, JSON.stringify(drafts));
};

// Unified fetch wrapper with role headers and error handling
async function request(endpoint, options = {}, role = 'coordinator', forceOffline = false) {
  if (forceOffline || !navigator.onLine) {
    throw new Error('OFFLINE_NETWORK_DISCONNECTED');
  }

  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-ResQGrid-Role': role,
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      let errMessage = `HTTP error ${res.status}`;
      try {
        const errorJson = await res.json();
        errMessage = errorJson.detail || errorJson.message || errMessage;
      } catch (_) {}
      throw new Error(errMessage);
    }
    return await res.json();
  } catch (err) {
    if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
      throw new Error('NETWORK_UNREACHABLE');
    }
    throw err;
  }
}

export const api = {
  getHealth: () => request('/health'),
  getStats: (role) => request('/api/stats', {}, role),
  
  // Emergency Requests
  getRequests: (params = {}, role) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/requests?${query}`, {}, role);
  },
  getRequest: (id, role) => request(`/api/requests/${id}`, {}, role),
  createRequest: (data, role, forceOffline) =>
    request('/api/requests', { method: 'POST', body: JSON.stringify(data) }, role, forceOffline),
  updateRequestStatus: (id, data, role) =>
    request(`/api/requests/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }, role),
  verifyRequest: (id, data, role) =>
    request(`/api/requests/${id}/verify`, { method: 'POST', body: JSON.stringify(data) }, role),

  // Resources
  getResources: (params = {}, role) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/resources?${query}`, {}, role);
  },
  createResource: (data, role) =>
    request('/api/resources', { method: 'POST', body: JSON.stringify(data) }, role),
  updateResourceStatus: (id, data, role) =>
    request(`/api/resources/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }, role),

  // Assignments
  getAssignments: (params = {}, role) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/assignments?${query}`, {}, role);
  },
  createAssignment: (data, role) =>
    request('/api/assignments', { method: 'POST', body: JSON.stringify(data) }, role),
  updateAssignmentStatus: (id, data, role) =>
    request(`/api/assignments/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }, role),

  // Shelters
  getShelters: (params = {}, role) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/shelters?${query}`, {}, role);
  },
  updateShelter: (id, data, role) =>
    request(`/api/shelters/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, role),

  // Alerts
  getAlerts: (params = {}, role) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/alerts?${query}`, {}, role);
  },
  createAlert: (data, role) =>
    request('/api/alerts', { method: 'POST', body: JSON.stringify(data) }, role),
  updateAlertCredibility: (id, data, role) =>
    request(`/api/alerts/${id}/credibility`, { method: 'PATCH', body: JSON.stringify(data) }, role),

  // Audit
  getAudit: (limit = 50, role) => request(`/api/audit?limit=${limit}`, {}, role),

  // Seed
  seed: (role) => request('/api/seed', { method: 'POST' }, role)
};
