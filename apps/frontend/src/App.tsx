function App() {
  return (
    <main className="min-h-screen bg-[#0B0E14] text-[#E5E7EB]">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6">
        <header className="border-b border-white/10 pb-4">
          <p className="font-mono text-sm text-cyan-300">BTCUSDT</p>
          <h1 className="mt-2 text-2xl font-semibold">
            Order Flow Crypto Platform
          </h1>
        </header>

        <div className="grid flex-1 place-items-center">
          <div className="w-full max-w-3xl border border-white/10 bg-[#111827] p-6">
            <h2 className="text-lg font-semibold">Fase 0 preparada</h2>
            <p className="mt-3 text-sm leading-6 text-[#9CA3AF]">
              Frontend React, backend Node y paquete shared listos para empezar
              con datos mock en la siguiente fase.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
