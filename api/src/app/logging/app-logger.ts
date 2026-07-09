import { ConsoleLogger } from '@nestjs/common';

// Structured logs in production (NFR-OBS-01): with json enabled every Logger
// call site — request lines, the exceptions handler, SMS senders — emits
// single-line JSON for Railway. Outside production the factory returns
// undefined and NestFactory keeps the default human-readable logger.
export function createAppLogger(
  env: NodeJS.ProcessEnv,
): ConsoleLogger | undefined {
  return env.NODE_ENV === 'production'
    ? new ConsoleLogger({ json: true })
    : undefined;
}
