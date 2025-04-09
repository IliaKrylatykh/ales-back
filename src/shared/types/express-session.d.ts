import 'express-session';

import type { SessionMetadata } from './session-metadata.types';

declare module 'express-session' {
  interface SessionData {
    id?: string;
    userId?: string;
    createdAt?: Date | string;
    metadata: SessionMetadata;
  }
}
