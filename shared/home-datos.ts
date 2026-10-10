// Datos de la documentacion: tipos + tabla de endpoints por modulo.
// La vista (home.ts) y los estilos (home-estilos.ts) viven aparte.

export interface EndpointDoc {
  metodo: string;
  ruta: string;
  auth: "publica" | "protegida";
  descripcion: string;
}

export interface GrupoEndpoints {
  titulo: string;
  icono: string;
  descripcion: string;
  endpoints: EndpointDoc[];
}

/** Tabla completa de endpoints: unica fuente para la home HTML. */
export function getDocumentacionEndpoints(): GrupoEndpoints[] {
  return [
    {
      titulo: "Raiz",
      icono: "🏠",
      descripcion: "Esta pagina: documentacion viva de la API.",
      endpoints: [
        {
          metodo: "GET",
          ruta: "/",
          auth: "publica",
          descripcion: "Esta pagina HTML: descripcion del sistema y rutas habilitadas.",
        },
        {
          metodo: "GET",
          ruta: "/logs",
          auth: "protegida",
          descripcion: "Historial de las ultimas 200 solicitudes (?limite=).",
        },
      ],
    },
    {
      titulo: "Auth - JWT en cookie httpOnly",
      icono: "🔑",
      descripcion: "Sesion con JWT en cookie. Solo registro y login son publicos.",
      endpoints: [
        {
          metodo: "POST",
          ruta: "/auth/registrar",
          auth: "publica",
          descripcion:
            "Crea usuario (bcrypt) y su grupo personal automatico. Devuelve token + setea cookie auth_token. Alias: /auth/register.",
        },
        {
          metodo: "POST",
          ruta: "/auth/login",
          auth: "publica",
          descripcion: "Valida email + contrasena. Devuelve token + setea cookie. Movil: guardar token y mandar Bearer.",
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
      icono: "👥",
      descripcion: "Un personal automatico por usuario + grupales. Roles: administrador y miembro.",
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
      icono: "📝",
      descripcion: "Listas de compras por grupo, con costo estimado automatico.",
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
      icono: "🛒",
      descripcion: "Items con cantidad, prioridad y precio estimado en centavos.",
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
    {
      titulo: "Movimientos - finanzas del grupo",
      icono: "💰",
      descripcion: "Ingresos y gastos por grupo, con resumen y balance.",
      endpoints: [
        {
          metodo: "GET",
          ruta: "/grupos/:idGrupo/movimientos",
          auth: "protegida",
          descripcion: "Lista movimientos del grupo. Filtro opcional ?tipo=ingreso|gasto.",
        },
        {
          metodo: "POST",
          ruta: "/grupos/:idGrupo/movimientos",
          auth: "protegida",
          descripcion: "Registra ingreso o gasto. Cualquier miembro puede crearlo.",
        },
        {
          metodo: "GET",
          ruta: "/grupos/:idGrupo/movimientos/resumen",
          auth: "protegida",
          descripcion: "Totales de ingresos, gastos y balance (centavos + pesos).",
        },
        {
          metodo: "GET",
          ruta: "/movimientos/:idMovimiento",
          auth: "protegida",
          descripcion: "Detalle del movimiento. Solo miembros de su grupo.",
        },
        {
          metodo: "PUT",
          ruta: "/movimientos/:idMovimiento",
          auth: "protegida",
          descripcion: "Edita movimiento. Solo creador o admin del grupo.",
        },
        {
          metodo: "DELETE",
          ruta: "/movimientos/:idMovimiento",
          auth: "protegida",
          descripcion: "Elimina movimiento. Solo creador o admin del grupo.",
        },
      ],
    },
    {
      titulo: "Ofertas - descuentos por producto",
      icono: "🏷️",
      descripcion: "Descuentos y comercios asociados a productos, con filtros.",
      endpoints: [
        {
          metodo: "GET",
          ruta: "/productos-lista/:idProductoLista/ofertas",
          auth: "protegida",
          descripcion: "Ofertas del producto. Filtros ?vigentes=true&localidad=X&provincia=Y.",
        },
        {
          metodo: "POST",
          ruta: "/productos-lista/:idProductoLista/ofertas",
          auth: "protegida",
          descripcion: "Asocia oferta/descuento a un producto. Cualquier miembro.",
        },
        {
          metodo: "GET",
          ruta: "/listas/:idLista/ofertas",
          auth: "protegida",
          descripcion: "Todas las ofertas de la lista. Mismos filtros.",
        },
        {
          metodo: "GET",
          ruta: "/ofertas/:idOferta",
          auth: "protegida",
          descripcion: "Detalle de la oferta. Solo miembros de su grupo.",
        },
        {
          metodo: "PUT",
          ruta: "/ofertas/:idOferta",
          auth: "protegida",
          descripcion: "Edita oferta. Cualquier miembro puede modificarla.",
        },
        {
          metodo: "DELETE",
          ruta: "/ofertas/:idOferta",
          auth: "protegida",
          descripcion: "Elimina oferta. Solo administrador del grupo.",
        },
      ],
    },
    {
      titulo: "Invitaciones - sumar miembros",
      icono: "✉️",
      descripcion: "Invitar por email; aceptar entra como miembro.",
      endpoints: [
        {
          metodo: "GET",
          ruta: "/grupos/:idGrupo/invitaciones",
          auth: "protegida",
          descripcion: "Invitaciones del grupo. Solo miembros.",
        },
        {
          metodo: "POST",
          ruta: "/grupos/:idGrupo/invitaciones",
          auth: "protegida",
          descripcion: "Invita por email. Solo admin. No vale para el personal.",
        },
        {
          metodo: "GET",
          ruta: "/invitaciones/recibidas",
          auth: "protegida",
          descripcion: "Mis invitaciones pendientes como destinatario.",
        },
        {
          metodo: "PATCH",
          ruta: "/invitaciones/:idInvitacion/responder",
          auth: "protegida",
          descripcion: "Aceptar (entra como miembro) o rechazar. Solo destino.",
        },
        {
          metodo: "DELETE",
          ruta: "/invitaciones/:idInvitacion",
          auth: "protegida",
          descripcion: "Cancela pendiente. Quien invito o admin.",
        },
      ],
    },
    {
      titulo: "Notificaciones - tablon grupal",
      icono: "📢",
      descripcion: "Anuncios del grupo: publica el admin, leen los miembros.",
      endpoints: [
        {
          metodo: "GET",
          ruta: "/grupos/:idGrupo/notificaciones",
          auth: "protegida",
          descripcion: "Anuncios del grupo. Solo miembros.",
        },
        {
          metodo: "POST",
          ruta: "/grupos/:idGrupo/notificaciones",
          auth: "protegida",
          descripcion: "Publica anuncio (tipo, titulo). Solo admin.",
        },
        {
          metodo: "GET",
          ruta: "/notificaciones/:idNotificacion",
          auth: "protegida",
          descripcion: "Detalle del anuncio. Solo miembros de su grupo.",
        },
        {
          metodo: "DELETE",
          ruta: "/notificaciones/:idNotificacion",
          auth: "protegida",
          descripcion: "Borra anuncio. Solo admin.",
        },
      ],
    },
  ];
}
