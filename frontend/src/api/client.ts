// ============================================================
// ATAS API Client — covers all 30 backend routes
// In development, requests are proxied through Vite (/api → localhost:8000).
// In production, set VITE_API_BASE_URL to the deployed backend origin.
// ============================================================
import axios from 'axios';

// In dev mode, Vite proxies /api/* → http://localhost:8000/* (see vite.config.ts).
// In production, set VITE_API_BASE_URL to the real backend URL.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach bearer token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type Status = 'APPROVED' | 'FLAGGED' | 'MANUAL_REVIEW' | 'PENDING';

export interface ExtractedInvoice {
  invoice_number: string;
  vendor_name: string;
  vendor_gstin: string;
  base_amount: number;
  tax_amount: number;
  total_amount: number;
  confidence_score: number;
}

export interface AuditResponse {
  status: 'APPROVED' | 'FLAGGED' | 'MANUAL_REVIEW';
  reason: string;
  extracted_data?: ExtractedInvoice;
}

export interface Vendor {
  vendor_gstin: string;
  vendor_name: string;
  state_code: string;
  risk_score: number;
  created_at: string;
  total_invoices?: number;
  flagged_invoices?: number;
}

export interface Invoice {
  invoice_id: string;
  vendor_gstin: string;
  base_amount: number;
  tax_amount: number;
  total_amount: number;
  status: Status;
  created_at: string;
  vendor_name?: string;
  state_code?: string;
  risk_score?: number;
  reason?: string;
  overridden_by?: string;
}

export interface BankTransaction {
  transaction_id: number;
  vendor_gstin: string;
  amount_paid: number;
  payment_date: string;
  created_at: string;
}

export interface AuditLogEvent {
  invoice_id: string;
  agent: 'Agent1_Vision' | 'Agent2_Ledger' | 'Agent3_Tax' | 'Pipeline';
  status: string;
}

export interface DashboardStats {
  total_invoices: number;
  approved: number;
  flagged: number;
  manual_review: number;
  pending: number;
  total_amount_audited: number;
}

export interface AuditTrailItem {
  agent_name: string;
  action_taken: string;
  reason: string;
  created_at: string;
}

export interface KnowledgeRule {
  rule_id: string;  // backend generates e.g. "rule_abc123"
  text: string;
}

export interface AIConfig {
  confidence_threshold: number;
  gemini_model: string;
  gst_rate: number;
}

// ─── Route 1: POST /audit-invoice ────────────────────────────────────────────
export const auditInvoice = (file: File): Promise<AuditResponse> => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post<AuditResponse>('/audit-invoice', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};

// ─── Route 2: POST /invoices/{id}/re-audit ───────────────────────────────────
export const reAuditInvoice = (invoice_id: string): Promise<AuditResponse> =>
  api.post<AuditResponse>(`/invoices/${invoice_id}/re-audit`).then(r => r.data);

// ─── Route 3: PATCH /invoices/{id}/override ──────────────────────────────────
export const overrideInvoice = (
  invoice_id: string,
  body: { status: Status; reason: string; overridden_by?: string }
) => api.patch(`/invoices/${invoice_id}/override`, body).then(r => r.data);

// ─── Route 5: GET /knowledge-base/rules ──────────────────────────────────────
export const getKnowledgeRules = (): Promise<{ total: number; rules: KnowledgeRule[] }> =>
  api.get('/knowledge-base/rules').then(r => r.data);

// ─── Route 6: POST /knowledge-base/rules ─────────────────────────────────────
export const addKnowledgeRule = (rule_text: string): Promise<KnowledgeRule> =>
  api.post('/knowledge-base/rules', { rule_text }).then(r => r.data);

// ─── Route 7: DELETE /knowledge-base/rules/{id} ──────────────────────────────
export const deleteKnowledgeRule = (rule_id: string) =>
  api.delete(`/knowledge-base/rules/${rule_id}`).then(r => r.data);

// ─── Route 8: GET /invoices ──────────────────────────────────────────────────
export const getInvoices = (
  params: { status?: string; limit?: number; offset?: number } = {}
): Promise<{ total: number; invoices: Invoice[] }> =>
  api.get('/invoices', { params }).then(r => r.data);

// ─── Route 9: GET /invoices/search ───────────────────────────────────────────
export const searchInvoices = (
  params: {
    vendor_name?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    min_amount?: number;
    max_amount?: number;
  }
): Promise<{ total: number; invoices: Invoice[] }> =>
  api.get('/invoices/search', { params }).then(r => r.data);

// ─── Route 10: GET /invoices/{id} ────────────────────────────────────────────
export const getInvoice = (invoice_id: string): Promise<Invoice> =>
  api.get<Invoice>(`/invoices/${invoice_id}`).then(r => r.data);

// ─── Route 11: GET /invoices/{id}/file ───────────────────────────────────────
export const getInvoiceFileUrl = (invoice_id: string): string => {
  // In dev, BASE_URL is '/api' so the file URL needs to be a full origin URL
  // for <img src> to work. Use window.location.origin as the base.
  if (BASE_URL.startsWith('/')) {
    return `${window.location.origin}${BASE_URL}/invoices/${invoice_id}/file`;
  }
  return `${BASE_URL}/invoices/${invoice_id}/file`;
};

// ─── Route 12: GET /invoices/{id}/audit-trail ────────────────────────────────
export const getAuditTrail = (invoice_id: string): Promise<{ invoice_id: string; trail: AuditTrailItem[] }> =>
  api.get(`/invoices/${invoice_id}/audit-trail`).then(r => r.data);

// ─── Route 13: DELETE /invoices/{id} ─────────────────────────────────────────
export const deleteInvoice = (invoice_id: string) =>
  api.delete(`/invoices/${invoice_id}`).then(r => r.data);

// ─── Route 14: GET /vendors ──────────────────────────────────────────────────
export const getVendors = (): Promise<{ vendors: Vendor[] }> =>
  api.get('/vendors').then(r => r.data);

// ─── Route 15: POST /vendors ──────────────────────────────────────────────────
export const createVendor = (body: {
  vendor_gstin: string;
  vendor_name: string;
  state_code: string;
  risk_score?: number;
}): Promise<Vendor> =>
  api.post('/vendors', body).then(r => r.data);

// ─── Route 16: GET /vendors/{gstin} ──────────────────────────────────────────
export const getVendor = (vendor_gstin: string): Promise<Vendor> =>
  api.get<Vendor>(`/vendors/${vendor_gstin}`).then(r => r.data);

// ─── Route 17: PATCH /vendors/{gstin} ────────────────────────────────────────
export const updateVendor = (
  vendor_gstin: string,
  body: Partial<{ vendor_name: string; state_code: string; risk_score: number }>
) => api.patch(`/vendors/${vendor_gstin}`, body).then(r => r.data);

// ─── Route 18: GET /vendors/{gstin}/invoices ─────────────────────────────────
export const getVendorInvoices = (vendor_gstin: string): Promise<{ vendor_gstin: string; invoices: Invoice[] }> =>
  api.get(`/vendors/${vendor_gstin}/invoices`).then(r => r.data);

// ─── Route 19: GET /ledgers ──────────────────────────────────────────────────
export const getLedgers = () =>
  api.get('/ledgers').then(r => r.data);

// ─── Route 21: GET /bank-transactions ────────────────────────────────────────
export const getBankTransactions = (): Promise<{ transactions: BankTransaction[] }> =>
  api.get('/bank-transactions').then(r => r.data);

// ─── Route 22: POST /bank-transactions ───────────────────────────────────────
export const createBankTransaction = (body: {
  vendor_gstin: string;
  amount_paid: number;
  payment_date?: string;
}): Promise<BankTransaction> =>
  api.post('/bank-transactions', body).then(r => r.data);

// ─── Route 23: GET /dashboard/stats ──────────────────────────────────────────
export const getDashboardStats = (): Promise<DashboardStats> =>
  api.get<DashboardStats>('/dashboard/stats').then(r => r.data);

// ─── Route 24: GET /invoices/{id}/export ─────────────────────────────────────
export const exportInvoice = (invoice_id: string) => {
  const token = localStorage.getItem('access_token');
  const base = BASE_URL.startsWith('/') ? `${window.location.origin}${BASE_URL}` : BASE_URL;
  const url = `${base}/invoices/${invoice_id}/export${token ? `?token=${token}` : ''}`;
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice_${invoice_id}.csv`;
  a.click();
};

// ─── Route 25: GET /reports/export ───────────────────────────────────────────
export const exportAllInvoices = () => {
  const token = localStorage.getItem('access_token');
  const base = BASE_URL.startsWith('/') ? `${window.location.origin}${BASE_URL}` : BASE_URL;
  const url = `${base}/reports/export${token ? `?token=${token}` : ''}`;
  const a = document.createElement('a');
  a.href = url;
  a.download = 'invoices_report.csv';
  a.click();
};

// ─── Route 26: POST /auth/login ──────────────────────────────────────────────
export const login = (username: string, password: string): Promise<{
  access_token: string;
  token_type: string;
  username: string;
  role: string;
}> =>
  api.post('/auth/login', { username, password }).then(r => r.data);

// ─── Route 27: GET /auth/me ──────────────────────────────────────────────────
export const getMe = (token: string): Promise<{ username: string; role: string }> =>
  api.get('/auth/me', { params: { token } }).then(r => r.data);

// ─── Route 28: GET /health ────────────────────────────────────────────────────
export const getHealth = (): Promise<{ status: string; db_connected: boolean }> =>
  api.get('/health').then(r => r.data);

// ─── Route 29: GET /settings/ai-config ───────────────────────────────────────
export const getAIConfig = (): Promise<AIConfig> =>
  api.get<AIConfig>('/settings/ai-config').then(r => r.data);

// ─── Route 30: PATCH /settings/ai-config ─────────────────────────────────────
export const updateAIConfig = (body: AIConfig): Promise<AIConfig> =>
  api.patch<{ message: string; config: AIConfig }>('/settings/ai-config', body)
    .then(r => r.data.config);

// ─── WebSocket Hook ───────────────────────────────────────────────────────────
/**
 * Derive ws:// or wss:// URL.
 * In dev, Vite proxies /ws/* → ws://localhost:8000/* (see vite.config.ts),
 * so we just use the same origin. In production, derive from VITE_API_BASE_URL.
 */
export const getWsUrl = (path: string): string => {
  const envBase = import.meta.env.VITE_API_BASE_URL;
  if (envBase) {
    // Production: derive ws/wss from the explicit API URL
    const wsBase = envBase.replace(/^http/, 'ws');
    return `${wsBase}${path}`;
  }
  // Dev: connect to the same origin — Vite proxy handles /ws/* forwarding
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${path}`;
};
