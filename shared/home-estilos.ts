// CSS de la home: tema claro/oscuro, responsive, sin dependencias.

export const HOME_CSS = `
  :root {
    --verde: #16a34a; --verde-osc: #15803d;
    --fondo: #f1f5f9; --tarjeta: #ffffff; --borde: #e2e8f0;
    --texto: #0f172a; --suave: #475569; --codigo: #f1f5f9;
    --hero1: #052e16; --hero2: #14532d;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --fondo: #020617; --tarjeta: #0f172a; --borde: #1e293b;
      --texto: #e2e8f0; --suave: #94a3b8; --codigo: #1e293b;
      --hero1: #022c22; --hero2: #14532d;
    }
  }
  * { box-sizing: border-box; }
  body {
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    margin: 0; background: var(--fondo); color: var(--texto); line-height: 1.55;
  }
  header.hero {
    background: linear-gradient(135deg, var(--hero1), var(--hero2));
    color: #fff; padding: 40px 20px 32px;
  }
  .hero-inner { max-width: 1000px; margin: 0 auto; }
  .hero h1 { margin: 0 0 8px; font-size: 32px; letter-spacing: -0.5px; }
  .hero h1 span { color: #4ade80; }
  .hero p { margin: 8px 0; max-width: 880px; color: #d1fae5; }
  .hero code { background: rgba(255,255,255,.14); color: #fff; }
  .pills { margin-top: 14px; }
  .pill {
    display: inline-block; background: var(--verde); color: #fff;
    border-radius: 999px; padding: 3px 14px; font-size: 13px; margin: 0 6px 6px 0;
  }
  .pill.claro { background: rgba(255,255,255,.16); }
  nav.indice { max-width: 1000px; margin: 0 auto; padding: 16px 20px 0; }
  nav.indice a {
    display: inline-block; margin: 0 8px 8px 0; padding: 4px 12px;
    border: 1px solid var(--borde); border-radius: 999px;
    color: var(--texto); text-decoration: none; font-size: 13px; background: var(--tarjeta);
  }
  nav.indice a:hover { border-color: var(--verde); }
  .buscador-wrap { max-width: 1000px; margin: 0 auto; padding: 12px 20px 0; }
  #buscador {
    width: 100%; padding: 10px 14px; font-size: 15px;
    border: 1px solid var(--borde); border-radius: 10px;
    background: var(--tarjeta); color: var(--texto);
  }
  #contador { color: var(--suave); font-size: 13px; margin: 6px 2px 0; }
  main { max-width: 1000px; margin: 0 auto; padding: 16px 20px 8px; }
  .card {
    background: var(--tarjeta); border: 1px solid var(--borde);
    border-radius: 14px; padding: 18px; margin-bottom: 16px;
    scroll-margin-top: 12px;
  }
  .card h2 { margin: 0 0 4px; font-size: 20px; }
  .card .desc { margin: 0 0 12px; color: var(--suave); font-size: 14px; }
  .tabla-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--borde); vertical-align: top; }
  th { color: var(--suave); font-weight: 600; font-size: 12px; text-transform: uppercase; }
  code { background: var(--codigo); padding: 2px 6px; border-radius: 6px; white-space: nowrap; font-size: 13px; }
  .metodo { font-weight: 700; font-size: 12px; padding: 2px 8px; border-radius: 6px; color: #fff; white-space: nowrap; }
  .metodo-GET { background: #2563eb; } .metodo-POST { background: #16a34a; }
  .metodo-PUT { background: #d97706; } .metodo-PATCH { background: #7c3aed; }
  .metodo-DELETE { background: #dc2626; }
  .badge { font-size: 12px; padding: 2px 8px; border-radius: 999px; white-space: nowrap; }
  .badge.publica { background: #dcfce7; color: #166534; }
  .badge.protegida { background: #fee2e2; color: #991b1b; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
  .paso { background: var(--codigo); border-radius: 10px; padding: 10px 12px; font-size: 14px; }
  .reglas { margin: 8px 0 0; padding-left: 20px; font-size: 14px; }
  .reglas li { margin-bottom: 6px; }
  footer { text-align: center; color: var(--suave); font-size: 13px; padding: 24px 16px 32px; }
  @media (max-width: 640px) {
    .hero h1 { font-size: 26px; }
    th:nth-child(3), td:nth-child(3) { display: none; }
  }
`;
