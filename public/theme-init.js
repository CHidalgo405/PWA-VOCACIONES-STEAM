// Anti-FOUC: aplica el tema guardado antes de que Angular renderice.
// Vive en un archivo externo (no inline) para que script-src 'self' de la
// Content-Security-Policy no necesite 'unsafe-inline'.
(function () {
  // ThemeService (core/services/theme.service.ts) lee y escribe 'app-theme';
  // este script debe consultar la misma clave para evitar el flash de tema.
  var theme = localStorage.getItem('app-theme');
  if (theme === 'dark') {
    document.documentElement.classList.add('dark-theme');
    document.body.classList.add('dark-theme');
    var themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', '#0A0A0A');
  }
})();
