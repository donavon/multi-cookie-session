export interface CookieOptions {
  /** The milliseconds from Date.now() for expiry */
  maxAge?: number;

  /** The cookie's expiration date (expires at the end of session by default).
   * @deprecated
   * @see `maxAge`
   */
  expires?: Date;

  /** The path of the cookie (/ by default). */
  path?: string;

  /** The domain of the cookie (no default). */
  domain?: string;

  /** Whether the cookie is only to be sent over HTTPS (false by default for HTTP, true by default for HTTPS).
   * @see {@link https://www.npmjs.com/package/cookies#secure-cookies secure cookies}
   */
  secure?: boolean;

  /** Whether the cookie is only to be sent over HTTP(S), and not made available to client JavaScript (true by default). */
  httpOnly?: boolean;

  /** A boolean or string indicating whether the cookie is a "same site" cookie (false by default). This can be set to 'strict', 'lax', or true (which maps to 'strict'). */
  sameSite?: boolean | string;

  /** Whether the cookie is to be signed (true by default). If this is true, another cookie of the same name with the .sig suffix appended will also be sent, with a 27-byte url-safe base64 SHA1 value representing the hash of cookie-name=cookie-value against the first Keygrip key. This signature key is used to detect tampering the next time a cookie is received. */
  signed?: boolean;

  /** Whether to overwrite previously set cookies of the same name (false by default). If this is true, all cookies set during the same request with the same name (regardless of path or domain) are filtered out of the Set-Cookie header when setting this cookie. */
  overwrite?: boolean;
}
