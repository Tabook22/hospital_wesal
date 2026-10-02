import {
  User, Patient, PatientCapacityStatus, Visitor, VisitorDetail,
  Visit, VisitorPass, ScanResult, DashboardData, NotificationItem,
  PolicySettings, TodayReport, WardReportItem, DenialReportItem,
  CurrentLiveReport, AuditLogItem,
  VisitorPatientSearchItem, VisitorPassBookRequest, VisitorExpressBookRequest, VisitorPassDetail, VisitorRegisterRequest,
  PendingVisitRequest,
  StaffIncidentItem, StaffIncidentCreatePayload, StaffIncidentUpdatePayload, IncidentStats
} from '../types';


const getApiBase = () => {
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }
  if (typeof window !== 'undefined' && (window.location.pathname.startsWith('/wesal') || window.location.hostname !== 'localhost')) {
    return '/wesal/api';
  }
  return 'http://localhost:9900/api';
};

const API_BASE = getApiBase();

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('wesal_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'An error occurred';
    try {
      const err = await response.json();
      errorDetail = err.detail || err.message || errorDetail;
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<{ access_token: string; role: string; full_name: string; username: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  getMe: () => request<User>('/auth/me'),

  // Patients
  getPatients: (search?: string, wardId?: number) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (wardId) params.append('ward_id', wardId.toString());
    return request<Patient[]>(`/patients?${params.toString()}`);
  },
  getPatient: (id: number) => request<Patient>(`/patients/${id}`),
  getPatientCapacity: (id: number) => request<PatientCapacityStatus>(`/patients/${id}/capacity`),

  // Visitors
  getVisitors: (search?: string, visitor_type?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (visitor_type) params.append('visitor_type', visitor_type);
    return request<Visitor[]>(`/visitors?${params.toString()}`);
  },
  getVisitor: (id: number) => request<VisitorDetail>(`/visitors/${id}`),
  createVisitor: (data: Partial<Visitor>) =>
    request<Visitor>('/visitors', { method: 'POST', body: JSON.stringify(data) }),

  // Visits
  getVisits: (status?: string, wardId?: number, search?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (wardId) params.append('ward_id', wardId.toString());
    if (search) params.append('search', search);
    return request<Visit[]>(`/visits?${params.toString()}`);
  },
  getActiveVisits: () => request<Visit[]>('/visits/active'),
  getVisit: (id: number) => request<Visit>(`/visits/${id}`),
  createVisit: (payload: {
    patient_id: number;
    visitor_id?: number;
    full_name?: string;
    civil_id?: string;
    mobile_number?: string;
    visitor_type?: string;
    relationship_to_patient?: string;
    notes?: string;
    service_type?: string;
    duration_minutes?: number;
  }) => request<Visit>('/visits', { method: 'POST', body: JSON.stringify(payload) }),
  checkoutVisit: (id: number) => request<{ message: string }>(`/visits/${id}/checkout`, { method: 'POST' }),
  cancelVisit: (id: number) => request<{ message: string }>(`/visits/${id}/cancel`, { method: 'POST' }),

  // Passes
  getPasses: () => request<VisitorPass[]>('/passes'),
  getPassByToken: (token: string) => request<any>(`/passes/${encodeURIComponent(token)}`),
  revokePass: (id: number) => request<{ message: string }>(`/passes/${id}/revoke`, { method: 'POST' }),

  // Gate Scanner
  scanGate: (token: string, checkpoint_code?: string, checkpoint_id?: number) =>
    request<ScanResult>('/gate/scan', {
      method: 'POST',
      body: JSON.stringify({ token, checkpoint_code, checkpoint_id }),
    }),

  // Checkpoints
  getCheckpoints: () => request<any[]>('/checkpoints'),
  getCheckpointScans: (id: number) => request<any[]>(`/checkpoints/${id}/scans`),

  // Dashboard
  getDashboardLive: () => request<DashboardData>('/dashboard/live'),

  // Alerts & Notifications
  getAlerts: (type?: string, status?: string) => {
    const params = new URLSearchParams();
    if (type) params.append('notification_type', type);
    if (status) params.append('status', status);
    return request<NotificationItem[]>(`/alerts?${params.toString()}`);
  },
  simulateAlert: (payload: { recipient_name: string; mobile_number: string; message: string; notification_type?: string }) =>
    request<NotificationItem>('/alerts/simulate', { method: 'POST', body: JSON.stringify(payload) }),

  // Settings
  getSettings: () => request<PolicySettings>('/settings'),
  updateSettings: (settings: Partial<PolicySettings>) =>
    request<PolicySettings>('/settings', { method: 'PUT', body: JSON.stringify(settings) }),

  // Reports
  getTodayReport: () => request<TodayReport>('/reports/today'),
  getWardReport: () => request<WardReportItem[]>('/reports/wards'),
  getDenialReport: () => request<DenialReportItem[]>('/reports/denials'),
  getCurrentLiveReport: () => request<CurrentLiveReport>('/reports/current'),

  // Audit
  getAuditLogs: (action?: string, limit: number = 100) => {
    const params = new URLSearchParams();
    if (action) params.append('action', action);
    params.append('limit', limit.toString());
    return request<AuditLogItem[]>(`/audit-logs?${params.toString()}`);
  },

  // Visitor Portal (Self-Service Tier 2)
  registerVisitor: (data: VisitorRegisterRequest) =>
    request<{ access_token: string; role: string; full_name: string; username: string }>('/visitor/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  searchVisitorPatients: (q?: string) => {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    return request<VisitorPatientSearchItem[]>(`/visitor/patients/search?${params.toString()}`);
  },
  bookVisitorPass: (data: VisitorPassBookRequest) =>
    request<VisitorPassDetail>('/visitor/passes/book', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  expressBookVisitorPass: (data: VisitorExpressBookRequest) =>
    request<VisitorPassDetail>('/visitor/passes/express-book', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMyVisitorPasses: (civilId?: string, mobile?: string) => {
    const params = new URLSearchParams();
    if (civilId) params.append('civil_id', civilId);
    if (mobile) params.append('mobile', mobile);
    return request<VisitorPassDetail[]>(`/visitor/my-passes?${params.toString()}`);
  },
  getPendingVisitRequests: () =>
    request<PendingVisitRequest[]>('/visitor/pending-requests'),
  approveVisitRequest: (visitId: number) =>
    request<{ message: string; visit_id: number; status: string }>(`/visitor/requests/${visitId}/approve`, {
      method: 'POST',
    }),
  rejectVisitRequest: (visitId: number, reason?: string) =>
    request<{ message: string; visit_id: number; status: string }>(`/visitor/requests/${visitId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // Staff Incidents & Internal Employee Messaging
  getIncidents: (params?: { status?: string; severity?: string; category?: string; ward_name?: string; reporter_name?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.severity) q.append('severity', params.severity);
    if (params?.category) q.append('category', params.category);
    if (params?.ward_name) q.append('ward_name', params.ward_name);
    if (params?.reporter_name) q.append('reporter_name', params.reporter_name);
    if (params?.limit) q.append('limit', params.limit.toString());
    return request<StaffIncidentItem[]>(`/incidents?${q.toString()}`);
  },
  getIncidentStats: () =>
    request<IncidentStats>('/incidents/stats'),
  getIncident: (id: number) =>
    request<StaffIncidentItem>(`/incidents/${id}`),
  createIncident: (payload: StaffIncidentCreatePayload) =>
    request<StaffIncidentItem>('/incidents', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateIncidentStatus: (id: number, payload: StaffIncidentUpdatePayload) =>
    request<StaffIncidentItem>(`/incidents/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};

