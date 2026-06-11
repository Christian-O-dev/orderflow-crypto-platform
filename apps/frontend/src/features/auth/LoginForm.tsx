import { useState } from "react";
import { useAuthStore } from "../../stores/authStore";

interface LoginFormProps {
  onSwitch: () => void;
}

export function LoginForm({ onSwitch }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      // El error ya se maneja en el store
    }
  };

  return (
    <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0B111A] p-8 shadow-2xl">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white">Iniciar Sesión</h2>
        <p className="mt-2 text-sm text-gray-400">Accede a la plataforma de Orderflow</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300">
            Correo electrónico
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-md border border-white/10 bg-[#161C24] px-4 py-2 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:text-sm"
              placeholder="tu@correo.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300">
            Contraseña
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-md border border-white/10 bg-[#161C24] px-4 py-2 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:text-sm"
              placeholder="••••••••"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full justify-center rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-[#070A0F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Cargando..." : "Entrar"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-gray-400">¿No tienes cuenta?</span>{" "}
        <button
          onClick={onSwitch}
          className="font-medium text-cyan-500 hover:text-cyan-400 focus:outline-none"
        >
          Regístrate aquí
        </button>
      </div>
    </div>
  );
}
