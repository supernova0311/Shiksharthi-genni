import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./configs/schema.js",
  dbCredentials: {
    url: "postgresql://neondb_owner:LNP3dt7RbOzC@ep-square-shape-a578sqs2.us-east-2.aws.neon.tech/gennie?sslmode=require",
  },
});
