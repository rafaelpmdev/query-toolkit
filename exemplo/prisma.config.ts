import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * Configuração centralizada do Prisma 7.
 * Conforme a arquitetura do Prisma 7, as configurações de datasource
 * e caminhos de schema são gerenciadas neste arquivo typescript dedicado.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
