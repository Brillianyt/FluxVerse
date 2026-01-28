import { create } from 'zustand';

// User interface matching our DB
export interface User {
  id: string;
  email: string;
  role?: string;
  user_metadata?: {
    avatar_url?: string;
    full_name?: string;
  };
}

interface AuthState {
  user: User | null;
  loading: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, code: string) => Promise<{ error?: string }>;
  sendCode: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const STORAGE_KEY = 'fluxverse_custom_user';
const TOKEN_KEY = 'fluxverse_auth_token';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  initialize: async () => {
    // 1. Check if token exists
    const storedToken = localStorage.getItem(TOKEN_KEY);

    if (!storedToken) {
      // No token found, clear everything
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOKEN_KEY);
      set({ user: null, loading: false });
      return;
    }

    try {
      // 2. DO NOT use optimistic UI updates
      // The user is not logged in until the server says so.
      // We only set loading to true.
      set({ loading: true });

      // 3. Verify with backend - This is the SOURCE OF TRUTH
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Update user with latest data from server
        set({ user: data.user, loading: false });
        // Sync to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
      } else {
        // Token invalid, expired, or user deleted -> FORCE LOGOUT
        throw new Error('Session invalid');
      }

    } catch (e) {
      console.warn('Session expired or invalid, logging out...');
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOKEN_KEY);
      set({ user: null, loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      console.log('[Frontend] Sending login request to /api/auth/login');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log(`[Frontend] Response status: ${response.status}`);
      const data = await response.json();
      console.log('[Frontend] Response data:', data);

      if (!response.ok) {
        set({ loading: false });
        return { error: data.error || 'Login failed' };
      }

      const { user, token } = data;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_KEY, token);
      set({ user, loading: false });
      return {};

    } catch (err: any) {
      console.error('[Frontend] Login error:', err);
      set({ loading: false });
      return { error: 'Network error or server unavailable' };
    }
  },

  sendCode: async (email: string) => {
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || 'Failed to send code' };
      }
      return {};
    } catch (err: any) {
      return { error: 'Network error' };
    }
  },

  register: async (email, password, code) => {
    set({ loading: true });
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        set({ loading: false });
        return { error: data.error || 'Registration failed' };
      }

      const { user, token } = data;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_KEY, token);
      set({ user, loading: false });
      return {};

    } catch (err: any) {
      console.error('Register error:', err);
      set({ loading: false });
      return { error: 'Network error or server unavailable' };
    }
  },

  signOut: async () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    set({ user: null });
    // Optional: Call backend logout endpoint if needed
  },
}));

export const useAuth = useAuthStore;
