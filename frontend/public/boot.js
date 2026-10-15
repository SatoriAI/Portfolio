// Runs before the first paint, from index.html's head: a file of its own,
// not inline, because the site's CSP allows scripts from the site only.
// Classic and blocking on purpose; it is a few lines, and src/lib/boot.test.ts
// runs this very file.
(function () {
  var stored = function (key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  };

  // A reader opening the English home page who has never chosen a language
  // with the toggle (src/lib/locale.ts keeps that choice) and whose browser
  // prefers Polish goes to /pl, before the bundle is even fetched. No other
  // address ever moves, and a crawler asks in English, so it reads the page
  // it requested.
  var choice = stored("languageChoice");
  var languages =
    navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
  var preferred = String(languages[0] || "").toLowerCase();
  if (
    location.pathname === "/" &&
    choice !== "en" &&
    choice !== "pl" &&
    preferred.indexOf("pl") === 0
  ) {
    location.replace("/pl" + location.search + location.hash);
    return;
  }

  // The theme: the reader's remembered choice, else the machine's.
  // SettingsContext takes over after.
  var theme = stored("theme");
  if (theme !== "light" && theme !== "dark") {
    theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.dataset.theme = theme;
})();
