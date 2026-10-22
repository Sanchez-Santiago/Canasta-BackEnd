// Entrada: arma Express, monta routers y arranca.
// GET / es publica y sirve la home HTML con la documentacion.
import { createServer } from "http";
import express from "express";
import cookieParser from "cookie-parser";
import { authMiddleware } from "./shared/middlewares/auth";
import { errorMiddleware } from "./shared/middlewares/error";
import { requestLogger } from "./shared/middlewares/requestLogger";
import { obtenerLogs } from "./shared/logs";
import authRoutes from "./modules/user/user.router";
import grupoRoutes from "./modules/grupo/grupo.router";
import listaRoutes from "./modules/lista/lista.router";
import productoListaRoutes from "./modules/productoLista/productoLista.router";
import movimientoRoutes from "./modules/movimiento/movimiento.router";
import ofertaRoutes from "./modules/oferta/oferta.router";
import invitacionRoutes from "./modules/invitacion/invitacion.router";
import notificacionRoutes from "./modules/notificacion/notificacion.router";
import { renderHomePage } from "./shared/home";
import { getDocumentacionEndpoints } from "./shared/home-datos";
import { getDb } from "./config/database";
import { env } from "./config/env";
import { barrerOfertasVencidas } from "./modules/oferta/oferta.service";
import { montarWebSockets } from "./shared/ws/ws";

const app = express();

app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Logger primero: registra todo, incluso los 401 del auth.
app.use(requestLogger);

app.use(authMiddleware);

// Home publica con la tabla de endpoints.
app.get("/", (_req, res) => {
  res.status(200).type("html").send(renderHomePage());
});

// Historial de requests (protegida por el auth global).
app.get("/logs", (req, res) => {
  if (!req.user) {
    res.status(401).json({ ok: false, error: "No autorizado" });
    return;
  }
  const limite = Number(req.query.limite ?? 50);
  res.status(200).json({ ok: true, data: obtenerLogs(limite) });
});

// Routers por dominio (protegidos salvo excepciones de auth).
app.use("/auth", authRoutes);
app.use("/grupos", grupoRoutes);
app.use("/", listaRoutes);
app.use("/", productoListaRoutes);
app.use("/", movimientoRoutes);
app.use("/", ofertaRoutes);
app.use("/", invitacionRoutes);
app.use("/", notificacionRoutes);

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: "Ruta no encontrada" });
});

app.use(errorMiddleware);

const PORT = env.PORT || 3000;
const HOST = "0.0.0.0";
const API_URL = `http://localhost:${PORT}`;

/** Verifica la DB y levanta el servidor; sale si no conecta. */
async function iniciarServidor() {
  try {
    const db = getDb();
    await db.execute("SELECT 1");
    console.log("✅ Conexión a la base de datos establecida correctamente");
    console.log(`📌 URL de la base de datos: ${env.TURSO_DATABASE_URL}`);

    // El sistema limpia solo: barre las ofertas vencidas al arrancar.
    const vencidas = await barrerOfertasVencidas();
    if (vencidas > 0) {
      console.log(`🧹 Ofertas vencidas eliminadas: ${vencidas}`);
    }
  } catch (error) {
    console.error("❌ Error al conectar con la base de datos:", error);
    process.exit(1);
  }

  const server = createServer(app);
  montarWebSockets(server);

  server.listen(PORT, HOST, () => {
    const endpoints = getDocumentacionEndpoints().flatMap((g) => g.endpoints);
    const publicas = endpoints.filter((e) => e.auth === "publica").length;
    console.log(`🚀 Canasta+ backend escuchando en ${HOST}:${PORT}`);
    console.log(`🌍 Entorno: ${env.NODE_ENV}`);
    console.log(`🔗 API disponible en: ${API_URL}`);
    console.log(`🏠 Home HTML en: ${API_URL}/`);
    console.log(`🔌 WebSocket en vivo: ws://localhost:${PORT}/ws`);
    console.log(
      `📚 ${endpoints.length} endpoints (${publicas} públicos, ${endpoints.length - publicas} protegidos)`
    );
    console.log(`📝 Historial: GET ${API_URL}/logs (últimas 200 solicitudes)`);
    console.log(`🔐 Claves: mín 8, letra+número; login distingue email de clave`);
    console.log(`📚 Rutas de Auth:`);
    console.log(`   POST ${API_URL}/auth/registrar`);
    console.log(`   POST ${API_URL}/auth/login`);
    console.log(`   GET  ${API_URL}/auth/yo`);
    console.log(`   POST ${API_URL}/auth/logout`);
  });
}

iniciarServidor();

