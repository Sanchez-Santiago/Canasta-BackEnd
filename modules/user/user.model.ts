import { run, getOne } from "../../shared/db.helpers";
import type { RegistrarUsuarioBody, UsuarioDB } from "./user.scheme";
import { ahoraIso } from "../../shared/utils/dates";

export interface CrearUsuarioInput
  extends Omit<RegistrarUsuarioBody, "contrasena"> {
  contrasenaHash: string;
}

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
