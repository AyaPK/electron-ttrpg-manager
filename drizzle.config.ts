import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './electron/schema.ts',
  out: './electron/migrations',
  dialect: 'sqlite',
})
