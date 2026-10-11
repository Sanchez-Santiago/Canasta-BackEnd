# 📖 Canasta+ API — Referencia exacta

Base: `http://localhost:3000`. Web usa cookie `auth_token`; apps mandan
`Authorization: Bearer <jwt>` (devuelto en `data.token` al registrar/loguear).

## Convenciones

| Tema | Formato |
|---|---|
| Respuesta OK | `{ "ok": true, "data": {...} }` (201 en altas) |
| Respuesta error | `{ "ok": false, "error": "..." }` (+ `detalles`/`recomendaciones` a veces) |
| Auth | 🔓 pública / 🔒 cookie o Bearer |
| IDs por path | van como texto en la URL, se validan como entero positivo |
| Dinero | `INTEGER` en **centavos** (`monto`, precios) |
| Fechas guardadas | `TEXT` `"YYYY-MM-DD HH:MM:SS"` |
| Fechas que se envían | `"YYYY-MM-DD"` o `"YYYY-MM-DD HH:MM:SS"` |
| Nulos | campo opcional no enviado → `null` |

## Auth

### POST /auth/registrar 🔓 (alias `/auth/register`)

Recibe body, ejemplo:

```json
{ "nombre": "Test", "email": "test@canasta.local", "contrasena": "Fuerte_2026!", "localidad": "Córdoba", "provincia": "Córdoba", "pais": "Argentina", "domicilio": "Av. Colón 1200" }
```

- Requeridos: `nombre` (2–100), `email` (válido, ≤150), `contrasena` (8–100 + fuerte: puntaje ≥ 3 con largo/mayúsculas/números/símbolos, no común).
- Opcionales: `localidad`, `provincia`, `pais` (≤100), `domicilio` (≤200).

Devuelve `201` (+ cookie, crea el grupo personal):

```json
{ "ok": true, "data": { "usuario": { "id_usuario": 4, "nombre": "Test", "email": "test@canasta.local", "localidad": null, "provincia": null, "pais": null, "domicilio": null, "fecha_creacion": "2026-10-10 17:53:02" }, "token": "<jwt>" } }
```

Fallos: `400 Datos inválidos + detalles[]`; `400 { "ok": false, "error": "Contraseña demasiado débil", "recomendaciones": ["Agregá al menos un número"] }`; `409 { "ok": false, "error": "El email ya se encuentra registrado" }`.

### POST /auth/login 🔓

Recibe body, ejemplo:

```json
{ "email": "test@canasta.local", "contrasena": "Fuerte_2026!" }
```

- Requeridos: `email` (válido), `contrasena` (≥1, sin trim).

Devuelve `200 { ok:true, data:{ usuario:{ "id_usuario": 4, "nombre": "Test", "email": "test@canasta.local", "localidad": null, "provincia": null, "pais": null, "domicilio": null, "fecha_creacion": "2026-10-10 17:53:02" }, token:"<jwt>" } }` (+ cookie).

Fallos:

```json
{ "ok": false, "error": "No existe un usuario con ese email" }  // 404
{ "ok": false, "error": "Contraseña incorrecta" }                // 401
```

### GET /auth/yo 🔒

Sin body. Devuelve `200 { ok:true, data:{ usuario:{ "id_usuario": 4, "nombre": "Test", "email": "test@canasta.local", "localidad": null, "provincia": null, "pais": null, "domicilio": null, "fecha_creacion": "2026-10-10 17:53:02" } } }`.
Fallo: `401 { "ok": false, "error": "No autorizado" }`.

### PUT /auth/yo 🔒

Recibe body parcial (al menos 1 campo; `email`/`contrasena` se ignoran), ejemplo:

```json
{ "nombre": "Santiago", "localidad": "Córdoba", "provincia": "Córdoba", "pais": "Argentina", "domicilio": "Av. Colón 1200" }
```

- Opcionales: `nombre` (2–100), `localidad`, `provincia`, `pais` (≤100), `domicilio` (≤200). Vacío (`""`) → `null`.

Devuelve `200 { ok:true, data:{ usuario:{ "id_usuario": 2, "nombre": "Santiago", "email": "ana@test.com", "localidad": "Córdoba", "provincia": null, "pais": null, "domicilio": null, "fecha_creacion": "2026-10-08 20:20:31" } } }`.
Fallo: `400 { "ok": false, "error": "Datos inválidos", "detalles": [{ "path": [], "message": "Enviá al menos un campo para actualizar" }] }`.

### PATCH /auth/contrasena 🔒

Recibe body, ejemplo:

```json
{ "contrasena_actual": "Fuerte_2026!", "contrasena_nueva": "Otra_2027!" }
```

- Requeridos: `contrasena_actual` (≥1), `contrasena_nueva` (8–100, distinta y fuerte).

Devuelve `200 { "ok": true, "data": { "actualizado": true } }`.
Fallos: `401 { "ok": false, "error": "Contraseña actual incorrecta" }`; `400 { "ok": false, "error": "La nueva contraseña debe ser diferente" }`; `400 Contraseña demasiado débil + recomendaciones[]`.

### POST /auth/logout 🔒

Sin body. Devuelve `200 { "ok": true, "mensaje": "Sesión cerrada" }` (limpia cookie; en móvil borrar el token guardado).

## Grupos

### GET /grupos 🔒

Sin body. Devuelve `200`:

```json
{
  "ok": true,
  "data": {
    "grupos": [
      {
        "id_grupo": 6,
        "nombre": "Mi grupo (Test)",
        "descripcion": null,
        "categoria": null,
        "tipo": "personal",
        "fecha_creacion": "2026-10-09 20:02:24",
        "rol": "administrador",
        "fecha_ingreso": "2026-10-09 20:02:24"
      }
    ]
  }
}
```

### POST /grupos/grupal 🔒

Recibe body, ejemplo:

```json
{
  "nombre": "Compras del mes",
  "descripcion": "Grupo familiar",
  "categoria": "hogar"
}
```

- Requerido: `nombre` (2–100). Opcionales: `descripcion` (≤250), `categoria` (≤100).

Devuelve `201`:

```json
{
  "ok": true,
  "data": {
    "grupo": {
      "id_grupo": 17,
      "nombre": "Compras del mes",
      "descripcion": "Grupo familiar",
      "categoria": "hogar",
      "tipo": "grupal",
      "fecha_creacion": "2026-10-10 17:53:02"
    }
  }
}
```

### GET /grupos/:idGrupo 🔒

Params: `:idGrupo` (entero, ej. `/grupos/17`). Sin body. Devuelve `200`:

```json
{
  "ok": true,
  "data": {
    "grupo": {
      "id_grupo": 17,
      "nombre": "Compras del mes",
      "descripcion": "Grupo familiar",
      "categoria": "hogar",
      "tipo": "grupal",
      "fecha_creacion": "2026-10-10 17:53:02",
      "rol": "administrador",
      "fecha_ingreso": "2026-10-10 17:53:02"
    }
  }
}
```

Fallo (`/grupos/12` inexistente o ajeno): `404 { "ok": false, "error": "Grupo no encontrado o no perteneces a él" }`.

### GET /grupos/:idGrupo/miembros 🔒

Params: `:idGrupo` (ej. `/grupos/17/miembros`). Devuelve `200`:

```json
{
  "ok": true,
  "data": {
    "miembros": [
      {
        "id_usuario": 4,
        "nombre": "Test",
        "email": "test@canasta.local",
        "rol": "administrador",
        "fecha_ingreso": "2026-10-10 17:53:02"
      }
    ]
  }
}
```

Fallo (`/grupos/12/miembros`): `404 { "ok": false, "error": "Grupo no encontrado o no perteneces a él" }`.

### PUT /grupos/:idGrupo 🔒

Recibe body parcial (solo admin, nunca personal), ejemplo:

```json
{ "nombre": "Compras del mes (editado)", "descripcion": "Nueva descripcion" }
```

- Opcionales: `nombre` (2–100), `descripcion` (≤250), `categoria` (≤100).

Devuelve `200`:

```json
{
  "ok": true,
  "data": {
    "grupo": {
      "id_grupo": 17,
      "nombre": "Compras del mes (editado)",
      "descripcion": "Nueva descripcion",
      "categoria": "hogar",
      "tipo": "grupal",
      "fecha_creacion": "2026-10-10 17:53:02"
    }
  }
}
```

Fallos: `404` grupo ajeno/inexistente (`/grupos/7`); `403 { "ok": false, "error": "El grupo personal no puede modificarse" }`; `403 { "ok": false, "error": "Solo el administrador puede editar el grupo" }`.

### DELETE /grupos/:idGrupo 🔒

Sin body (ej. `DELETE /grupos/17`). Devuelve `200`:

```json
{
  "ok": true,
  "data": {
    "eliminado": true
  }
}
```

Fallos: `404` (arriba); `403 { "ok": false, "error": "El grupo personal no puede eliminarse" }`; `403 { "ok": false, "error": "Solo el administrador puede eliminar el grupo" }`.

### DELETE /grupos/:idGrupo/miembros/yo 🔒

Params: `:idGrupo` (ej. `/grupos/20/miembros/yo`). Sin body (abandona quien llama).

- Requerido: pertenecer al grupo grupal.

Devuelve `200` (caso miembro que sale):

```json
{ "ok": true, "data": { "salido": true } }
```

Fallos en todos los casos:

```json
{ "ok": false, "error": "Grupo no encontrado o no perteneces a él" }  // 404 no miembro/inexistente
{ "ok": false, "error": "No se puede abandonar el grupo personal" }   // 403 personal
{ "ok": false, "error": "Sos el último administrador del grupo" }     // 409 único admin (la vía es DELETE del grupo)
```

### DELETE /grupos/:idGrupo/miembros/:idUsuario 🔒

Params: `:idGrupo` e `:idUsuario` (ej. `/grupos/20/miembros/1`). Sin body (solo admin expulsa a otro).

- Requerido: ser admin del grupo grupal; el objetivo debe ser miembro y distinto de uno mismo.

Devuelve `200` (caso expulsión real):

```json
{ "ok": true, "data": { "eliminado": true } }
```

Fallos en todos los casos:

```json
{ "ok": false, "error": "Grupo no encontrado o no perteneces a él" }  // 404 no miembro/inexistente
{ "ok": false, "error": "No se puede expulsar del grupo personal" }   // 403 personal
{ "ok": false, "error": "Solo el administrador puede expulsar miembros" }  // 403 miembro común
{ "ok": false, "error": "No podés expulsarte del grupo" }              // 400 a sí mismo
{ "ok": false, "error": "El usuario no es miembro del grupo" }         // 404 objetivo no miembro
```
## Listas (`activa|completada|archivada`)

### GET /grupos/:idGrupo/listas 🔒

Params: `:idGrupo`. Sin body. Devuelve `200`:

```json
{ "ok": true, "data": { "listas": [{ "id_lista": 1, "id_grupo": 4, "id_usuario_creador": 1, "id_usuario_administrador": null, "nombre": "Super", "descripcion": null, "estado": "activa", "fecha_creacion": "2026-10-08 21:45:59", "fecha_actualizacion": "2026-10-08 21:45:59" }] } }
```

Fallo: `403 { "ok": false, "error": "No perteneces a este grupo" }`.

### POST /grupos/:idGrupo/listas 🔒

Recibe body, ejemplo:

```json
{ "nombre": "Super del finde", "descripcion": "Lista semanal" }
```

- Requerido: `nombre` (2–100). Opcional: `descripcion` (≤250).

Devuelve `201 { ok:true, data:{ lista:{ "id_lista": 2, "id_grupo": 4, "id_usuario_creador": 1, "id_usuario_administrador": null, "nombre": "Super del finde", "descripcion": "Lista semanal", "estado": "activa", "fecha_creacion": "2026-10-10 18:00:00", "fecha_actualizacion": "2026-10-10 18:00:00" } } }`.

### GET /listas/:idLista 🔒

Params: `:idLista`. Devuelve `200 { ok:true, data:{ lista:{...} } }` (misma forma).
Fallos: `404 { "ok": false, "error": "Lista no encontrada" }`; `403 { "ok": false, "error": "No perteneces al grupo de esta lista" }`.

### PUT /listas/:idLista 🔒

Recibe body parcial (creador o admin), ejemplo:

```json
{ "nombre": "Super del finde (editada)", "descripcion": "Nueva descripcion", "estado": "activa" }
```

- Opcionales: `nombre` (2–100), `descripcion` (≤250), `estado` (`activa|completada|archivada`).

Devuelve `200 { ok:true, data:{ lista:{...} } }` (con `fecha_actualizacion` renovada).
Fallo: `403 { "ok": false, "error": "No tienes permisos para editar esta lista" }`.

### PATCH /listas/:idLista/estado 🔒

Recibe body, ejemplo: `{ "estado": "completada" }`.

- Requerido: `estado` (`activa|completada|archivada`).

Devuelve `200 { ok:true, data:{ lista:{...} } }`.
Fallo: `403 { "ok": false, "error": "No tienes permisos para cambiar el estado" }`.

### GET /listas/:idLista/total-estimado 🔒

Params: `:idLista`. Devuelve `200`:

```json
{ "ok": true, "data": { "total": { "total_estimado_centavos": 1600, "total_estimado_pesos": 16, "cantidad_items_con_precio": 1, "cantidad_items_total": 1 } } }
```

### DELETE /listas/:idLista 🔒

Sin body. Devuelve `200 { "ok": true, "data": { "eliminado": true } }` (productos por CASCADE).
Fallo: `403 { "ok": false, "error": "No tienes permisos para eliminar esta lista" }`.

## Productos (`prioritario|esencial|secundario`, `pendiente|comprado|omitido`)

### GET /listas/:idLista/productos 🔒

Params: `:idLista`. Devuelve `200` (por prioridad y fecha):

```json
{ "ok": true, "data": { "productos": [{ "id_producto_lista": 1, "id_lista": 1, "id_usuario_creador": 1, "nombre": "Leche", "descripcion": null, "prioridad": "secundario", "cantidad": 2, "precio_estimado_unitario": 800, "codigo_producto": null, "estado": "pendiente", "fecha_creacion": "2026-10-09 00:46:11" }] } }
```

### POST /listas/:idLista/productos 🔒

Recibe body, ejemplo:

```json
{ "nombre": "Leche", "descripcion": "Entera 1L", "prioridad": "esencial", "cantidad": 2, "precio_estimado_unitario": 800, "codigo_producto": "779000100", "estado": "pendiente" }
```

- Requeridos: `nombre` (2–150), `cantidad` (número > 0).
- Opcionales: `descripcion` (≤250), `prioridad` (default `secundario`), `precio_estimado_unitario` (int ≥ 0 o `null`), `codigo_producto` (≤50), `estado` (default `pendiente`).

Devuelve `201 { ok:true, data:{ producto:{...} } }`.

### GET /productos-lista/:idProductoLista 🔒

Params: `:idProductoLista`. Devuelve `200 { ok:true, data:{ producto:{...} } }` (misma forma).
Fallo: `404 { "ok": false, "error": "Producto no encontrado" }`.

### PUT /productos-lista/:idProductoLista 🔒

Recibe body parcial (cualquier miembro), ejemplo: `{ "nombre": "Leche (editada)", "cantidad": 3, "precio_estimado_unitario": 850, "prioridad": "prioritario" }`.
Devuelve `200 { ok:true, data:{ producto:{...} } }`.

### PATCH /productos-lista/:idProductoLista/estado 🔒

Recibe body, ejemplo: `{ "estado": "comprado" }`.

- Requerido: `estado` (`pendiente|comprado|omitido`).

Devuelve `200 { ok:true, data:{ producto:{...} } }`.

### DELETE /productos-lista/:idProductoLista 🔒

Sin body. Devuelve `200 { "ok": true, "data": { "eliminado": true } }`.
Fallo: `403 { "ok": false, "error": "No tienes permisos para eliminar este producto" }` (solo creador del item, de la lista o admin).

## Movimientos (`ingreso|gasto`)

### GET /grupos/:idGrupo/movimientos 🔒

Params: `:idGrupo`. Query opcional: `?tipo=ingreso` (ej. `/grupos/2/movimientos?tipo=ingreso`). Devuelve `200` (recientes primero):

```json
{ "ok": true, "data": { "movimientos": [{ "id_movimiento": 1, "id_usuario_creador": 2, "id_grupo": 2, "nombre": "Sueldo", "monto": 150000, "descripcion": null, "tipo": "ingreso", "foto_url": null, "fecha_movimiento": "2026-10-09", "fecha_creacion": "2026-10-09 20:21:23" }] } }
```

### POST /grupos/:idGrupo/movimientos 🔒

Recibe body, ejemplo:

```json
{ "nombre": "Sueldo", "monto": 150000, "descripcion": "Sueldo del mes", "tipo": "ingreso", "fecha_movimiento": "2026-10-09" }
```

- Requeridos: `nombre` (2–100), `monto` (int ≥ 0, centavos), `tipo` (`ingreso|gasto`), `fecha_movimiento` (`YYYY-MM-DD[ HH:MM:SS]`).
- Opcionales: `descripcion` (≤250), `foto_url` (≤500).

Devuelve `201 { ok:true, data:{ movimiento:{...} } }`.

### GET /grupos/:idGrupo/movimientos/resumen 🔒

Params: `:idGrupo`. Devuelve `200`:

```json
{ "ok": true, "data": { "resumen": { "total_ingresos_centavos": 150000, "total_ingresos_pesos": 1500, "total_gastos_centavos": 20000, "total_gastos_pesos": 200, "balance_centavos": 130000, "balance_pesos": 1300, "cantidad_movimientos": 2 } } }
```

### GET /movimientos/:idMovimiento 🔒

Params: `:idMovimiento`. Devuelve `200 { ok:true, data:{ movimiento:{...} } }` (misma forma).
Fallo: `404 { "ok": false, "error": "Movimiento no encontrado" }`.

### PUT /movimientos/:idMovimiento 🔒

Recibe body parcial (creador o admin), ejemplo: `{ "nombre": "Sueldo (editado)", "monto": 160000 }`.

- Opcionales: `nombre`, `monto`, `descripcion`, `tipo`, `foto_url`, `fecha_movimiento` (mismas reglas).

Devuelve `200 { ok:true, data:{ movimiento:{...} } }`.
Fallo: `403 { "ok": false, "error": "No tienes permisos para editar este movimiento" }`.

### DELETE /movimientos/:idMovimiento 🔒

Sin body. Devuelve `200 { "ok": true, "data": { "eliminado": true } }`.
Fallo: `403 { "ok": false, "error": "No tienes permisos para eliminar este movimiento" }`.
## Ofertas (filtros `?vigentes=true&localidad=X&provincia=Y`)

### GET /productos-lista/:idProductoLista/ofertas 🔒

Params: `:idProductoLista`. Query opcionales: `?vigentes=true`, `?localidad=Cordoba`, `?provincia=Cordoba` (ej. `/productos-lista/1/ofertas?vigentes=true&localidad=Cordoba`). Devuelve `200`:

```json
{ "ok": true, "data": { "ofertas": [{ "id_oferta": 1, "id_producto_lista": 1, "nombre_comercio": "Super Ahorro", "ubicacion": null, "localidad": "Cordoba", "provincia": null, "latitud": null, "longitud": null, "fecha_inicio": "2026-10-01", "fecha_fin": "2026-12-31", "porcentaje_descuento": 20, "precio_original": null, "precio_oferta": 640, "descripcion": null, "fecha_creacion": "2026-10-09 22:39:23" }] } }
```

### POST /productos-lista/:idProductoLista/ofertas 🔒

Recibe body, ejemplo:

```json
{ "nombre_comercio": "Super Ahorro", "ubicacion": "Av. Colon 1200", "localidad": "Cordoba", "provincia": "Cordoba", "latitud": -31.4167, "longitud": -64.1833, "fecha_inicio": "2026-10-01", "fecha_fin": "2026-12-31", "porcentaje_descuento": 20, "precio_original": 800, "precio_oferta": 640, "descripcion": "20% en lacteos" }
```

- Requeridos: `nombre_comercio` (2–100), `fecha_inicio`, `fecha_fin` (con `fin > inicio`).
- Opcionales: `ubicacion` (≤200), `localidad`/`provincia` (≤100), `latitud` (−90..90), `longitud` (−180..180), `porcentaje_descuento` (0–100), `precio_original`/`precio_oferta` (int ≥ 0), `descripcion` (≤250).

Devuelve `201 { ok:true, data:{ oferta:{...} } }`.
Fallo fechas: `400 { "ok": false, "error": "Datos inválidos", "detalles": [{ "path": ["fecha_fin"], "message": "La fecha de fin debe ser posterior a la de inicio" }] }`.

### GET /listas/:idLista/ofertas 🔒

Params: `:idLista`. Mismos filtros y forma que el anterior (todas las ofertas de la lista, para comparar precios).

### GET /ofertas/:idOferta 🔒

Params: `:idOferta`. Devuelve `200 { ok:true, data:{ oferta:{...} } }` (misma forma).
Fallo: `404 { "ok": false, "error": "Oferta no encontrada" }`.

### PUT /ofertas/:idOferta 🔒

Recibe body parcial (cualquier miembro; valida `fin > inicio` contra la fila), ejemplo: `{ "porcentaje_descuento": 25, "precio_oferta": 600 }`.
Devuelve `200 { ok:true, data:{ oferta:{...} } }`.
Fallo fechas: `400 { "ok": false, "error": "La fecha de fin debe ser posterior a la de inicio" }`.

### DELETE /ofertas/:idOferta 🔒

Sin body. Devuelve `200 { "ok": true, "data": { "eliminado": true } }`.
Fallo: `403 { "ok": false, "error": "Solo el administrador puede eliminar ofertas" }`.

## Invitaciones (`pendiente|aceptada|rechazada`)

### GET /grupos/:idGrupo/invitaciones 🔒

Params: `:idGrupo` (solo grupales con miembros). Devuelve `200`:

```json
{ "ok": true, "data": { "invitaciones": [{ "id_invitacion": 1, "id_grupo": 11, "id_usuario_origen": 2, "nombre_origen": "Ana", "id_usuario_destino": 1, "email_destino": "santiago@test.com", "nombre_destino": "Santiago", "estado": "pendiente", "fecha_creacion": "2026-10-09 22:52:23", "fecha_respuesta": null }] } }
```

### POST /grupos/:idGrupo/invitaciones 🔒

Recibe body (solo admin, nunca personal), ejemplo:

```json
{ "email_destino": "santiago@test.com" }
```

- Requerido: `email_destino` (email válido de un usuario existente).

Devuelve `201 { ok:true, data:{ invitacion:{...} } }` (estado `pendiente`).
Fallos: `403 { "ok": false, "error": "Solo el administrador puede invitar" }`; `403 { "ok": false, "error": "No se puede invitar al grupo personal" }`; `404 { "ok": false, "error": "No existe un usuario con ese email" }`; `409 { "ok": false, "error": "El usuario ya es miembro del grupo" }`; `409 { "ok": false, "error": "Ya hay una invitación pendiente para ese usuario" }`.

### GET /invitaciones/recibidas 🔒

Sin body (mis pendientes como destino). Devuelve `200 { ok:true, data:{ invitaciones:[...] } }` (misma forma).

### PATCH /invitaciones/:idInvitacion/responder 🔒

Recibe body (solo destino), ejemplo:

```json
{ "estado": "aceptada" }
```

- Requerido: `estado` (`aceptada|rechazada`; aceptada suma como miembro).

Devuelve `200 { ok:true, data:{ invitacion:{..., "estado": "aceptada", "fecha_respuesta": "2026-10-09 22:52:25"} } }`.
Fallos: `403 { "ok": false, "error": "Solo el destinatario puede responder" }`; `409 { "ok": false, "error": "La invitación ya fue respondida" }`.

### DELETE /invitaciones/:idInvitacion 🔒

Sin body (origen o admin, solo pendientes). Devuelve `200 { "ok": true, "data": { "eliminado": true } }`.
Fallo: `409 { "ok": false, "error": "Solo se pueden cancelar invitaciones pendientes" }`.

## Notificaciones (tablón, sin PUT)

### GET /grupos/:idGrupo/notificaciones 🔒

Params: `:idGrupo`. Devuelve `200`:

```json
{ "ok": true, "data": { "notificaciones": [{ "id_notificacion": 1, "id_grupo": 11, "tipo": "general", "titulo": "Bienvenidos", "descripcion": "Grupo de prueba", "fecha_creacion": "2026-10-09 22:52:28" }] } }
```

### POST /grupos/:idGrupo/notificaciones 🔒

Recibe body (solo admin), ejemplo:

```json
{ "tipo": "general", "titulo": "Reunión de compras", "descripcion": "Sábado a la mañana" }
```

- Requeridos: `tipo` (2–50, libre: `grupo|lista|movimiento|oferta|invitacion|general`), `titulo` (2–100). Opcional: `descripcion` (≤250).

Devuelve `201 { ok:true, data:{ notificacion:{...} } }`.
Fallo: `403 { "ok": false, "error": "Solo el administrador puede gestionar anuncios" }`.

### GET /notificaciones/:idNotificacion 🔒

Params: `:idNotificacion`. Devuelve `200 { ok:true, data:{ notificacion:{...} } }` (misma forma).
Fallo: `404 { "ok": false, "error": "Notificación no encontrada" }`.

### DELETE /notificaciones/:idNotificacion 🔒

Sin body (solo admin). Devuelve `200 { "ok": true, "data": { "eliminado": true } }`.

## Raíz y logs

### GET / 🔓

Sin body. `200 text/html`: home con índice, buscador, endpoints y reglas.

### GET /logs 🔒

Query opcional `?limite=` (1–200, default 50; ej. `/logs?limite=10`). Devuelve `200`:

```json
{ "ok": true, "data": { "logs": [{ "fecha": "2026-10-10 13:51:46", "metodo": "GET", "ruta": "/logs", "status": 401, "ms": 1, "idUsuario": null }], "total": 6 } }
```

## Errores globales

```json
{ "ok": false, "error": "Datos inválidos", "detalles": [{ "path": ["monto"], "message": "El monto no puede ser negativo" }] }  // 400
{ "ok": false, "error": "No autorizado" }              // 401 sin sesión
{ "ok": false, "error": "Token inválido o expirado" }  // 401 token malo
{ "ok": false, "error": "Ruta no encontrada" }         // 404 ruta inexistente
{ "ok": false, "error": "Error interno del servidor" } // 500
```
