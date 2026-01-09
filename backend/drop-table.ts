import { pgTable } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import "dotenv/config";

const dbUser = process.env.POSTGRES_APP_USER;
const dbPassword = process.env.POSTGRES_APP_PASSWORD;
const dbHost = process.env.POSTGRES_HOST;
const dbPort = process.env.POSTGRES_PORT;
const dbName = process.env.POSTGRES_DB;

if (!dbUser || !dbPassword || !dbHost || !dbPort || !dbName) {
  throw new Error("Invalid DB env.");
}

const connectionString = `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
const client = postgres(connectionString);
const db = drizzle(client);

async function main() {
    console.log("🗑️ Dropping migration table...");
    await client`DROP TABLE IF EXISTS "__drizzle_migrations" CASCADE;`;
    console.log("✅ Done!");
    process.exit(0);
}

main();