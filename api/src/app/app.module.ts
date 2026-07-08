import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { SpaModule } from './spa/spa.module';

@Module({
  imports: [PrismaModule, AuthModule, HealthModule, SpaModule.forRoot()],
})
export class AppModule {}
