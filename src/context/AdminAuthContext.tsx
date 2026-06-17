"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { DistributorName } from "@/src/types";
import { mockDistributors as distributors } from "@/src/data/mockData";

interface AdminSession {
  ede: DistributorName;
  adminName: string;
  adminEmail: string;
  color: string;
}

interface AdminAuthContextType {
  session: AdminSession | null;
  isAuthenticated: boolean;
  login: (email: string) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

const SESSION_KEY = "admin_session";

function resolveSession(email: string): AdminSession | null {
  if (email.includes("edesur")) {
    const dist = distributors.find((d) => d.name === "EDESUR")!;
    return { ede: "EDESUR", adminName: "Administrador EDESUR", adminEmail: email, color: dist.color };
  }
  if (email.includes("edenorte")) {
    const dist = distributors.find((d) => d.name === "EDENORTE")!;
    return { ede: "EDENORTE", adminName: "Administrador EDENORTE", adminEmail: email, color: dist.color };
  }
  if (email.includes("edeeste")) {
    const dist = distributors.find((d) => d.name === "EDEESTE")!;
    return { ede: "EDEESTE", adminName: "Administrador EDEESTE", adminEmail: email, color: dist.color };
  }
  return null;
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        setSession(JSON.parse(stored));
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  const login = (email: string) => {
    const s = resolveSession(email);
    if (s) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
      setSession(s);
    }
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{ session, isAuthenticated: !!session, login, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
}
