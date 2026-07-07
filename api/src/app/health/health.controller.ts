import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// GET /api/health (NFR-OBS-01): Railway healthcheck target. An app that
// cannot reach MySQL is not serving the product, hence 503 (design D3).
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<{ status: string; db: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'up' };
    } catch (err) {
      this.logger.warn(`DB healthcheck failed: ${String(err)}`);
      throw new HttpException(
        { status: 'error', db: 'down' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
