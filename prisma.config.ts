import path from "node:path"
import "dotenv/config"
import { defineConfig, env } from "prisma/config"

// Prisma 7 moved datasource connection URLs out of schema.prisma.
// The CLI (generate / migrate / studio) reads the connection string from here;
// the runtime PrismaClient connects via the pg driver adapter in src/lib/prisma.ts.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
})
