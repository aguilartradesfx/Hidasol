'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type UserRole = 'admin' | 'ventas' | 'diseno' | 'operario' | 'taller';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthSession {
  user: AuthUser;
  expiresAt: number;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (username: string, password: string) => { error: string | null };
  signOut: () => void;
  isAdmin: boolean;
  userRole: UserRole | null;
}

const AUTH_STORAGE_KEY = 'hidasol-session';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const VALID_USERS: { username: string; password: string; user: AuthUser }[] = [
  {
    username: 'admin',
    password: 'Hid@s0l-Admin2025',
    user: {
      id: 'admin-001',
      email: 'admin@hidasol.com',
      name: 'Admin',
      role: 'admin',
    },
  },
  {
    username: 'ventas',
    password: 'Hid@s0l-Ventas2025',
    user: {
      id: 'ventas-001',
      email: 'ventas@hidasol.com',
      name: 'Ventas',
      role: 'ventas',
    },
  },
  {
    username: 'diseno',
    password: 'Hid@s0l-Diseno2025',
    user: {
      id: 'diseno-001',
      email: 'diseno@hidasol.com',
      name: 'Diseño',
      role: 'diseno',
    },
  },
  {
    username: 'operario',
    password: 'Hid@s0l-Operario2025',
    user: {
      id: 'operario-001',
      email: 'operario@hidasol.com',
      name: 'Operario',
      role: 'operario',
    },
  },
  {
    username: 'taller',
    password: 'Hid@s0l-Taller2025',
    user: {
      id: 'taller-001',
      email: 'taller@hidasol.com',
      name: 'Taller',
      role: 'taller',
    },
  },
];

// Export for the credentials summary
export const USER_CREDENTIALS = VALID_USERS.map(u => ({
  role: u.user.name,
  username: u.username,
  password: u.password,
}));

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: () => ({ error: null }),
  signOut: () => {},
  isAdmin: false,
  userRole: null,
});

function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function saveSession(user: AuthUser): void {
  const session: AuthSession = {
    user,
    expiresAt: Date.now() + THIRTY_DAYS_MS,
  };
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // localStorage not available
  }
}

function clearSession(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ============================================================
// Role-based field permissions
// ============================================================

export type FieldPermission = 'edit' | 'readonly' | 'hidden';

const ROLE_EDITABLE_FIELDS: Record<UserRole, string[]> = {
  admin: ['*'],
  ventas: ['*'],
  diseno: ['disenadoPor', 'fechaEnvioArte'],
  operario: ['metrosDesperdicio', 'metrosImpresos', 'mlUsoTinta', 'impresoPor'],
  taller: ['finalizadoPor', 'realizadaPor'],
};

export function getFieldPermission(role: UserRole | null, field: string): FieldPermission {
  if (!role) return 'readonly';
  if (role === 'admin' || role === 'ventas') return 'edit';
  
  const editableFields = ROLE_EDITABLE_FIELDS[role] || [];
  if (editableFields.includes('*') || editableFields.includes(field)) {
    return 'edit';
  }
  return 'readonly';
}

export function canCreateOrders(role: UserRole | null): boolean {
  return role === 'admin' || role === 'ventas';
}

export function canEditFullOrder(role: UserRole | null): boolean {
  return role === 'admin' || role === 'ventas';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getStoredSession();
    if (session) {
      setUser(session.user);
    }
    setLoading(false);
  }, []);

  const signIn = (username: string, password: string): { error: string | null } => {
    const match = VALID_USERS.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    if (!match) {
      return { error: 'Usuario o contraseña incorrectos.' };
    }
    setUser(match.user);
    saveSession(match.user);
    return { error: null };
  };

  const signOut = () => {
    setUser(null);
    clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        isAdmin: user?.role === 'admin',
        userRole: user?.role || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
