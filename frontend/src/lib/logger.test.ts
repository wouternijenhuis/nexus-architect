import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLogger } from './logger';
import type { Logger } from './logger';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('createLogger', () => {
  it('should create a logger with all four methods', () => {
    const log = createLogger('debug');
    expect(typeof log.debug).toBe('function');
    expect(typeof log.info).toBe('function');
    expect(typeof log.warn).toBe('function');
    expect(typeof log.error).toBe('function');
  });
});

describe('log output', () => {
  it('should emit structured JSON with timestamp and level', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const log = createLogger('debug');

    log.info('hello world');

    expect(spy).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(spy.mock.calls[0][0]);
    expect(entry.level).toBe('info');
    expect(entry.message).toBe('hello world');
    expect(entry.timestamp).toBeDefined();
  });

  it('should include context when provided', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const log = createLogger('debug');

    log.warn('disk full', { disk: '/dev/sda1', usage: 99 });

    const entry = JSON.parse(spy.mock.calls[0][0]);
    expect(entry.context).toEqual({ disk: '/dev/sda1', usage: 99 });
  });

  it('should not include context key when none provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const log = createLogger('debug');

    log.error('oops');

    const entry = JSON.parse(spy.mock.calls[0][0]);
    expect(entry.context).toBeUndefined();
  });
});

describe('log levels', () => {
  let log: Logger;

  it('should suppress debug when minLevel is info', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    log = createLogger('info');
    log.debug('hidden');
    log.info('visible');

    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledTimes(1);
  });

  it('should suppress debug and info when minLevel is warn', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    log = createLogger('warn');
    log.debug('hidden');
    log.info('hidden');
    log.warn('visible');

    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('should only allow error when minLevel is error', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    log = createLogger('error');
    log.warn('hidden');
    log.error('visible');

    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('should allow all levels when minLevel is debug', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    log = createLogger('debug');
    log.debug('d');
    log.info('i');
    log.warn('w');
    log.error('e');

    expect(debugSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
