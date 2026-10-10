// Negocio de auth: altas, login y JWT (sin HTTP ni SQL).
import type {
  RegistrarUsuarioBody,
  LoginBody,
  UsuarioRespuesta,
  UsuarioDB,
} from "./user.scheme";
import {
  crearUsuario,
  obtenerUsuarioPorEmail,
  obtenerUsuarioPorId,
} from "./user.model";
import { hashContrasena, compararContrasena, evaluarFortaleza } from "../../shared/utils/password";
import { firmarJwt } from "../../shared/utils/jwt";
import { crearGrupoPersonal } from "../grupo/grupo.model";

/** Error con status para responder desde el controller. */
export class AuthError extends Error {
  status: number;
  detalles?: unknown;

  constructor(mensaje: string, status = 400, detalles?: unknown) {
    super(mensaje);
    this.name = "AuthError";
    this.status = status;
    this.detalles = detalles;
  }
}

// Quita el hash antes de responder.
function aUsuarioRespuesta(usuario: UsuarioDB): UsuarioRespuesta {
  return {
    id_usuario: usuario.id_usuario,
    nombre: usuario.nombre,
    email: usuario.email,
    localidad: usuario.localidad,
    provincia: usuario.provincia,
    pais: usuario.pais,
    domicilio: usuario.domicilio,
    fecha_creacion: usuario.fecha_creacion,
  };
}

/** Crea usuario + grupo personal y firma JWT. 409 si el email existe. */
export async function registrarUsuario(
  data: RegistrarUsuarioBody
): Promise<{ usuario: UsuarioRespuesta; token: string }> {
  const existente = await obtenerUsuarioPorEmail(data.email);

  if (existente) {
    throw new AuthError("El email ya se encuentra registrado", 409);
  }

  const fortaleza = evaluarFortaleza(data.contrasena);
  if (!fortaleza.fuerte) {
    throw new AuthError("Contraseña demasiado débil", 400, {
      recomendaciones: fortaleza.recomendaciones,
    });
  }

  const contrasenaHash = await hashContrasena(data.contrasena);

  const creado = await crearUsuario({
    nombre: data.nombre,
    email: data.email,
    contrasenaHash,
    localidad: data.localidad,
    provincia: data.provincia,
    pais: data.pais,
    domicilio: data.domicilio,
  });

  if (!creado) {
    throw new AuthError("No se pudo crear el usuario", 500);
  }

  await crearGrupoPersonal(creado.id_usuario, creado.nombre);

  const usuario = aUsuarioRespuesta(creado);
  const token = firmarJwt({ idUsuario: creado.id_usuario });

  return { usuario, token };
}

/** Compara hash y firma JWT. 401 si no coincide. */
export async function loginUsuario(
  data: LoginBody
): Promise<{ usuario: UsuarioRespuesta; token: string }> {
  const usuarioDb = await obtenerUsuarioPorEmail(data.email);

  if (!usuarioDb) {
    throw new AuthError("No existe un usuario con ese email", 404);
  }

  const valido = await compararContrasena(data.contrasena, usuarioDb.contrasena);

  if (!valido) {
    throw new AuthError("Contraseña incorrecta", 401);
  }

  const usuario = aUsuarioRespuesta(usuarioDb);
  const token = firmarJwt({ idUsuario: usuarioDb.id_usuario });

  return { usuario, token };
}

/** Usuario de la sesion; null si fue borrado. */
export async function obtenerUsuarioAutenticado(
  idUsuario: number
): Promise<UsuarioRespuesta | null> {
  const usuarioDb = await obtenerUsuarioPorId(idUsuario);
  if (!usuarioDb) return null;
  return aUsuarioRespuesta(usuarioDb);
}
