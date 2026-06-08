import type { ReactNode } from "react";

type TerminalShellProps = {
  children: ReactNode;
};

export function TerminalShell({ children }: TerminalShellProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070A0F] text-[#E5E7EB]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.9),rgba(3,7,18,0.96))]" />
      <section className="relative mx-auto flex min-h-screen max-w-[1920px] flex-col px-2 py-2 sm:px-3 lg:px-4">
        {children}
      </section>
    </main>
  );
}
