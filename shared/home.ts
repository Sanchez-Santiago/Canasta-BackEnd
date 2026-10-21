// Home HTML de GET /: compone datos (home-datos) + CSS (home-estilos).
// Unica fuente de la documentacion: getDocumentacionEndpoints().

import { getDocumentacionEndpoints } from "./home-datos";
import { HOME_CSS } from "./home-estilos";

/** Slug para anclas (#...) a partir del titulo. */
function slug(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Pasos sugeridos para probar la API en orden. */
function pasosFlujo(): string[] {
  return [
    "<strong>1.</strong> Abrir Bruno y cargar la carpeta <code>Consulta Api/Canasta+</code>.",
    "<strong>2.</strong> <code>Auth / Registrar</code> o <code>Login</code> (la cookie viaja sola).",
    "<strong>3.</strong> <code>Grupos / MisGrupos</code> y probar <code>Listas</code> y <code>Productos</code>.",
    "<strong>4.</strong> Seguir con <code>Movimientos</code>, <code>Ofertas</code>, <code>Invitaciones</code> y <code>Notificaciones</code>.",
  ];
}

/** Reglas del negocio resumidas. */
function reglasClave(): string[] {
  return [
    "Cada usuario tiene <strong>1 grupo personal</strong> automatico (no se edita ni elimina) y 0..N grupales.",
    "Dinero en <strong>centavos</strong> (entero) y fechas en <strong>TEXT ISO</strong>.",
    "Editar producto: <strong>cualquier miembro</strong>; eliminarlo: creadores o admin.",
    "Listas y movimientos: editar/eliminar solo <strong>creador o admin</strong>.",
    "Producto de lista: <strong>unidad_medida</strong> (de compra: docena, rollo, kg...), <strong>marca</strong> y <strong>categoria</strong>. Su <code>unidad_medida</code> es distinta de la de oferta (kg|L).",
    "Ofertas: catalogo global + ofertas por producto. El buscador no guarda nada; al crear un producto se buscan (nombre+marca+categoria) y guardan sus ofertas. Eliminar: admin del grupo, creador de la lista o del producto (el global solo lo borra el sistema). Las vencidas las limpia el backend.",
    "Invitar: <strong>solo admin</strong> y por email; aceptar suma como miembro.",
    "Notificaciones: <strong>tablon sin edicion</strong>; publica y borra el admin.",
  ];
}

/** Pagina completa de documentacion. */
export function renderHomePage(): string {
  const grupos = getDocumentacionEndpoints();
  const endpoints = grupos.flatMap((g) => g.endpoints);
  const total = endpoints.length;
  const publicas = endpoints.filter((e) => e.auth === "publica").length;
  const protegidas = total - publicas;

  const indice = grupos
    .map((g) => `<a href="#${slug(g.titulo)}">${g.icono} ${g.titulo}</a>`)
    .join("");

  const secciones = grupos
    .map((g) => {
      const filas = g.endpoints
        .map(
          (e) => `
        <tr>
          <td><span class="metodo metodo-${e.metodo}">${e.metodo}</span></td>
          <td><code>${e.ruta}</code></td>
          <td><span class="badge ${e.auth}">${e.auth}</span></td>
          <td>${e.descripcion}</td>
        </tr>`
        )
        .join("");
      return `
      <section class="card" data-modulo id="${slug(g.titulo)}">
        <h2>${g.icono} ${g.titulo}</h2>
        <p class="desc">${g.descripcion}</p>
        <div class="tabla-wrap">
        <table>
          <thead>
            <tr><th>Metodo</th><th>Ruta</th><th>Auth</th><th>Que hace</th></tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
        </div>
      </section>`;
    })
    .join("");

  const pasos = pasosFlujo()
    .map((p) => `<div class="paso">${p}</div>`)
    .join("");
  const reglas = reglasClave()
    .map((r) => `<li>${r}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Canasta+ API</title>
<style>${HOME_CSS}</style>
</head>
<body>
<header class="hero">
  <div class="hero-inner">
    <h1>🧺 Canasta<span>+</span> API</h1>
    <p>Gestion y planificacion de finanzas y compras personales o grupales: ingresos y gastos, grupos, listas con costo estimado, productos con prioridad y precio, ofertas, invitaciones y anuncios.</p>
    <div class="pills">
      <span class="pill">${total} endpoints</span><span class="pill">${grupos.length} modulos</span><span class="pill claro">${publicas} publicas</span><span class="pill claro">${protegidas} protegidas</span><span class="pill claro">JWT en cookie httpOnly</span>
    </div>
    <p>Solo <code>POST /auth/registrar</code> y <code>POST /auth/login</code> son publicas (mas esta pagina). Todo lo demas requiere la cookie <code>auth_token</code>.</p>
  </div>
</header>
<nav class="indice">${indice}</nav>
<div class="buscador-wrap">
  <input id="buscador" type="search" placeholder="Filtrar endpoints… (ej. oferta, miembro, estado)" autocomplete="off" />
  <p id="contador"></p>
</div>
<main>
  <section class="card">
    <h2>🚀 Como probar</h2>
    <div class="grid">${pasos}</div>
  </section>
  ${secciones}
  <section class="card">
    <h2>📏 Reglas clave</h2>
    <ul class="reglas">${reglas}</ul>
  </section>
</main>
<footer>Canasta+ backend · Route → Controller → Service → Model → SQLite</footer>
<script>
var input = document.getElementById('buscador');
var cuenta = document.getElementById('contador');
function filtrar() {
  var q = input.value.toLowerCase();
  var visibles = 0;
  var filas = document.querySelectorAll('tbody tr');
  for (var i = 0; i < filas.length; i++) {
    var ok = filas[i].textContent.toLowerCase().indexOf(q) !== -1;
    filas[i].style.display = ok ? '' : 'none';
    if (ok) visibles++;
  }
  var secs = document.querySelectorAll('section[data-modulo]');
  for (var j = 0; j < secs.length; j++) {
    var vis = 0;
    var trs = secs[j].querySelectorAll('tbody tr');
    for (var k = 0; k < trs.length; k++) {
      if (trs[k].style.display !== 'none') vis++;
    }
    secs[j].style.display = vis > 0 ? '' : 'none';
  }
  cuenta.textContent = visibles + ' endpoints visibles';
}
input.addEventListener('input', filtrar);
filtrar();
</script>
</body>
</html>`;
}
