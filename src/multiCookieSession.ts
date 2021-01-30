import { IncomingMessage, ServerResponse } from 'http';
import { NextFunction } from 'connect';
import Cookies from 'cookies';
import onHeaders from 'on-headers';
import createDebug from 'debug';

import { SessionOptions } from './SessionOptions.types';
import { Options } from './Options.types';
import { getOptions } from './getOptions';
import { Session } from './Session';

const debug = createDebug('multi-cookie-session');

/** Returns an array of segmented strings no longer than `maxLength` */
const segmentize = (str: string, maxLength: number): string[] => {
  const regex = new RegExp(`.{1,${maxLength}}`, 'g');
  return str.match(regex) ?? [];
};

/** Create a new cookie session middleware. */
export const multiCookieSession = (_options?: Options) => {
  const { encoder, keys, maxSize, ...options } = getOptions(_options);
  const { name } = options;

  debug('session options %j', options);

  return (req: IncomingMessage, res: ServerResponse, next: NextFunction) => {
    const cookies = new Cookies(req, res, { keys });
    let sess: any;
    let segmentCount = 0;

    // Save on Request object
    (req as any).sessionOptions = { ...options };

    /** Try getting a session from a cookie. */
    const tryGetSession = (
      cookies: Cookies,
      name: string,
      getOptions: Cookies.GetOption
    ) => {
      const segments = [];
      while (true) {
        const str = cookies.get(`${name}-${segments.length}`, getOptions);
        if (!str) {
          return undefined; // Oops! Something went wrong. Bail.
        }
        segments.push(str);
        if (str.endsWith('$')) {
          break;
        }
      }

      // We now have one long string build from multiple cookie values.
      // Remove trailing '$' to get a base64 string.
      const base64Value = segments.join('').slice(0, -1);
      segmentCount = segments.length;

      debug('parse %s', base64Value);

      try {
        const sessionJson = encoder.decode(base64Value);
        return Session.deserialize(sessionJson);
      } catch (err) {
        return undefined;
      }
    };

    const getSession = () => {
      // already retrieved
      if (sess) {
        return sess;
      }

      // unset
      if (sess === false) {
        return null;
      }

      // get session
      sess = tryGetSession(
        cookies,
        name,
        (req as any).sessionOptions as SessionOptions
      );
      if (sess) {
        return sess;
      }

      // create session
      debug('new session');
      sess = Session.create();
      return sess;
    };

    const setSession = (val: any) => {
      if (val === null) {
        // unset session
        sess = false;
        return val;
      }

      if (typeof val === 'object') {
        // create a new session
        sess = Session.create(val);
        return sess;
      }

      throw new Error('req.session can only be set as null or an object.');
    };

    // define req.session getter / setter
    Object.defineProperty(req, 'session', {
      configurable: true,
      enumerable: true,
      get: getSession,
      set: setSession,
    });

    /** Serialize session keys or remove session keys. */
    onHeaders(res, () => {
      // not accessed so do nothing
      if (sess === undefined) {
        return; // NOTE should this call next?
      }

      try {
        const options = (req as any).sessionOptions as SessionOptions;
        // If we pass `options.name` to cookies.set it will override the actual name parameter :facepalm:
        const { name: _name, ...setOptions } = options;

        if (sess === false) {
          // remove
          // const cookieObj = getSessionCookies(res, name);
          // debug(cookieObj);

          // NOTE this will force a read on session cookies, thus setting segmentCount
          // not very effecient
          sess = undefined;
          getSession();
          debug('remove %s (%d cookies)', name, segmentCount);

          // Delete all cookies by sending an expired date.
          for (let index = 0; index < segmentCount; index++) {
            debug('removing cookie %s', `${name}-${index}`);
            cookies.set(`${name}-${index}`, undefined, setOptions);
          }
        } else if ((!sess.isNew || sess.isPopulated) && sess.isChanged) {
          // save populated or non-new changed session
          debug('save %s %s', name, segmentCount);

          const json = Session.serialize(sess);
          const sessEncoded = encoder.encode(json);

          const segments = segmentize(sessEncoded, maxSize);
          // augment last segment by appending a '$'
          segments[segments.length - 1] = `${segments[segments.length - 1]}$`;

          segments.forEach((segment, index) => {
            const cookieName = `${name}-${index}`;
            debug('save cookie %s = %s', cookieName, segment);
            cookies.set(cookieName, segment, setOptions);
          });

          // remove any remaining cookies. this might happen if the session shrinks
          for (let index = segments.length; index < segmentCount; index++) {
            cookies.set(`${name}-${index}`, undefined, setOptions);
          }
        }
      } catch (e) {
        debug('error saving session %s', e.message);
      }
    });

    next();
  };
};
