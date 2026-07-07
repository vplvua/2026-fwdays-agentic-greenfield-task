import { HttpException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  const prismaMock = { $queryRaw: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prismaMock }],
    }).compile();
    controller = module.get(HealthController);
  });

  it('returns ok/up when the DB responds', async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ '1': 1 }]);
    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      db: 'up',
    });
  });

  it('throws 503 with error/down when the DB is unreachable', async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error('connection refused'));
    const failure = controller.check();
    await expect(failure).rejects.toBeInstanceOf(HttpException);
    await failure.catch((e: HttpException) => {
      expect(e.getStatus()).toBe(503);
      expect(e.getResponse()).toEqual({ status: 'error', db: 'down' });
    });
  });
});
