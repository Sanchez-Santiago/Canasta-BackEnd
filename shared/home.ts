export interface EndpointDoc {
  metodo: string;
  ruta: string;
  auth: "publica" | "protegida";
  descripcion: string;
}

export interface GrupoEndpoints {
  titulo: string;
  endpoints: EndpointDoc[];
}

export function getDocumentacionEndpoints(): GrupoEndpoints[] {
  return [
    {
      titulo: "Raiz",
      endpoints: [
        {
          metodo: "GET",
          ruta: "/",
          auth: "publica",
          descripcion: "Esta pagina HTML: descripcion del sistema y rutas habilitadas.",
        },
      ],
    },
    {
      titulo: "Auth - JWT en cookie httpOnly",
      endpoints: [
        {
          metodo: "POST",
          ruta: "/auth/registrar",
          auth: "publica",
          descripcion:
            "Crea usuario (bcrypt) y su grupo personal automatico. Setea cookie auth_token. Alias: /auth/register.",
        },
        {
          metodo: "POST",
          ruta: "/auth/login",
          auth: "publica",
          descripcion: "Valida email + contrasena y setea cookie auth_token.",
        },
        {
          metodo: "GET",
          ruta: "/auth/yo",
          auth: "protegida",
          descripcion: "Devuelve el usuario autenticado segun la cookie.",
        },
        {
          metodo: "POST",
          ruta: "/auth/logout",
          auth: "protegida",
          descripcion: "Limpia la cookie auth_token y cierra sesion.",
        },
      ],
    },
    {
      titulo: "Grupos - 1 personal + N grupales",
      endpoints: [
        {
          metodo: "GET",
          ruta: "/grupos",
          auth: "protegida",
          descripcion: "Lista mis grupos (personal + grupales) con rol y fecha_ingreso.",
        },
        {
          metodo: "POST",
          ruta: "/grupos/grupal",
          auth: "protegida",
          descripcion: "Crea grupo grupal. El creador queda administrador.",
        },
        {
          metodo: "GET",
          ruta: "/grupos/:idGrupo",
          auth: "protegida",
          descripcion: "Detalle de un grupo al que pertenezco, con mi rol.",
        },
        {
          metodo: "GET",
          ruta: "/grupos/:idGrupo/miembros",
          auth: "protegida",
          descripcion: "Lista miembros con rol (admins primero). Solo miembros.",
        },
        {
          metodo: "PUT",
          ruta: "/grupos/:idGrupo",
          auth: "protegida",
          descripcion: "Edita grupo grupal (solo admin). El personal no se modifica.",
        },
        {
          metodo: "DELETE",
          ruta: "/grupos/:idGrupo",
          auth: "protegida",
          descripcion: "Elimina grupo grupal (solo admin). El personal no se elimina.",
        },
      ],
    },
    {
      titulo: "Listas - pertenecen a un grupo",
      endpoints: [
        {
          metodo: "GET",
          ruta: "/grupos/:idGrupo/listas",
          auth: "protegida",
          descripcion: "Lista las listas del grupo. Solo miembros.",
        },
        {
          metodo: "POST",
          ruta: "/grupos/:idGrupo/listas",
          auth: "protegida",
          descripcion: "Crea lista activa. Cualquier miembro puede crearla.",
        },
        {
          metodo: "GET",
          ruta: "/listas/:idLista",
          auth: "protegida",
          descripcion: "Detalle de la lista. Solo miembros de su grupo.",
        },
        {
          metodo: "PUT",
          ruta: "/listas/:idLista",
          auth: "protegida",
          descripcion: "Edita lista. Solo creador o admin del grupo.",
        },
        {
          metodo: "PATCH",
          ruta: "/listas/:idLista/estado",
          auth: "protegida",
          descripcion: "Cambia estado: activa | completada | archivada.",
        },
        {
          metodo: "GET",
          ruta: "/listas/:idLista/total-estimado",
          auth: "protegida",
          descripcion: "Calcula SUM(cantidad x precio_unitario). Centavos + pesos.",
        },
        {
          metodo: "DELETE",
          ruta: "/listas/:idLista",
          auth: "protegida",
          descripcion: "Elimina lista (CASCADE productos). Creador o admin.",
        },
      ],
    },
    {
      titulo: "Productos - items de la lista",
      endpoints: [
        {
          metodo: "GET",
          ruta: "/listas/:idLista/productos",
          auth: "protegida",
          descripcion: "Lista productos ordenados por prioridad y fecha.",
        },
        {
          metodo: "POST",
          ruta: "/listas/:idLista/productos",
          auth: "protegida",
          descripcion: "Agrega producto. Cualquier miembro puede crearlo.",
        },
        {
          metodo: "GET",
          ruta: "/productos-lista/:idProductoLista",
          auth: "protegida",
          descripcion: "Detalle del producto. Solo miembros de su grupo.",
        },
        {
          metodo: "PUT",
          ruta: "/productos-lista/:idProductoLista",
          auth: "protegida",
          descripcion: "Edita producto. Cualquier miembro puede modificarlo.",
        },
        {
          metodo: "PATCH",
          ruta: "/productos-lista/:idProductoLista/estado",
          auth: "protegida",
          descripcion: "Cambia estado: pendiente | comprado | omitido.",
        },
        {
          metodo: "DELETE",
          ruta: "/productos-lista/:idProductoLista",
          auth: "protegida",
          descripcion: "Elimina producto. Solo creador, creador lista o admin.",
        },
      ],
    },
  ];
}

export function renderHomePage(): string {
  const grupos = getDocumentacionEndpoints();
  const total = grupos.reduce((n, g) => n + g.endpoints.length, 0);

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
      <section class="card">
        <h2>${g.titulo}</h2>
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

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Canasta+ API</title>
<style>
  :root { color-scheme: light dark; --verde: #16a34a; --fondo: #f8fafc; }
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 0; background: var(--fondo); color: #0f172a; }
  header { background: #0f172a; color: #fff; padding: 32px 20px; }
  header h1 { margin: 0 0 8px; font-size: 28px; }
  header h1 span { color: #4ade80; }
  header p { margin: 6px 0; max-width: 900px; line-height: 1.5; }
  .pill { display: inline-block; background: #16a34a; color: #fff; border-radius: 999px; padding: 2px 12px; font-size: 13px; margin-right: 6px; }
  main { max-width: 1000px; margin: 0 auto; padding: 20px; }
  .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
  .card h2 { margin: 0 0 12px; font-size: 19px; }
  .tabla-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  code { background: #f1f5f9; padding: 2px 6px; border-radius: 6px; white-space: nowrap; }
  .metodo { font-weight: 700; font-size: 12px; padding: 2px 8px; border-radius: 6px; color: #fff; }
  .metodo-GET { background: #2563eb; } .metodo-POST { background: #16a34a; }
  .metodo-PUT { background: #d97706; } .metodo-PATCH { background: #7c3aed; }
  .metodo-DELETE { background: #dc2626; }
  .badge { font-size: 12px; padding: 2px 8px; border-radius: 999px; }
  .badge.publica { background: #dcfce7; color: #166534; }
  .badge.protegida { background: #fee2e2; color: #991b1b; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
  footer { text-align: center; color: #64748b; font-size: 13px; padding: 20px; }
  a { color: #16a34a; }
</style>
</head>
<body>
<header>
  <h1>Canasta<span>+</span> API</h1>
  <p>Gestion y planificacion de finanzas y compras personales o grupales: ingresos y gastos, grupos, listas de compras con costo estimado, productos con prioridad y precio, y permisos por rol.</p>
  <p><span class="pill">${total} endpoints</span><span class="pill">JWT en cookie httpOnly</span><span class="pill">Zod</span><span class="pill">SQLite / Turso</span></p>
  <p>Auth: solo <code>POST /auth/registrar</code> y <code>POST /auth/login</code> son publicas (mas esta pagina <code>GET /</code>). Todo lo demas requiere cookie <code>auth_token</code>. Proba con Bruno: <code>Consulta Api/Canasta+</code>.</p>
</header>
<main>
  <section class="card">
    <h2>Como probar</h2>
    <div class="grid">
      <div><strong>1.</strong> Abrir Bruno y cargar la carpeta <code>Consulta Api/Canasta+</code>.</div>
      <div><strong>2.</strong> Elegir environment <code>Local</code> (<code>{{baseUrl}}</code>).</div>
      <div><strong>3.</strong> <code>Auth / Registrar</code> o <code>Login</code> (guarda cookie sola).</div>
      <div><strong>4.</strong> Probar <code>Grupos</code>, <code>Listas</code> y <code>Productos</code> en orden.</div>
    </div>
  </section>
  ${secciones}
  <section class="card">
    <h2>Reglas clave</h2>
    <p>Cada usuario tiene 1 grupo personal automatico (no se edita ni elimina). Puede tener 0..N grupales. Listas pertenecen a un grupo. Productos pertenecen a una lista. Precios en centavos (entero). Editar producto: cualquier miembro. Eliminar producto: solo creador, creador lista o admin.</p>
  </section>
</main>
<footer>Canasta+ backend - Route -&gt; Controller -&gt; Service -&gt; Model -&gt; SQLite</footer>
</body>
</html>`;
}
