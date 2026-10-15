import { createRoot } from "react-dom/client";

import { languageOf } from "@/lib/locale";

import App from "./App.tsx";

import "./index.css";

// public/boot.js has already set the theme, and sent a Polish reader new to
// the English home page to /pl, before this bundle was fetched.
createRoot(document.getElementById("root")!).render(
  <App language={languageOf(window.location.pathname)} />,
);
