# Canasta+ BackEnd

Backend de **Canasta+**: gestion y planificacion de finanzas y compras personales o grupales.
Permite registrar usuarios, crear grupos (1 personal + N grupales), armar listas de compras,
agregar productos con cantidad / prioridad / precio estimado, calcular el costo estimado
de cada lista y manejar permisos por rol.

> Alcance actual: usuarios, grupos + miembros, listas y productos de lista.
> Pendiente (segun alcance del proyecto): movimientos, ofertas, invitaciones, notificaciones.

## Tecnologias

| Tecnologia | Uso |
|---|---|
| `Bun` | Runtime + instalacion + dev (`bun --watch index.ts`) |
| `Express 4` | Servidor HTTP y routers |
| `TypeScript` | Tipado (tipos inferidos desde Zod) |
| `Zod` | Schemas de validacion (body / params) + `z.infer` para tipos |
| `@libsql/client` | Cliente SQLite / Turso (remoto `libsql://` o local `file:`) |
| `Turso` | SQLite remoto (ver `TURSO_DATABASE_URL`) |
| `bcryptjs` | Hash de `contrasena` (nunca se guarda ni devuelve en plano) |
| `jsonwebtoken` | JWT firmado (`{ idUsuario }`) |
| `cookie-parser` | Leer cookie `auth_token` / setearla `httpOnly` |
| `dotenv` | Carga `.env` (validado con Zod en `config/env.ts`) |
| `Bruno (OpenCollection YAML)` | Coleccion de pruebas en `Consulta Api/Canasta+` |

## Arquitectura

Variacion de MCS pedida por el proyecto:

```
Route  ->  Controller  ->  Service  ->  Model  ->  SQLite (Turso)
```

| Capa | Responsabilidad | No hace |
|---|---|---|
| `routes/*.router.ts` | Define endpoints, aplica `validate` (Zod) y delega al controller | SQL ni logica de negocio |
| `controllers/*.controller.ts` | Lee `req.body/params`, llama al service, responde HTTP (`ok`/`creado`) | SQL |
| `services/*.service.ts` | Reglas de negocio y permisos (roles, pertenencia, totales) | SQL directo ni HTTP |
| `models/*.model.ts` | Queries parametrizadas (`@param`) via `shared/db.helpers` | Logica de negocio |
| `SQLite` | Tablas `usuario`, `grupo`, `usuario_grupo`, `lista`, `producto_lista`, ... | — |

Capas transversales en `shared/`:

- `middlewares/auth.ts` — JWT en cookie para **todas** las rutas menos `POST /auth/registrar`, `POST /auth/register`, `POST /auth/login` y `GET /`.
- `middlewares/validate.ts` — valida `body/params/query` con Zod, devuelve 400 con detalles.
- `middlewares/asyncHandler.ts` — evita `try/catch` repetido.
- `middlewares/error.ts` — maneja `ZodError` y errores con `status`.
- `utils/jwt.ts`, `utils/cookies.ts`, `utils/password.ts`, `utils/dates.ts`, `utils/http.ts`.
- `home.ts` — genera el HTML de `GET /`.
- `db.helpers.ts` — `run / getOne / getAll` async sobre libSQL.

Reglas del repo:

- Ningun archivo de codigo supera las **400 lineas**. Si una funcion se repite, se modulariza (ej. `lista/lista.calculos.ts`).
- Nombres de dominio en **espanol**, igual que la DB (`usuario`, `grupo`, `lista`, ...).
- Dinero en **centavos** (`INTEGER >= 0`), fechas en **TEXT ISO** (`YYYY-MM-DD HH:MM:SS`).

```
Canasta-BackEnd/
  index.ts                 # App + GET / (HTML) + montaje de routers + boot con check DB
  config/
    env.ts                 # Validacion Zod de PORT, NODE_ENV, JWT_*, TURSO_*
    database.ts            # createClient libSQL + PRAGMA foreign_keys = ON
  shared/
    db.helpers.ts
    home.ts                # HTML de la raiz + tabla de endpoints
    middlewares/           # auth, validate, asyncHandler, error
    utils/                 # jwt, cookies, password, dates, http
  modules/
    user/                  # Auth: scheme, model, service, controller, router
    grupo/                 # Grupos + miembros
    lista/                 # Listas + lista.calculos.ts
    productoLista/         # Items de lista
  Database/
    Database.sql           # Esquema real (9 tablas + indices)
    Database.db            # Archivo local (opcional, ver TURSO_DATABASE_URL)
  Consulta Api/Canasta+/   # Coleccion Bruno OpenCollection YAML
```

## Variables de entorno

`.env` (no se sube a git, ver `.env.example`):

```text
PORT=3000
NODE_ENV=development
JWT_SECRET=un_secreto_largo_de_al_menos_10_caracteres
JWT_EXPIRES_IN=7d
TURSO_DATABASE_URL=libsql://tu-db.turso.io
TURSO_AUTH_TOKEN=tu_auth_token
# Alternativa local sin token:
# TURSO_DATABASE_URL=file:./Database/Database.db
```

## Como correr

```bash
cd Canasta-BackEnd
bun install
cp .env.example .env   # y completar TURSO_* + JWT_SECRET
bun run dev            # watch -> bun --watch index.ts
# o
bun index.ts
```

Boot esperado:

```
✅ Conexión a la base de datos establecida correctamente
📌 URL de la base de datos: libsql://...
🚀 Canasta+ backend escuchando en 0.0.0.0:3000
🌍 Entorno: development
🏠 Home HTML en: http://localhost:3000/
🔗 API disponible en: http://localhost:3000/
```

Abrir `http://localhost:3000/` devuelve la **pagina HTML** con la descripcion del sistema,
como probarlo y la tabla completa de endpoints (metodo, ruta, auth y que hace cada uno).

## Autenticacion: JWT + cookies

- Solo son **publicas**: `GET /`, `POST /auth/registrar`, `POST /auth/register`, `POST /auth/login`.
- Todo lo demas pasa por `authMiddleware`: lee cookie `auth_token`, verifica JWT y setea `req.user = { idUsuario }`.
- Sin cookie o con token invalido/expirado: `401 { ok:false, error }`.
- Login/registro responden el usuario **sin** `contrasena` y setean:
  `auth_token=...; HttpOnly; Path=/; SameSite=Lax; Max-Age=7d` (`Secure` solo en prod).
- Logout limpia la cookie. Zod valida email minusculas/trim y `contrasena >= 6`.

## Endpoints

Base: `http://localhost:3000`. Todos devuelven `{ ok:true, data }` o `{ ok:false, error }`.

### Raiz

| Metodo | Ruta | Auth | Que hace |
|---|---|---|---|
| GET | `/` | publica | HTML con descripcion, como probar, tabla de endpoints y reglas clave |

### Auth (`/auth`)

| Metodo | Ruta | Auth | Que hace |
|---|---|---|---|
| POST | `/auth/registrar` | publica | Crea usuario + **grupo personal automatico** (admin). Setea cookie. Alias `/auth/register`. Body: `nombre, email, contrasena` + opcionales `localidad, provincia, pais, domicilio`. |
| POST | `/auth/login` | publica | Valida credenciales y setea cookie. Body: `email, contrasena`. |
| GET | `/auth/yo` | protegida | Devuelve el usuario de la sesion. |
| POST | `/auth/logout` | protegida | Limpia la cookie. |

### Grupos (`/grupos`)

Regla: cada usuario tiene **exactamente 1** grupo `personal` (creado al registrarse, **no se edita ni elimina**). Puede tener **0..N** `grupal`.

| Metodo | Ruta | Auth | Que hace |
|---|---|---|---|
| GET | `/grupos` | protegida | Mis grupos con `rol` y `fecha_ingreso`. |
| POST | `/grupos/grupal` | protegida | Crea grupal (`nombre` obligatorio). Creador = `administrador`. |
| GET | `/grupos/:idGrupo` | protegida | Detalle + mi rol. Solo si pertenezco. |
| GET | `/grupos/:idGrupo/miembros` | protegida | Miembros con `rol` (admins primero). Solo miembros. |
| PUT | `/grupos/:idGrupo` | protegida | Edita grupal. Solo `administrador`. Personal -> 403. |
| DELETE | `/grupos/:idGrupo` | protegida | Elimina grupal. Solo `administrador`. Personal -> 403. |

Roles en `usuario_grupo`: `administrador | miembro`.

### Listas

Pertenecen a un grupo (`id_grupo`). Estados: `activa | completada | archivada`.

| Metodo | Ruta | Auth | Que hace |
|---|---|---|---|
| GET | `/grupos/:idGrupo/listas` | protegida | Listas del grupo (orden `fecha_actualizacion` desc). |
| POST | `/grupos/:idGrupo/listas` | protegida | Crea lista `activa`. Cualquier miembro. Guarda `id_usuario_creador`. |
| GET | `/listas/:idLista` | protegida | Detalle. Solo miembros de su grupo. |
| PUT | `/listas/:idLista` | protegida | Edita nombre/descripcion/estado. Solo creador o admin. Actualiza `fecha_actualizacion`. |
| PATCH | `/listas/:idLista/estado` | protegida | Cambia estado. Solo creador o admin. |
| GET | `/listas/:idLista/total-estimado` | protegida | `SUM(cantidad * precio_estimado_unitario)`. Devuelve centavos + pesos + conteos. |
| DELETE | `/listas/:idLista` | protegida | Elimina (CASCADE productos). Solo creador o admin. |

### Productos de lista

Tabla `producto_lista` (items embebidos, no hay catalogo global). Prioridad: `prioritario | esencial | secundario`. Estado: `pendiente | comprado | omitido`. `cantidad` REAL > 0, precio en centavos o `null`.

| Metodo | Ruta | Auth | Que hace |
|---|---|---|---|
| GET | `/listas/:idLista/productos` | protegida | Items ordenados por prioridad y fecha. |
| POST | `/listas/:idLista/productos` | protegida | Agrega item. Cualquier miembro. `nombre` + `cantidad` obligatorios. |
| GET | `/productos-lista/:idProductoLista` | protegida | Detalle. Solo miembros de su grupo. |
| PUT | `/productos-lista/:idProductoLista` | protegida | **Cualquier miembro puede modificarlo.** |
| PATCH | `/productos-lista/:idProductoLista/estado` | protegida | Cambia estado. Cualquier miembro. |
| DELETE | `/productos-lista/:idProductoLista` | protegida | **Solo** creador del item, creador de la lista o admin del grupo. Miembro comun -> 403. |

## Logica por modulo

- **user**: `registrarUsuario` verifica email unico, hashea, crea usuario, crea grupo personal, firma JWT. `loginUsuario` compara hash. Nunca expone `contrasena`.
- **grupo**: `crearGrupoPersonal` (`Mi grupo (nombre)`, tipo `personal`, miembro admin). `crearGrupoGrupal` igual pero tipo `grupal`. Permisos via `obtenerGrupoConRol` (JOIN `usuario_grupo`). Personal bloqueado en update/delete. Miembros ordenados por rol/nombre.
- **lista**: pertenencia via `obtenerPermisosSobreLista` (lista + rol). Crear/listar exige pertenencia. Editar/cambiar estado/eliminar exige `esCreadorLista || esAdminGrupo`.
- **productoLista**: contexto via JOIN `producto_lista + lista` + `obtenerRolEnGrupo`. Lectura/creacion/modificacion/cambio de estado: basta pertenencia. Eliminacion: `admin || listaCreador == yo || itemCreador == yo`.
- **lista.calculos**: `calcularTotalEstimado(items)` suma `round(precio*cantidad)` solo si precio no es `null`.

## Probar con Bruno

Coleccion OpenCollection YAML en `Consulta Api/Canasta+`. Abrir esa carpeta en Bruno.

```
Consulta Api/Canasta+/
  opencollection.yml
  environments/Local.yml   # baseUrl, idGrupo, idLista, idProductoLista
  Raiz.yml                 # GET /
  Auth/                    # Registrar, Login, Yo, Logout
  Grupos/                  # MisGrupos, CrearGrupal, VerGrupo, Miembros, Actualizar, Eliminar
  Listas/                  # ListarPorGrupo, Crear, Ver, Actualizar, CambiarEstado, Total, Eliminar
  Productos/               # ListarPorLista, Crear, Ver, Actualizar, CambiarEstado, Eliminar
```

Pasos:

1. Environment `Local` (`{{baseUrl}} = http://localhost:3000`).
2. `Auth / Registrar` (o `Login`). Bruno guarda la cookie `auth_token` sola.
3. `Grupos / MisGrupos` para obtener `idGrupo`, setear variable `idGrupo`.
4. Crear lista, setear `idLista`, crear productos, ver `total-estimado`.
5. Cada `.yml` tiene `docs` con metodo, ruta, auth y que hace.

Ejemplo curl equivalente:

```bash
curl -c cookies.txt -X POST http://localhost:3000/auth/registrar \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","email":"test@canasta.local","contrasena":"123456"}'

curl -b cookies.txt http://localhost:3000/grupos
curl -b cookies.txt -X POST http://localhost:3000/grupos/1/listas \
  -H "Content-Type: application/json" -d '{"nombre":"Super"}'
```

## Base de datos

- Motor: SQLite via Turso (`@libsql/client`). `PRAGMA foreign_keys = ON`.
- Esquema: `Database/Database.sql` (9 tablas: `usuario`, `grupo`, `usuario_grupo`, `lista`, `producto_lista`, `movimiento`, `oferta`, `invitacion_grupo`, `notificacion` + indices).
- Implementado hoy: `usuario`, `grupo`, `usuario_grupo`, `lista`, `producto_lista`. El resto del SQL existe pero aun sin endpoints.
- `fileMustExist` no se usa con libSQL: si `TURSO_DATABASE_URL=file:...` apunta a un archivo inexistente lo crea vacio (aplicar `Database.sql` manualmente).

## Respuestas y errores

- OK: `{ ok:true, data:{...} }` (201 en creaciones).
- Error validacion: `400 { ok:false, error:"Datos inválidos", detalles:[{path,message}] }`.
- Sin auth: `401 { ok:false, error:"No autorizado" }` / token malo: `Token inválido o expirado`.
- Sin permiso: `403` (personal bloqueado, no miembro, no admin, no creador).
- No encontrado: `404 { ok:false, error:"..." }` o `Ruta no encontrada`.
