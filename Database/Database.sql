PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

-- =========================================================
-- CANASTA+
-- Base de datos SQLite
-- =========================================================


-- =========================================================
-- 1. USUARIO
-- =========================================================

CREATE TABLE usuario (
    id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,

    nombre TEXT NOT NULL,

    email TEXT NOT NULL UNIQUE,

    contrasena TEXT NOT NULL,

    localidad TEXT,
    provincia TEXT,
    pais TEXT,

    domicilio TEXT,

    fecha_creacion TEXT NOT NULL DEFAULT (datetime('now'))
);


-- =========================================================
-- 2. GRUPO
-- =========================================================

CREATE TABLE grupo (
    id_grupo INTEGER PRIMARY KEY AUTOINCREMENT,

    nombre TEXT NOT NULL,

    descripcion TEXT,

    categoria TEXT,

    tipo TEXT NOT NULL DEFAULT 'personal'
        CHECK (tipo IN ('personal', 'grupal')),

    fecha_creacion TEXT NOT NULL DEFAULT (datetime('now'))
);


-- =========================================================
-- 3. USUARIO_GRUPO
-- Relación N:N entre usuarios y grupos
-- =========================================================

CREATE TABLE usuario_grupo (
    id_usuario_grupo INTEGER PRIMARY KEY AUTOINCREMENT,

    id_usuario INTEGER NOT NULL,

    id_grupo INTEGER NOT NULL,

    rol TEXT NOT NULL DEFAULT 'miembro'
        CHECK (rol IN ('administrador', 'miembro')),

    fecha_ingreso TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE,

    FOREIGN KEY (id_grupo)
        REFERENCES grupo(id_grupo)
        ON DELETE CASCADE,

    UNIQUE (id_usuario, id_grupo)
);


-- =========================================================
-- 4. LISTA
-- =========================================================

CREATE TABLE lista (
    id_lista INTEGER PRIMARY KEY AUTOINCREMENT,

    id_grupo INTEGER NOT NULL,

    id_usuario_creador INTEGER NOT NULL,

    id_usuario_administrador INTEGER,

    nombre TEXT NOT NULL,

    descripcion TEXT,

    estado TEXT NOT NULL DEFAULT 'activa'
        CHECK (estado IN (
            'activa',
            'completada',
            'archivada'
        )),

    fecha_creacion TEXT NOT NULL DEFAULT (datetime('now')),

    fecha_actualizacion TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (id_grupo)
        REFERENCES grupo(id_grupo)
        ON DELETE CASCADE,

    FOREIGN KEY (id_usuario_creador)
        REFERENCES usuario(id_usuario)
        ON DELETE RESTRICT,

    FOREIGN KEY (id_usuario_administrador)
        REFERENCES usuario(id_usuario)
        ON DELETE SET NULL
);


-- =========================================================
-- 5. PRODUCTO_LISTA
-- =========================================================

CREATE TABLE producto_lista (
    id_producto_lista INTEGER PRIMARY KEY AUTOINCREMENT,

    id_lista INTEGER NOT NULL,

    id_usuario_creador INTEGER NOT NULL,

    nombre TEXT NOT NULL,

    descripcion TEXT,

    prioridad TEXT NOT NULL DEFAULT 'secundario'
        CHECK (prioridad IN (
            'prioritario',
            'esencial',
            'secundario'
        )),

    cantidad REAL NOT NULL DEFAULT 1
        CHECK (cantidad > 0),

    precio_estimado_unitario INTEGER
        CHECK (precio_estimado_unitario >= 0),

    codigo_producto TEXT,

    estado TEXT NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN (
            'pendiente',
            'comprado',
            'omitido'
        )),

    -- Presentacion y clasificacion del item
    unidad_medida TEXT NOT NULL DEFAULT 'unidad'
        CHECK (unidad_medida IN (
            'unidad', 'kg', 'gramos', 'L', 'ml', 'docena', 'media_docena',
            'paquete', 'caja', 'botella', 'lata', 'sobre', 'rollo', 'bolsa', 'm'
        )),
    marca TEXT,
    categoria TEXT,

    fecha_creacion TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (id_lista)
        REFERENCES lista(id_lista)
        ON DELETE CASCADE,

    FOREIGN KEY (id_usuario_creador)
        REFERENCES usuario(id_usuario)
        ON DELETE RESTRICT
);


-- =========================================================
-- 6. MOVIMIENTO
-- Ingresos y egresos
-- =========================================================

CREATE TABLE movimiento (
    id_movimiento INTEGER PRIMARY KEY AUTOINCREMENT,

    id_usuario_creador INTEGER NOT NULL,

    id_grupo INTEGER NOT NULL,

    nombre TEXT NOT NULL,

    monto INTEGER NOT NULL
        CHECK (monto >= 0),

    descripcion TEXT,

    tipo TEXT NOT NULL
        CHECK (tipo IN (
            'ingreso',
            'gasto'
        )),

    foto_url TEXT,

    fecha_movimiento TEXT NOT NULL,

    fecha_creacion TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (id_usuario_creador)
        REFERENCES usuario(id_usuario)
        ON DELETE RESTRICT,

    FOREIGN KEY (id_grupo)
        REFERENCES grupo(id_grupo)
        ON DELETE CASCADE
);


-- =========================================================
-- 7. OFERTA (catalogo de ofertas scrapeadas)
-- =========================================================

CREATE TABLE oferta (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Origen e identificacion
    fuente TEXT NOT NULL,
    comercio TEXT,
    producto TEXT NOT NULL,
    url TEXT NOT NULL,
    producto_id TEXT,

    -- Precios en pesos argentinos
    precio_lista_pesos REAL,
    precio_oferta_pesos REAL,
    descuento_porc REAL,

    -- Identificacion y clasificacion
    ean TEXT,
    marca TEXT,
    categoria TEXT,
    categoria_ruta TEXT, -- JSON array
    detalle TEXT,

    -- Presentacion
    precio_unidad REAL,
    unidad_medida TEXT CHECK (
        unidad_medida IS NULL OR unidad_medida IN ('kg', 'L')
    ),

    -- Imagen y disponibilidad
    imagen_url TEXT,
    stock INTEGER,
    disponible INTEGER NOT NULL DEFAULT 1
        CHECK (disponible IN (0, 1)),

    -- Ubicacion
    ubicacion TEXT,
    localidad TEXT,
    provincia TEXT,

    -- Vigencia
    fecha_inicio TEXT,
    fecha_fin TEXT,

    -- Beneficios y condiciones
    cuotas TEXT,       -- JSON array
    reintegro TEXT,
    promos TEXT,       -- JSON array
    tipo_promo TEXT,

    -- Control de extraccion
    fecha_captura TEXT NOT NULL,
    creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Vinculo con la lista del usuario.
    -- NULL = oferta del catalogo global (buscador); con valor = guardada
    -- desde un producto, y de ahi se deducen grupo, admin y creador.
    id_producto_lista INTEGER,

    FOREIGN KEY (id_producto_lista)
        REFERENCES producto_lista(id_producto_lista)
        ON DELETE CASCADE,

    CHECK (precio_lista_pesos IS NULL OR precio_lista_pesos >= 0),
    CHECK (precio_oferta_pesos IS NULL OR precio_oferta_pesos >= 0),
    CHECK (
        descuento_porc IS NULL
        OR (descuento_porc >= 0 AND descuento_porc <= 100)
    ),
    CHECK (stock IS NULL OR stock >= 0)
);

CREATE INDEX IF NOT EXISTS idx_oferta_producto_lista
ON oferta (id_producto_lista);

CREATE INDEX IF NOT EXISTS idx_oferta_fuente_producto
ON oferta (fuente, producto_id);

CREATE INDEX IF NOT EXISTS idx_oferta_ean
ON oferta (ean);

CREATE INDEX IF NOT EXISTS idx_oferta_marca_producto
ON oferta (marca, producto);

CREATE INDEX IF NOT EXISTS idx_oferta_vigencia
ON oferta (fecha_fin, disponible);

CREATE INDEX IF NOT EXISTS idx_oferta_provincia_localidad
ON oferta (provincia, localidad);


-- =========================================================
-- 8. INVITACION_GRUPO
-- =========================================================

CREATE TABLE invitacion_grupo (
    id_invitacion INTEGER PRIMARY KEY AUTOINCREMENT,

    id_usuario_origen INTEGER NOT NULL,

    id_usuario_destino INTEGER NOT NULL,

    id_grupo INTEGER NOT NULL,

    estado TEXT NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN (
            'pendiente',
            'aceptada',
            'rechazada'
        )),

    fecha_creacion TEXT NOT NULL DEFAULT (datetime('now')),

    fecha_respuesta TEXT,

    FOREIGN KEY (id_usuario_origen)
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE,

    FOREIGN KEY (id_usuario_destino)
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE,

    FOREIGN KEY (id_grupo)
        REFERENCES grupo(id_grupo)
        ON DELETE CASCADE
);


-- =========================================================
-- 9. NOTIFICACION
-- =========================================================

CREATE TABLE notificacion (
    id_notificacion INTEGER PRIMARY KEY AUTOINCREMENT,

    id_grupo INTEGER NOT NULL,

    tipo TEXT NOT NULL,

    titulo TEXT NOT NULL,

    descripcion TEXT,

    fecha_creacion TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (id_grupo)
        REFERENCES grupo(id_grupo)
        ON DELETE CASCADE
);


-- =========================================================
-- ÍNDICES
-- =========================================================

CREATE INDEX idx_usuario_email
ON usuario(email);


CREATE INDEX idx_usuario_grupo_usuario
ON usuario_grupo(id_usuario);


CREATE INDEX idx_usuario_grupo_grupo
ON usuario_grupo(id_grupo);


CREATE INDEX idx_lista_grupo
ON lista(id_grupo);


CREATE INDEX idx_lista_creador
ON lista(id_usuario_creador);


CREATE INDEX idx_lista_administrador
ON lista(id_usuario_administrador);


CREATE INDEX idx_producto_lista_lista
ON producto_lista(id_lista);


CREATE INDEX idx_producto_lista_creador
ON producto_lista(id_usuario_creador);


CREATE INDEX idx_producto_lista_codigo
ON producto_lista(codigo_producto);


CREATE INDEX idx_movimiento_grupo
ON movimiento(id_grupo);


CREATE INDEX idx_movimiento_usuario
ON movimiento(id_usuario_creador);


CREATE INDEX idx_movimiento_fecha
ON movimiento(fecha_movimiento);


CREATE INDEX idx_oferta_fecha
ON oferta(fecha_inicio, fecha_fin);


CREATE INDEX idx_invitacion_destino
ON invitacion_grupo(id_usuario_destino);


CREATE INDEX idx_invitacion_grupo
ON invitacion_grupo(id_grupo);


CREATE INDEX idx_invitacion_estado
ON invitacion_grupo(estado);


CREATE INDEX idx_notificacion_grupo
ON notificacion(id_grupo);


CREATE INDEX idx_notificacion_fecha
ON notificacion(fecha_creacion);


COMMIT;
