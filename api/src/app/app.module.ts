import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { SpaModule } from './spa/spa.module';

@Module({
  imports: [PrismaModule, HealthModule, SpaModule.forRoot()],
})
export class AppModule {}
