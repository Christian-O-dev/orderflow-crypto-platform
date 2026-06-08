function renderRuntimeError(message: string) {
  const root = document.getElementById("root");

  if (!root) {
    return;
  }

  root.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;background:#070A0F;color:#E5E7EB;padding:24px;font-family:Segoe UI,sans-serif;">
      <section style="max-width:720px;border:1px solid rgba(248,113,113,.35);background:rgba(69,10,10,.28);padding:24px;">
        <p style="margin:0 0 12px;font:12px monospace;letter-spacing:.3em;text-transform:uppercase;color:#FCA5A5;">Runtime error</p>
        <h1 style="margin:0;font-size:22px;">La terminal ha encontrado un error.</h1>
        <p style="color:#9CA3AF;line-height:1.6;">Esto reemplaza la pantalla negra por informacion util para depurar.</p>
        <pre style="white-space:pre-wrap;overflow:auto;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.12);padding:16px;color:#FEE2E2;font:12px monospace;">${message}</pre>
      </section>
    </main>
  `;
}

export function registerRuntimeErrorReporter() {
  window.addEventListener("error", (event) => {
    renderRuntimeError(event.error?.stack ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message =
      reason instanceof Error ? (reason.stack ?? reason.message) : String(reason);

    renderRuntimeError(message);
  });
}

