# Multi-Cookie Session

A cookie-based session middleware for Express.

- Doesn't have a 4KB size limit.
- Can optionally send encrypted cookies.
- Completely written in TypeScript.

## Why?

Many people use [cookie-session](https://github.com/expressjs/cookie-session) middleware for Express for a simple cookie-based session solution. However, the size of an individual cookie is limited to 4KB in most browsers. If you need larger sessions, you either stand up a backend session data store using [express-session](https://github.com/expressjs/session) — which can be difficult and costly — or you're out of luck. Until now.

`multi-cookie-session` started off as a fork of the `cookie-session`. It has been changed to allow session data to be spread across many cookies, thus eliminating the 4KB per cookie rule.

## Install

```bash
$ npm i multi-cookie-session
```

or

```bash
$ yarn multi-cookie-session
```

## Use

```js
import { multiCookieSession } from 'multi-cookie-session';

const sessionConfig = {
  // Options
};

export const session = app => {
  app.use(multiCookieSession(sessionConfig));
};
```

## API

`multi-cookie-session` is API compatable with `cookie-session` so it's easy and familiar. For a full list, see [cookies session documentation](https://github.com/expressjs/cookie-session/blob/master/README.md).

## TypeScript

You can fully type your session variables. See the following for an example:

```ts
type MySession = {
  foo: string;
  bar: Bar;
  baz: number;
};

// Extend the session data type
declare module 'multi-cookie-session' {
  interface SessionData extends MySession {}
}
```
