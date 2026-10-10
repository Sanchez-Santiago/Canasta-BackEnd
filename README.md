# 🧺 Canasta+ BackEnd

![Bun](https://img.shields.io/badge/Bun-000000?logo=bun)
![Express](https://img.shields.io/badge/Express-000000?logo=express)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67AF)
![Turso](https://img.shields.io/badge/Turso-4FF8D2?logo=turso&logoColor=black)
![Bruno](https://img.shields.io/badge/Bruno-F0858C?logo=bruno&logoColor=white)

Backend de **Canasta+**: gestión y planificación de finanzas y compras personales o grupales.
Usuarios con grupo personal automático, grupos grupales con roles, listas con costo
estimado, productos con prioridad y precio, movimientos con balance, ofertas con filtros,
invitaciones por email y tablón de anuncios.

## Índice

- [Inicio rápido](#inicio-rápido)
- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Reglas del repo](#reglas-del-repo)
- [Autenticación](#autenticación)
- [Endpoints](#endpoints)
- [Lógica por módulo](#lógica-por-módulo)
- [Probar con Bruno](#probar-con-bruno)
- [Base de datos](#base-de-datos)
- [Respuestas y errores](#respuestas-y-errores)
- [Problemas comunes](#problemas-comunes)
- [Fuera de alcance (v1)](#fuera-de-alcance-v1)

## Inicio rápido

```bash
cd Canasta-BackEnd
bun install
cp .env.example .env   # completar TURSO_* + JWT_SECRET
bun run dev            # watch en http://localhost:3000
```

Abrir **`http://localhost:3000/`**: página HTML con la descripción, el índice de
endpoints con buscador y las reglas clave. Arranque esperado:

```
✅ Conexión a la base de datos establecida correctamente
📌 URL de la base de datos: libsql://...
🚀 Canasta+ backend escuchando en 0.0.0.0:3000
🏠 Home HTML en: http://localhost:3000/
```

## Tecnologías

| Tecnología | Uso |
|---|---|
| `Bun` | Runtime, instalación y dev (`bun --watch index.ts`) |
| `Express 4` | Servidor HTTP y routers |
| `TypeScript` | Tipado (tipos inferidos desde Zod con `z.infer`) |
| `Zod` | Validación de body/query/params + tipos |
| `@libsql/client` | Cliente SQLite/Turso (`libsql://` remoto o `file:` local) |
| `Turso` | SQLite remoto (ver `TURSO_DATABASE_URL`) |
| `bcryptjs` | Hash de `contrasena` (nunca en plano ni en respuestas) |
| `jsonwebtoken` | JWT firmado (`{ idUsuario }`) |
| `cookie-parser` | Cookie `auth_token` (`httpOnly`, `SameSite=Lax`) |
| `dotenv` | Carga `.env` (validado con Zod en `config/env.ts`) |
| `Bruno (OpenCollection YAML)` | Colección de pruebas en `Consulta Api/Canasta+` |

## Arquitectura

Variación de MCS pedida por el proyecto:

```
Route  ->  Controller  ->  Service  ->  Model  ->  SQLite (Turso)
```

| Capa | Hace | No hace |
|---|---|---|
| `*.router.ts` | Endpoints + `validate` (Zod), delega al controller | SQL, negocio |
| `*.controller.ts` | Lee `req`, llama al service, responde (`ok`/`creado`) | SQL |
| `*.service.ts` | Reglas y permisos (roles, pertenencia, totales) | SQL, HTTP |
| `*.model.ts` | Queries parametrizadas (`@param`) vía `shared/db.helpers` | Negocio |
| `SQLite` | 9 tablas + índices (`Database/Database.sql`) | — |

Transversales en `shared/`: `auth` (JWT global), `validate`, `asyncHandler`,
`error`, `jwt/cookies/password/dates/http` y `home*` (página raíz).

Flujo de invitación (único multi-paso):

```
admin POST /grupos/:id/invitaciones {email} → pendiente
destino GET /invitaciones/recibidas → PATCH .../responder {aceptada}
→ alta en usuario_grupo como miembro + fecha_respuesta
```

## Reglas del repo

- Ningún `.ts` supera las **400 líneas** (la home se parte en `home-datos/estilos/home`).
- Función repetida → se modulariza (`lista.calculos`, `movimiento.finanzas`, `filasAfectadas`).
- Dominio en **español** como la DB; dinero en **centavos** (`INTEGER >= 0`); fechas **TEXT ISO**.
- Código comentado en español: encabezado por archivo + JSDoc breve por función.
- Sin `git` sin permiso; sin cambios de esquema sin permiso.

```
Canasta-BackEnd/
  index.ts                 # App + GET / + routers + boot con check DB
  config/                  # env (Zod) + database (libSQL + FK ON)
  shared/                  # db.helpers, middlewares, utils, home*
  modules/
    user/ grupo/ lista/ productoLista/
    movimiento/ oferta/ invitacion/ notificacion/
  Database/Database.sql    # Esquema real (9 tablas + índices)
  Consulta Api/Canasta+/   # Colección Bruno (ver abajo)
```

## Autenticación

- **Públicas**: `GET /`, `POST /auth/registrar`, `POST /auth/register`, `POST /auth/login`.
- Sesión por **cookie `auth_token` o header `Authorization: Bearer <jwt>`** (cookie primero; `authMiddleware` → `req.user`).
- Registro y login responden `{ ok:true, data:{ usuario, token } }` **y** setean la cookie: web usa la cookie, apps guardan el `token` (Android: `EncryptedSharedPreferences`/Keystore; web: preferir memoria).
- Registro crea el usuario **y su grupo personal** (admin) y setea la cookie.
- Login distingue la causa: email inexistente → `404 No existe un usuario con ese email`; clave mal → `401 Contraseña incorrecta`.
- Registro con clave débil → `400 Contraseña demasiado débil + recomendaciones[]` (mín 8, letra+número, suma mayúsculas/símbolos/largo; rechaza comunes como `123456`).
- Logout limpia la cookie. Email en minúsculas/trim, `contrasena >= 8` solo al registrar.

## Endpoints

Base `http://localhost:3000` → `{ ok:true, data }` o `{ ok:false, error }`.

### Raíz y Auth

| Método | Ruta | Auth | Qué hace |
|---|---|---|---|
| GET | `/` | pública | HTML con índice, buscador, endpoints y reglas |
| GET | `/logs` | protegida | Historial de las últimas 200 solicitudes (`?limite=`) |
| POST | `/auth/registrar` | pública | Alta + grupo personal + cookie (alias `/auth/register`) |
| POST | `/auth/login` | pública | Valida y setea cookie |
| GET | `/auth/yo` | protegida | Usuario de la sesión |
| POST | `/auth/logout` | protegida | Limpia la cookie |

### Grupos — 1 personal + N grupales

Roles: `administrador | miembro`. El personal **no se edita ni elimina**.

| Método | Ruta | Auth | Qué hace |
|---|---|---|---|
| GET | `/grupos` | protegida | Míos con `rol` y `fecha_ingreso` |
| POST | `/grupos/grupal` | protegida | Crea grupal (creador = admin) |
| GET | `/grupos/:idGrupo` | protegida | Detalle + mi rol (solo miembro) |
| GET | `/grupos/:idGrupo/miembros` | protegida | Miembros con rol (admins primero) |
| PUT / DELETE | `/grupos/:idGrupo` | protegida | Solo admin; personal → 403 |

### Listas — `activa | completada | archivada`

| Método | Ruta | Auth | Qué hace |
|---|---|---|---|
| GET / POST | `/grupos/:idGrupo/listas` | protegida | Listar / crear (cualquier miembro) |
| GET / PUT / DELETE | `/listas/:idLista` | protegida | Ver / editar / borrar (creador o admin) |
| PATCH | `/listas/:idLista/estado` | protegida | Cambia estado (creador o admin) |
| GET | `/listas/:idLista/total-estimado` | protegida | `SUM(cantidad × precio)` en centavos y pesos |

### Productos — `prioritario | esencial | secundario`, `pendiente | comprado | omitido`

| Método | Ruta | Auth | Qué hace |
|---|---|---|---|
| GET / POST | `/listas/:idLista/productos` | protegida | Listar (por prioridad) / crear (miembro) |
| GET / PUT / PATCH / DELETE | `/productos-lista/:idProductoLista…` | protegida | Ver, editar y cambiar estado: **miembro**; borrar: **creador/admin** |

### Movimientos — `ingreso | gasto`

| Método | Ruta | Auth | Qué hace |
|---|---|---|---|
| GET / POST | `/grupos/:idGrupo/movimientos` | protegida | Listar (`?tipo=`) / crear (miembro) |
| GET | `/grupos/:idGrupo/movimientos/resumen` | protegida | Ingresos, gastos, balance + cantidad |
| GET / PUT / DELETE | `/movimientos/:idMovimiento` | protegida | Ver (miembro); editar/borrar (creador o admin) |

### Ofertas — filtros `?vigentes=true&localidad=X&provincia=Y`

| Método | Ruta | Auth | Qué hace |
|---|---|---|---|
| GET / POST | `/productos-lista/:idProductoLista/ofertas` | protegida | Listar con filtros / crear (miembro) |
| GET | `/listas/:idLista/ofertas` | protegida | Todas las de la lista (comparar precios) |
| GET / PUT / DELETE | `/ofertas/:idOferta…` | protegida | Ver y editar: **miembro**; borrar: **solo admin** |

### Invitaciones y Notificaciones

| Método | Ruta | Auth | Qué hace |
|---|---|---|---|
| GET / POST | `/grupos/:idGrupo/invitaciones` | protegida | Listar (miembro) / invitar por email (admin) |
| GET | `/invitaciones/recibidas` | protegida | Mis pendientes como destino |
| PATCH / DELETE | `/invitaciones/:idInvitacion…` | protegida | Responder (destino) / cancelar (origen o admin) |
| GET / POST | `/grupos/:idGrupo/notificaciones` | protegida | Leer (miembro) / publicar (admin, sin PUT) |
| GET / DELETE | `/notificaciones/:idNotificacion…` | protegida | Ver (miembro) / borrar (admin) |

## Lógica por módulo

- **user**: email único, hash, grupo personal, JWT; jamás expone `contrasena`.
- **grupo**: pertenencia vía `obtenerGrupoConRol`; personal bloqueado; miembros por rol/nombre.
- **lista**: `obtenerPermisosSobreLista`; crear/leer miembros, resto creador/admin.
- **productoLista**: contexto `producto→lista→grupo`; editar miembros, borrar creadores/admin.
- **lista.calculos**: `round(precio×cantidad)` solo con precio, centavos→pesos.
- **movimiento**: `GROUP BY tipo` + `construirResumen` (balance); editar/borrar creador/admin.
- **oferta**: contexto reutilizado del item; borrar solo admin; parcial valida `fin > inicio`.
- **invitacion**: email→id, anti-duplicada; aceptada inserta miembro **antes** de marcar.
- **notificacion**: tablón por grupo, sin update.

## Probar con Bruno

Abrir `Consulta Api/Canasta+` en Bruno (formato OpenCollection YAML):

```
Auth/ Grupos/ Listas/ Productos/ Movimientos/ Ofertas/ Invitaciones/ Notificaciones/
environments/Local.yml  # baseUrl + ids (idGrupo, idLista, idProductoLista, idMovimiento, idOferta, idInvitacion)
```

1. `Auth / Registrar` (o `Login`): la cookie viaja sola.
2. `Grupos / MisGrupos` → `Listas` → `Productos` → `total-estimado`.
3. `Movimientos`, `Ofertas`, `Invitaciones`, `Notificaciones` en orden.
4. Cada `.yml` trae `docs` y las URLs usan `http://localhost:3000` literal.

## Base de datos

- SQLite vía Turso, `PRAGMA foreign_keys = ON`, queries parametrizadas.
- Esquema: `Database/Database.sql` (9 tablas + índices). **Todo implementado**: las 9 tablas tienen endpoints.
- Con `TURSO_DATABASE_URL=file:...` a archivo inexistente, libSQL lo crea vacío: aplicar `Database.sql` a mano.

## Respuestas y errores

| Caso | Respuesta |
|---|---|
| OK | `{ ok:true, data }` (201 en altas) |
| Validación | `400 Datos inválidos + detalles[{path,message}]` |
| Sin sesión | `401 No autorizado` / `Token inválido o expirado` |
| Sin permiso | `403` (personal, no miembro/admin/creador) |
| Duplicado | `409` (email, invitación, doble respuesta) |
| No existe | `404` (o `Ruta no encontrada`) |

## Problemas comunes

- **Puerto en uso** (`EADDRINUSE`): hay otra instancia; matarla o usar `PORT=3030`.
- **401 en todo**: falta login previo o cayó la cookie (re-loguear).
- **`file:` vacío**: crear tablas con `Database.sql` antes de probar.
- **Bruno no guarda sesión**: revisar que el environment sea `Local`.

## Fuera de alcance (v1)

Pagos in-app, integración bancaria, compra directa, stock de comercios,
comercios como usuarios, facturación electrónica, contabilidad profesional
e integraciones obligatorias con supermercados.
