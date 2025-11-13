const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface AnalysisResponse {
  success: boolean;
  data?: {
    id: string;
    status: string;
  };
  error?: string;
}

export interface AnalysisStatusResponse {
  success: boolean;
  data?: {
    id: string;
    status: string;
    createdAt: string;
    completedAt?: string;
  };
  error?: string;
}

export interface AnalysisResultResponse {
  success: boolean;
  data?: {
    id: string;
    ticker: string;
    date: string;
    decision: string;
    status: string;
    state: any;
    createdAt: string;
    completedAt?: string;
  };
  error?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    // Try to load token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    } as Record<string, string>;

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Analysis endpoints
  async startAnalysis(params: {
    ticker: string;
    date?: string;
    selectedAnalysts?: string[];
    config?: any;
  }): Promise<AnalysisResponse> {
    return this.request<AnalysisResponse>('/api/v1/analysis/start', {
      method: 'POST',
      body: JSON.stringify({
        ticker: params.ticker,
        date: params.date || new Date().toISOString().split('T')[0],
        selectedAnalysts: params.selectedAnalysts,
        config: params.config,
      }),
    });
  }

  async getAnalysisStatus(id: string): Promise<AnalysisStatusResponse> {
    return this.request<AnalysisStatusResponse>(`/api/v1/analysis/${id}/status`);
  }

  async getAnalysisResult(id: string): Promise<AnalysisResultResponse> {
    return this.request<AnalysisResultResponse>(`/api/v1/analysis/${id}/result`);
  }

  async stopAnalysis(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/v1/analysis/${id}/stop`, {
      method: 'POST',
    });
  }

  async getAnalysisHistory(params?: {
    limit?: number;
    offset?: number;
    ticker?: string;
  }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    if (params?.ticker) query.append('ticker', params.ticker);

    return this.request(`/api/v1/analysis/history?${query.toString()}`);
  }

  // Auth endpoints
  async register(email: string, password: string): Promise<any> {
    const response = await this.request<any>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async login(email: string, password: string): Promise<any> {
    const response = await this.request<any>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  // Config endpoints
  async getConfig(): Promise<any> {
    return this.request('/api/v1/config');
  }

  async updateConfig(config: any): Promise<any> {
    return this.request('/api/v1/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // Health check
  async health(): Promise<{ status: string; uptime: number }> {
    return this.request('/health');
  }
}

export const apiClient = new ApiClient();
