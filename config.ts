import z from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "testing"]),
  NEXT_PUBLIC_SITE_URL: z.string().url(),

  DATABASE_URL: z.string(),

  // Define Schema
});

export const env = envSchema.parse(process.env);

export const config = {};
