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
import { hashContrasena, compararContrasena } from "../../shared/utils/password";
import { firmarJwt } from "../../shared/utils/jwt";
import { crearGrupoPersonal } from "../grupo/grupo.model";

export class AuthError extends Error {
  status: number;

  constructor(mensaje: string, status = 400) {
    super(mensaje);
    this.name = "AuthError";
    this.status = status;
  }
}

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

export async function registrarUsuario(
  data: RegistrarUsuarioBody
): Promise<{ usuario: UsuarioRespuesta; token: string }> {
  const existente = await obtenerUsuarioPorEmail(data.email);

  if (existente) {
    throw new AuthError("El email ya se encuentra registrado", 409);
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

export async function loginUsuario(
  data: LoginBody
): Promise<{ usuario: UsuarioRespuesta; token: string }> {
  const usuarioDb = await obtenerUsuarioPorEmail(data.email);

  if (!usuarioDb) {
    throw new AuthError("Credenciales inválidas", 401);
  }

  const valido = await compararContrasena(data.contrasena, usuarioDb.contrasena);

  if (!valido) {
    throw new AuthError("Credenciales inválidas", 401);
  }

  const usuario = aUsuarioRespuesta(usuarioDb);
  const token = firmarJwt({ idUsuario: usuarioDb.id_usuario });

  return { usuario, token };
}

export async function obtenerUsuarioAutenticado(
  idUsuario: number
): Promise<UsuarioRespuesta | null> {
  const usuarioDb = await obtenerUsuarioPorId(idUsuario);
  if (!usuarioDb) return null;
  return aUsuarioRespuesta(usuarioDb);
}
