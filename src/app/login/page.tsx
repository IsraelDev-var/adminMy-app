"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { useAdminAuth } from "@/src/context/AdminAuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setLoading(true);

    // Simulación de autenticación
    await new Promise((r) => setTimeout(r, 1200));

    const validCredentials: Record<string, string> = {
      "admin@edesur.com.do": "Admin123!",
      "admin@edenorte.com.do": "Admin123!",
      "admin@edeeste.com.do": "Admin123@",
    };
    

    if (validCredentials[email] === password) {
      login(email);
      const ede = email.includes("edesur")
        ? "EDESUR"
        : email.includes("edenorte")
        ? "EDENORTE"
        : "EDEESTE";
      toast.success(`Bienvenido — ${ede}`);
      router.push("/dashboard");
    } else {
      toast.error("Credenciales incorrectas. Verifica tu correo y contraseña.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#135bec] mb-4 shadow-lg">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Proyecto Z</h1>
          <p className="text-sm text-muted-foreground mt-1">Panel de Administración</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Iniciar sesión</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Acceso exclusivo para administradores y distribuidoras
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Correo electrónico
              </label>
              <Input
                type="email"
                placeholder="admin@edesur.com.do"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Contraseña
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm text-[#135bec] hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Ingresar al panel"
              )}
            </Button>
          </form>

          <div className="mt-6 p-3 bg-muted rounded-lg space-y-1">
            <p className="text-xs text-muted-foreground font-medium text-center mb-2">
              Credenciales demo (contraseña: Admin123!)
            </p>
            <p className="text-xs text-muted-foreground">🔵 EDESUR — admin@edesur.com.do</p>
            <p className="text-xs text-muted-foreground">🟡 EDENORTE — admin@edenorte.com.do</p>
            <p className="text-xs text-muted-foreground">🟢 EDEESTE — admin@edeeste.com.do</p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Sistema de Gestión Eléctrica — República Dominicana
        </p>
      </div>
    </div>
  );
}
