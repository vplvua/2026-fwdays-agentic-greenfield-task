import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { HousesModule } from './houses/houses.module';
import { PrismaModule } from './prisma/prisma.module';
import { SpaModule } from './spa/spa.module';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    HealthModule,
    HousesModule,
    TicketsModule,
    SpaModule.forRoot(),
  ],
})
export class AppModule {}
