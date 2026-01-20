import { env } from "@ezcare/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

// biome-ignore lint/performance/noNamespaceImport: <explanation>
import * as schema from "./schema";

export const db = drizzle(env.DATABASE_URL, { schema });
