// Servidor WebSocket (ws) montado sobre el http.Server de Express.
// Handshake: valida el JWT de la cookie `auth_token` (o Bearer).
// Suscripcion: el cliente pide grupos y se valida pertenencia con la DB.
import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage, Server } from "http";
import { AUTH_COOKIE_NAME } from "../utils/cookies";
import { verificarJwt } from "../utils/jwt";
import { obtenerGrupoConRol } from "../../modules/grupo/grupo.model";
import {
  canalGrupo,
  canalUsuario,
  registrarEmisor,
  type EventoWs,
} from "../eventos/eventos";

/** Cliente conectado: usuario + canales a los que esta suscrito. */
type Cliente = {
  socket: WebSocket;
  idUsuario: number;
  canales: Set<string>;
};

const clientes = new Set<Cliente>();

/** Extrae el token de la cookie o del header Authorization del upgrade. */
function tokenDeUpgrade(req: IncomingMessage): string | null {
  const cookie = req.headers.cookie;
  if (cookie) {
    for (const parte of cookie.split(";")) {
      const [clave, ...resto] = parte.trim().split("=");
      if (clave === AUTH_COOKIE_NAME) {
        const valor = resto.join("=").trim();
        if (valor !== "") return valor;
      }
    }
  }
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    const t = header.slice("Bearer ".length).trim();
    if (t !== "") return t;
  }
  return null;
}

/** Manda el sobre a todos los clientes suscritos a alguno de los canales. */
function emitir(canales: string[], evento: EventoWs): void {
  if (canales.length === 0) return;
  const payload = JSON.stringify(evento);
  for (const c of clientes) {
    if (canales.some((canal) => c.canales.has(canal))) {
      // 1 = OPEN
      if (c.socket.readyState === WebSocket.OPEN) {
        c.socket.send(payload);
      }
    }
  }
}

/** Procesa un mensaje del cliente: solo `suscribir`/`desuscribir`. */
async function manejarMensaje(cliente: Cliente, raw: string): Promise<void> {
  let msg: { accion?: string; grupos?: unknown };
  try {
    msg = JSON.parse(raw);
  } catch {
    cliente.socket.send(
      JSON.stringify({ evento: "error", error: "JSON inválido" })
    );
    return;
  }

  const grupos = Array.isArray(msg.grupos)
    ? msg.grupos.map((g) => Number(g)).filter((n) => Number.isInteger(n) && n > 0)
    : [];

  if (msg.accion === "suscribir") {
    const aceptados: string[] = [];
    for (const idGrupo of grupos) {
      // Solo grupos a los que el usuario pertenece.
      const miembro = await obtenerGrupoConRol(cliente.idUsuario, idGrupo);
      if (!miembro) continue;
      const canal = canalGrupo(idGrupo);
      cliente.canales.add(canal);
      aceptados.push(canal);
    }
    cliente.socket.send(
      JSON.stringify({ evento: "suscripcion", canales: [...cliente.canales] })
    );
    return;
  }

  if (msg.accion === "desuscribir") {
    for (const idGrupo of grupos) cliente.canales.delete(canalGrupo(idGrupo));
    cliente.socket.send(
      JSON.stringify({ evento: "suscripcion", canales: [...cliente.canales] })
    );
    return;
  }

  cliente.socket.send(
    JSON.stringify({ evento: "error", error: "Acción no soportada" })
  );
}

/**
 * Crea el WebSocketServer y lo engancha al http.Server ya existente.
 * Tambien registra el emisor del bus para que `emitirEvento` haga push.
 */
export function montarWebSockets(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (socket: WebSocket, req: IncomingMessage) => {
    const token = tokenDeUpgrade(req);
    if (!token) {
      socket.close(1008, "No autorizado");
      return;
    }
    let idUsuario: number;
    try {
      idUsuario = verificarJwt(token).idUsuario;
    } catch {
      socket.close(1008, "Token inválido o expirado");
      return;
    }

    const cliente: Cliente = {
      socket,
      idUsuario,
      // Canal personal: recibe invitaciones dirigidas aunque no este en el grupo.
      canales: new Set([canalUsuario(idUsuario)]),
    };
    clientes.add(cliente);

    socket.send(
      JSON.stringify({ evento: "conectado", id_usuario: idUsuario })
    );

    socket.on("message", (data) => {
      void manejarMensaje(cliente, data.toString());
    });
    socket.on("close", () => clientes.delete(cliente));
    socket.on("error", () => clientes.delete(cliente));
  });

  // El bus de eventos usa este emisor para persistir + empujar.
  registrarEmisor(emitir);
  return wss;
}
