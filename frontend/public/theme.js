// Sets the theme before the first paint (see index.html): the reader's
// remembered choice, else the machine's. SettingsContext takes over after.
(function () {
  var theme;
  try {
    theme = localStorage.getItem("theme");
  } catch (error) {
    theme = null;
  }
  if (theme !== "light" && theme !== "dark") {
    theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.dataset.theme = theme;
})();
