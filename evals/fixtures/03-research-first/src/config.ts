export const config = {
  port: Number(process.env.PORT ?? 3000),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(','),
  apiKeyHeader: 'x-api-key',
  publicPaths: ['/health', '/v1/catalog'],
}
