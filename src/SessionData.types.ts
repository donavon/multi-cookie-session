import { SessionOptions } from './SessionOptions.types';

export interface SessionData {}

declare global {
  namespace Express {
    // Inject additional properties on express.Request
    interface Request {
      /**
       * This request's `Session` object.
       * Even though this property isn't marked as optional, it won't exist until you use the `multiple-cooke-session` middleware
       * [Declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) can be used to add your own properties.
       *
       * @see SessionData
       */
      session: Partial<SessionData>;
      sessionOptions: SessionOptions;
    }
  }
}
