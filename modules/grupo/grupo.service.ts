// Reglas de grupo: personal intocable, cambios solo admin.
import {
  crearGrupoGrupal,
  obtenerGrupoConRol,
  obtenerGruposDeUsuario,
  obtenerMiembrosDeGrupo,
  actualizarGrupoGrupal,
  eliminarGrupoGrupal,
} from "./grupo.model";
import type {
  CrearGrupoGrupalBody,
  ActualizarGrupoGrupalBody,
  GrupoConRolRespuesta,
  GrupoRespuesta,
  MiembroGrupoRespuesta,
} from "./grupo.scheme";

/** Error con status para responder desde el controller. */
export class GrupoError extends Error {
  status: number;
  constructor(mensaje: string, status = 400) {
    super(mensaje);
    this.name = "GrupoError";
    this.status = status;
  }
}

// Recorta la fila a lo publico.
function aGrupoRespuesta(g: any): GrupoRespuesta {
  return {
    id_grupo: g.id_grupo,
    nombre: g.nombre,
    descripcion: g.descripcion,
    categoria: g.categoria,
    tipo: g.tipo,
    fecha_creacion: g.fecha_creacion,
  };
}

// Idem + rol y fecha de ingreso.
function aGrupoConRolRespuesta(g: any): GrupoConRolRespuesta {
  return {
    id_grupo: g.id_grupo,
    nombre: g.nombre,
    descripcion: g.descripcion,
    categoria: g.categoria,
    tipo: g.tipo,
    fecha_creacion: g.fecha_creacion,
    rol: g.rol,
    fecha_ingreso: g.fecha_ingreso,
  };
}

// Idem para miembros.
function aMiembroGrupoRespuesta(m: any): MiembroGrupoRespuesta {
  return {
    id_usuario: m.id_usuario,
    nombre: m.nombre,
    email: m.email,
    rol: m.rol,
    fecha_ingreso: m.fecha_ingreso,
  };
}

/** Crea grupal (el model da de alta al admin). */
export async function crearGrupoGrupalService(
  idUsuario: number,
  datos: CrearGrupoGrupalBody
): Promise<{ grupo: GrupoRespuesta }> {
  const creado = await crearGrupoGrupal(idUsuario, {
    nombre: datos.nombre,
    descripcion: datos.descripcion,
    categoria: datos.categoria,
  });
  if (!creado) throw new GrupoError("No se pudo crear el grupo grupal", 500);
  return { grupo: aGrupoRespuesta(creado) };
}

/** Mis grupos con rol. */
export async function obtenerMisGruposService(
  idUsuario: number
): Promise<{ grupos: GrupoConRolRespuesta[] }> {
  const grupos = await obtenerGruposDeUsuario(idUsuario);
  return { grupos: grupos.map(aGrupoConRolRespuesta) };
}

/** Detalle solo si pertenezco; 404 si no. */
export async function obtenerGrupoPorIdService(
  idUsuario: number,
  idGrupo: number
): Promise<{ grupo: GrupoConRolRespuesta }> {
  const grupo = await obtenerGrupoConRol(idUsuario, idGrupo);
  if (!grupo) throw new GrupoError("Grupo no encontrado o no perteneces a él", 404);
  return { grupo: aGrupoConRolRespuesta(grupo) };
}

/** Miembros solo si pertenezco. */
export async function obtenerMiembrosDeGrupoService(
  idUsuario: number,
  idGrupo: number
): Promise<{ miembros: MiembroGrupoRespuesta[] }> {
  const miembro = await obtenerGrupoConRol(idUsuario, idGrupo);
  if (!miembro) {
    throw new GrupoError("Grupo no encontrado o no perteneces a él", 404);
  }
  const miembros = await obtenerMiembrosDeGrupo(idGrupo);
  return { miembros: miembros.map(aMiembroGrupoRespuesta) };
}

/** Edita grupal: 403 si es personal o no soy admin. */
export async function actualizarGrupoGrupalService(
  idUsuario: number,
  idGrupo: number,
  datos: ActualizarGrupoGrupalBody
): Promise<{ grupo: GrupoRespuesta }> {
  const miembro = await obtenerGrupoConRol(idUsuario, idGrupo);
  if (!miembro) throw new GrupoError("Grupo no encontrado o no perteneces a él", 404);
  if (miembro.tipo === "personal") {
    throw new GrupoError("El grupo personal no puede modificarse", 403);
  }
  if (miembro.rol !== "administrador") {
    throw new GrupoError("Solo el administrador puede editar el grupo", 403);
  }
  const actualizado = await actualizarGrupoGrupal(idGrupo, datos);
  if (!actualizado) throw new GrupoError("No se pudo actualizar el grupo", 500);
  return { grupo: aGrupoRespuesta(actualizado) };
}

/** Elimina grupal: 403 si es personal o no soy admin. */
export async function eliminarGrupoGrupalService(
  idUsuario: number,
  idGrupo: number
): Promise<{ eliminado: boolean }> {
  const miembro = await obtenerGrupoConRol(idUsuario, idGrupo);
  if (!miembro) throw new GrupoError("Grupo no encontrado o no perteneces a él", 404);
  if (miembro.tipo === "personal") {
    throw new GrupoError("El grupo personal no puede eliminarse", 403);
  }
  if (miembro.rol !== "administrador") {
    throw new GrupoError("Solo el administrador puede eliminar el grupo", 403);
  }
  const ok = await eliminarGrupoGrupal(idGrupo);
  if (!ok) throw new GrupoError("No se pudo eliminar el grupo grupal", 500);
  return { eliminado: true };
}
