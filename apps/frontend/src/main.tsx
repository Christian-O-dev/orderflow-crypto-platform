import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { registerRuntimeErrorReporter } from "./reportRuntimeError";
import "./styles.css";

registerRuntimeErrorReporter();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
