import type { Request } from 'express';
import { lookup } from 'geoip-lite';
import * as countries from 'i18n-iso-countries';

import type { SessionMetadata } from '../types/session-metadata.types';

import { IS_DEV_ENV } from './is-dev.util';

import DeviceDetector = require('device-detector-js');

countries.registerLocale(require('i18n-iso-countries/langs/en.json'));

export function getSessionMetadata(
  req: Request,
  userAgent: string,
): SessionMetadata {
  const ip = IS_DEV_ENV
    ? '87.116.190.138'
    : Array.isArray(req.headers['cf-connecting-ip'])
      ? req.headers['cf-connecting-ip'][0]
      : req.headers['cf-connecting-ip'] ||
        (typeof req.headers['x-forwarded-for'] === 'string'
          ? req.headers['x-forwarded-for'].split(',')[0]
          : req.ip);

  const safeIp: string = ip || '0.0.0.0'; // Fallback to valid IP string
  const location = lookup(safeIp);

  const device = new DeviceDetector().parse(userAgent);

  return {
    location: {
      country: location?.country
        ? countries.getName(location.country, 'en') || 'unknown country'
        : 'unknown country',
      city: location?.city || 'unknown city',
      latitude: location?.ll?.[0] || 0,
      longitude: location?.ll?.[1] || 0,
    },
    device: {
      browser: device.client?.name || 'unknown browser',
      os: device.os?.name || 'unknown os',
      type: device.device?.type || 'unknown type',
    },
    ip: safeIp,
  };
}
