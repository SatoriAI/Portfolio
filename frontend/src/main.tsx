import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { renderAfresh } from "@/hooks/use-hydrated";
import { languageBasename, languageOf, stripLanguage } from "@/lib/locale";
import { createQueryClient } from "@/lib/queries";
import { preparePage } from "@/pages/routes";

import App, { AppRoutes } from "./App.tsx";

import "./index.css";

// public/boot.js has already set the theme, and sent a Polish reader new to
// the English home page to /pl, before this bundle was fetched.
const language = languageOf(window.location.pathname);
const queryClient = createQueryClient();
const root = document.getElementById("root")!;
const app = (
  <App language={language} queryClient={queryClient}>
    <BrowserRouter basename={languageBasename(language)}>
      <AppRoutes />
    </BrowserRouter>
  </App>
);

// Every page's HTML holds the page the build rendered (scripts/prerender.mjs),
// which the app takes over once it has what that render had: the page's
// chunk and a workshop piece's text. Rendered with anything else, it would
// differ, and React would throw the page away and draw it again. 404.html's
// root is empty, as no page was rendered for an address that does not exist.
if (root.hasChildNodes()) {
  void preparePage(stripLanguage(window.location.pathname), language, queryClient).then(() =>
    hydrateRoot(root, app, {
      // A mismatch is a bug in the render, not something to recover from quietly.
      onRecoverableError: (error) => console.error("Hydration:", error),
    }),
  );
} else {
  renderAfresh();
  createRoot(root).render(app);
}
