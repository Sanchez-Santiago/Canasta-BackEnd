# 1. Usa la imagen oficial de Bun
FROM oven/bun:latest AS base
WORKDIR /app

# 2. Instala dependencias aprovechando el caché
FROM base AS install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# 3. Copia el resto del código fuente
FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY . .

# Puerto en el que corre tu app (ajústalo si usas otro, ej: 3000)
EXPOSE 3000

# Comando para iniciar tu app (como tu archivo principal es index.ts en la raíz)
CMD ["bun", "run", "index.ts"]
