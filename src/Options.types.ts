import Keygrip from 'keygrip';
import { CookieOptions } from './CookieOptions.types';

export interface Encoder {
  /** Takes a JSON string and returns base64 encoded string. */
  encode: (value: string) => string;

  /** Takes a base64 encoded string and returns JSON string. */
  decode: (value: string) => string;
}

export interface Options extends CookieOptions {
  /** Name of the cookie prefix to use (default="session"). This will result in cookies names "session-1", "session-2", etc */
  name?: string;

  /** A long string that will be used to sign a secure cookie. */
  secret?: string;

  /** A `Keygrip` object or an array of keys to enable cryptographic signing based on SHA1 HMAC, using rotated credentials.
   * @see https://www.npmjs.com/package/keygrip
   */
  keys?: string[] | Keygrip;

  /** The maximun size of each cookie value (default=4000). Note that most browsers have a maximum cookie size of around 4096 which includes all cookie attributes. */
  maxSize?: number;

  /** An optional object containing an `encode` and `decode` function convert to/from a JSON stringified session object to a base64 string.
   * You can use this to add a customer endoder, possibly to enctypt and cookie contents to keep it a secret.
   */
  encoder?: Encoder;
}
