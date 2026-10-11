// Tabla usuario: altas y busquedas minimas de auth.
import { run, getOne, filasAfectadas } from "../../shared/db.helpers";
import type { RegistrarUsuarioBody, UsuarioDB } from "./user.scheme";
import { ahoraIso } from "../../shared/utils/dates";

/** Alta: body sin plano + hash ya calculado. */
export interface CrearUsuarioInput
  extends Omit<RegistrarUsuarioBody, "contrasena"> {
  contrasenaHash: string;
}

/** Inserta y relee por id (lastInsertRowid). */
export async function crearUsuario(
  input: CrearUsuarioInput
): Promise<UsuarioDB | undefined> {
  const fechaCreacion = ahoraIso();

  const sql = `
    INSERT INTO usuario (
      nombre,
      email,
      contrasena,
      localidad,
      provincia,
      pais,
      domicilio,
      fecha_creacion
    )
    VALUES (
      @nombre,
      @email,
      @contrasenaHash,
      @localidad,
      @provincia,
      @pais,
      @domicilio,
      @fecha_creacion
    )
  `;

  const params = {
    nombre: input.nombre,
    email: input.email,
    contrasenaHash: input.contrasenaHash,
    localidad: input.localidad ?? null,
    provincia: input.provincia ?? null,
    pais: input.pais ?? null,
    domicilio: input.domicilio ?? null,
    fecha_creacion: fechaCreacion,
  };

  const rs = await run(sql, params);
  const id = rs.lastInsertRowid;

  if (id == null) {
    return undefined;
  }

  return obtenerUsuarioPorId(Number(id));
}

/** Por email en minusculas (login, registro, invitaciones). */
export async function obtenerUsuarioPorEmail(
  email: string
): Promise<UsuarioDB | undefined> {
  const sql = `
    SELECT
      id_usuario,
      nombre,
      email,
      contrasena,
      localidad,
      provincia,
      pais,
      domicilio,
      fecha_creacion
    FROM usuario
    WHERE email = @email
    LIMIT 1
  `;

  return getOne<UsuarioDB>(sql, { email: email.toLowerCase().trim() });
}

/** Por id (valida la sesion en /auth/yo). */
export async function obtenerUsuarioPorId(
  idUsuario: number
): Promise<UsuarioDB | undefined> {
  const sql = `
    SELECT
      id_usuario,
      nombre,
      email,
      contrasena,
      localidad,
      provincia,
      pais,
      domicilio,
      fecha_creacion
    FROM usuario
    WHERE id_usuario = @idUsuario
    LIMIT 1
  `;

  return getOne<UsuarioDB>(sql, { idUsuario });
}

/** UPDATE parcial del perfil (solo datos, nunca email ni contrasena). */
export async function actualizarUsuario(
  idUsuario: number,
  datos: Partial<{
    nombre: string;
    localidad: string;
    provincia: string;
    pais: string;
    domicilio: string;
  }>
): Promise<UsuarioDB | undefined> {
  const sets: string[] = [];
  const params: Record<string, unknown> = { idUsuario };
  if (datos.nombre !== undefined) {
    sets.push("nombre = @nombre");
    params.nombre = datos.nombre.trim();
  }
  for (const campo of ["localidad", "provincia", "pais", "domicilio"] as const) {
    if (datos[campo] !== undefined) {
      sets.push(`${campo} = @${campo}`);
      const v = datos[campo] as string;
      params[campo] = v.trim() === "" ? null : v.trim();
    }
  }
  if (sets.length === 0) return obtenerUsuarioPorId(idUsuario);
  const sql = `UPDATE usuario SET ${sets.join(", ")} WHERE id_usuario = @idUsuario`;
  await run(sql, params);
  return obtenerUsuarioPorId(idUsuario);
}

/** Reemplaza el hash de la contrasena. */
export async function actualizarContrasena(
  idUsuario: number,
  contrasenaHash: string
): Promise<boolean> {
  const sql = `UPDATE usuario SET contrasena = @contrasenaHash WHERE id_usuario = @idUsuario`;
  const rs = await run(sql, { contrasenaHash, idUsuario });
  return filasAfectadas(rs) > 0;
}
