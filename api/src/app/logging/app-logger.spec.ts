import { ConsoleLogger } from '@nestjs/common';
import { createAppLogger } from './app-logger';

describe('createAppLogger', () => {
  it('returns undefined outside production so Nest keeps the pretty default', () => {
    expect(createAppLogger({})).toBeUndefined();
    expect(createAppLogger({ NODE_ENV: 'development' })).toBeUndefined();
    expect(createAppLogger({ NODE_ENV: 'test' })).toBeUndefined();
  });

  it('emits single-line JSON entries in production', () => {
    const logger = createAppLogger({ NODE_ENV: 'production' });
    expect(logger).toBeInstanceOf(ConsoleLogger);

    const write = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    try {
      logger?.log('hello', 'Ctx');
      expect(write).toHaveBeenCalledTimes(1);
      const line = write.mock.calls[0][0] as string;
      expect(line.trimEnd()).not.toContain('\n');
      expect(JSON.parse(line)).toMatchObject({
        level: 'log',
        message: 'hello',
        context: 'Ctx',
      });
    } finally {
      write.mockRestore();
    }
  });
});
