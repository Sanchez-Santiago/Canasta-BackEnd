// Entrada: arma Express, monta routers y arranca.
// GET / es publica y sirve la home HTML con la documentacion.
import express from "express";
import cookieParser from "cookie-parser";
import { authMiddleware } from "./shared/middlewares/auth";
import { errorMiddleware } from "./shared/middlewares/error";
import authRoutes from "./modules/user/user.router";
import grupoRoutes from "./modules/grupo/grupo.router";
import listaRoutes from "./modules/lista/lista.router";
import productoListaRoutes from "./modules/productoLista/productoLista.router";
import movimientoRoutes from "./modules/movimiento/movimiento.router";
import ofertaRoutes from "./modules/oferta/oferta.router";
import invitacionRoutes from "./modules/invitacion/invitacion.router";
import notificacionRoutes from "./modules/notificacion/notificacion.router";
import { renderHomePage } from "./shared/home";
import { getDb } from "./config/database";
import { env } from "./config/env";

const app = express();

app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(authMiddleware);

// Home publica con la tabla de endpoints.
app.get("/", (_req, res) => {
  res.status(200).type("html").send(renderHomePage());
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
  } catch (error) {
    console.error("❌ Error al conectar con la base de datos:", error);
    process.exit(1);
  }

  app.listen(PORT, HOST, () => {
    console.log(`🚀 Canasta+ backend escuchando en ${HOST}:${PORT}`);
    console.log(`🌍 Entorno: ${env.NODE_ENV}`);
    console.log(`🔗 API disponible en: ${API_URL}`);
    console.log(`🏠 Home HTML en: ${API_URL}/`);
    console.log(`📚 Rutas de Auth:`);
    console.log(`   POST ${API_URL}/auth/registrar`);
    console.log(`   POST ${API_URL}/auth/login`);
    console.log(`   GET  ${API_URL}/auth/yo`);
    console.log(`   POST ${API_URL}/auth/logout`);
  });
}

iniciarServidor();

