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
