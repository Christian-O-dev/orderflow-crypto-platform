import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Frontend render error", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="grid min-h-screen place-items-center bg-[#070A0F] p-6 text-[#E5E7EB]">
          <section className="max-w-2xl border border-red-400/30 bg-red-950/20 p-6">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-red-300">
              Frontend error
            </p>
            <h1 className="mt-3 text-xl font-semibold">
              La terminal se ha detenido antes de renderizar.
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#9CA3AF]">
              Esto sustituye la pantalla negra por un error visible para poder
              depurarlo rapido.
            </p>
            <pre className="mt-4 overflow-auto border border-white/10 bg-black/40 p-4 font-mono text-xs text-red-100">
              {this.state.error.message}
            </pre>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

