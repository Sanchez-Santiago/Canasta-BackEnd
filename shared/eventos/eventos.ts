// Eventos del sistema en vivo (WebSocket).
// Un unico sobre para todos: el modulo que dispara la accion solo llama a
// emitirEvento() y este bus (1) persiste la notificacion y (2) la empuja.
import { crearNotificacion } from "../../modules/notificacion/notificacion.model";
import type { NotificacionDB } from "../../modules/notificacion/notificacion.scheme";

/** Tipos de notificacion que puede generar el sistema (no una persona). */
export const TIPOS_SISTEMA = [
  "producto_agregado",
  "producto_estado",
  "oferta_encontrada",
  "invitacion_recibida",
  "invitacion_respondida",
  "movimiento_agregado",
] as const;

export type TipoSistema = (typeof TIPOS_SISTEMA)[number];

/** Canales de suscripcion del socket. */
export function canalGrupo(idGrupo: number): string {
  return `grupo:${idGrupo}`;
}
export function canalUsuario(idUsuario: number): string {
  return `usuario:${idUsuario}`;
}

/** Sobre que recibe el cliente por el socket. */
export type EventoWs = {
  evento: "notificacion";
  accion: TipoSistema;
  id_grupo: number | null;
  notificacion: NotificacionDB;
  datos: Record<string, unknown>;
};

/** Puente hacia el servidor WS (lo setea shared/ws para evitar ciclos). */
type Emisor = (canales: string[], evento: EventoWs) => void;
let emisor: Emisor | null = null;

/** El servidor WS se registra aca al arrancar. */
export function registrarEmisor(fn: Emisor): void {
  emisor = fn;
}

/**
 * Persiste una notificacion del sistema y la empuja por los canales dados.
 *
 * @param idGrupo  grupo dueño de la notificacion (null: canal personal).
 * @param tipo     tipo del sistema.
 * @param titulo   texto corto.
 * @param opciones descripcion, id del destinatario y datos extra del evento.
 */
export async function emitirEvento(datos: {
  idGrupo: number | null;
  tipo: TipoSistema;
  titulo: string;
  descripcion?: string;
  /** Solo para eventos dirigidos a un usuario (invitaciones). */
  idUsuarioDestino?: number;
  /** Contexto extra que viaja en el sobre (`datos`). */
  extra?: Record<string, unknown>;
}): Promise<NotificacionDB | undefined> {
  // Sin grupo no hay fila persistible: el evento es solo en vivo.
  let notificacion: NotificacionDB | undefined;
  if (datos.idGrupo != null) {
    notificacion = await crearNotificacion(datos.idGrupo, {
      tipo: datos.tipo,
      titulo: datos.titulo,
      descripcion: datos.descripcion,
    });
  }

  const canales: string[] = [];
  if (datos.idUsuarioDestino != null) {
    canales.push(canalUsuario(datos.idUsuarioDestino));
  }
  if (datos.idGrupo != null) {
    canales.push(canalGrupo(datos.idGrupo));
  }

  if (!emisor || canales.length === 0) return notificacion;

  // Evento dirigido sin grupo persistido: se arma un sobre efimero.
  const sobre: NotificacionDB = notificacion ?? {
    id_notificacion: 0,
    id_grupo: 0,
    tipo: datos.tipo,
    titulo: datos.titulo,
    descripcion: datos.descripcion ?? null,
    fecha_creacion: new Date().toISOString(),
  };

  emisor(canales, {
    evento: "notificacion",
    accion: datos.tipo,
    id_grupo: datos.idGrupo,
    notificacion: sobre,
    datos: datos.extra ?? {},
  });
  return notificacion;
}
