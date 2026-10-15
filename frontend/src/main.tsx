import { createRoot } from "react-dom/client";

import { autoLanguageRedirect, languageOf, readLanguageChoice } from "@/lib/locale";

import App from "./App.tsx";

import "./index.css";

// A Polish reader arriving at the English home page for the first time goes
// to /pl before anything is drawn (see autoLanguageRedirect). Here rather
// than in a script of its own in the page: the policy allows no inline
// script, and nothing renders before this line either way.
const redirect = autoLanguageRedirect({
  pathname: window.location.pathname,
  choice: readLanguageChoice(),
  browserLanguages: navigator.languages?.length ? navigator.languages : [navigator.language],
});

if (redirect) {
  window.location.replace(`${redirect}${window.location.search}${window.location.hash}`);
} else {
  createRoot(document.getElementById("root")!).render(
    <App language={languageOf(window.location.pathname)} />,
  );
}
