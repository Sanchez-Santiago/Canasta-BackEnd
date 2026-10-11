// Negocio de auth: altas, login y JWT (sin HTTP ni SQL).
import type {
  RegistrarUsuarioBody,
  LoginBody,
  ActualizarPerfilBody,
  CambiarContrasenaBody,
  UsuarioRespuesta,
  UsuarioDB,
} from "./user.scheme";
import {
  crearUsuario,
  obtenerUsuarioPorEmail,
  obtenerUsuarioPorId,
  actualizarUsuario,
  actualizarContrasena,
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

/** Edita el propio perfil (nombre/ubicación). Email y clave van por separado. */
export async function actualizarPerfilService(
  idUsuario: number,
  datos: ActualizarPerfilBody
): Promise<{ usuario: UsuarioRespuesta }> {
  const existe = await obtenerUsuarioPorId(idUsuario);
  if (!existe) throw new AuthError("Usuario no encontrado", 401);
  const actualizado = await actualizarUsuario(idUsuario, datos);
  if (!actualizado) throw new AuthError("No se pudo actualizar el perfil", 500);
  return { usuario: aUsuarioRespuesta(actualizado) };
}

/** Cambia la clave: verifica la actual, exige distinta y fuerte. */
export async function cambiarContrasenaService(
  idUsuario: number,
  datos: CambiarContrasenaBody
): Promise<{ actualizado: boolean }> {
  const usuarioDb = await obtenerUsuarioPorId(idUsuario);
  if (!usuarioDb) throw new AuthError("Usuario no encontrado", 401);

  const actualOk = await compararContrasena(datos.contrasena_actual, usuarioDb.contrasena);
  if (!actualOk) throw new AuthError("Contraseña actual incorrecta", 401);

  const esIgual = await compararContrasena(datos.contrasena_nueva, usuarioDb.contrasena);
  if (esIgual) throw new AuthError("La nueva contraseña debe ser diferente", 400);

  const fortaleza = evaluarFortaleza(datos.contrasena_nueva);
  if (!fortaleza.fuerte) {
    throw new AuthError("Contraseña demasiado débil", 400, {
      recomendaciones: fortaleza.recomendaciones,
    });
  }

  const ok = await actualizarContrasena(idUsuario, await hashContrasena(datos.contrasena_nueva));
  if (!ok) throw new AuthError("No se pudo actualizar la contraseña", 500);
  return { actualizado: true };
}
