import { multiCookieSession } from '../src';
import { Options } from '../src/Options.types';

import connect, { IncomingMessage } from 'connect';
import request from 'supertest';

const encodeBase64 = (value: any) => {
  const json = JSON.stringify(value);
  return Buffer.from(json).toString('base64') + '$';
};

const assert = {
  ok: (value: any, message: string) => {
    if (!value) {
      throw new Error(message);
    }
  },
  strictEqual: (value1: any, value2: any, message?: string) => {
    if (value1 !== value2) {
      throw new Error(message || `${value1} !== ${value2}`);
    }
  },
};

describe('Cookie Session', () => {
  describe('"httpOnly" option', () => {
    it('should default to "true"', done => {
      const app = App();
      app.use(function(req: any, res, next) {
        (req as any).session.message = 'hi';
        res.end(String((req as any).sessionOptions.httpOnly));
      });

      const encoded = encodeBase64({ message: 'hi' });

      request(app)
        .get('/')
        .expect(shouldHaveCookieWithValue('session-0', encoded))
        .expect(shouldHaveCookieWithParameter('session-0', 'httpOnly'))
        .expect(200, 'true', done);
    });

    it('should use given "false"', done => {
      var app = App({ httpOnly: false });
      app.use(function(req, res, next) {
        (req as any).session.message = 'hi';
        res.end(String((req as any).sessionOptions.httpOnly));
      });

      request(app)
        .get('/')
        .expect(shouldHaveCookieWithoutParameter('session-0', 'httpOnly'))
        .expect(200, 'false', done);
    });
  });

  describe('"overwrite" option', () => {
    it('should default to "true"', done => {
      var app = App();
      app.use(function(req, res, next) {
        res.setHeader('Set-Cookie', [
          'session-0=eyJtZXNzYWdlIjoieW8ifQ==$; path=/fake', // "yo"
          'foo=bar',
        ]);
        (req as any).session.message = 'hi';
        res.end(String((req as any).sessionOptions.overwrite));
      });

      request(app)
        .get('/')
        .expect(shouldHaveCookieWithValue('foo', 'bar'))
        .expect(
          shouldHaveCookieWithValue('session-0', 'eyJtZXNzYWdlIjoiaGkifQ==$')
        )
        .expect(200, 'true', done);
    });

    it('should use given "false"', done => {
      var app = App({ overwrite: false });
      app.use(function(req, res, next) {
        res.setHeader('Set-Cookie', ['session=foo; path=/fake', 'foo=bar']);
        (req as any).session.message = 'hi';
        res.end(String((req as any).sessionOptions.overwrite));
      });

      request(app)
        .get('/')
        .expect(shouldHaveCookieWithValue('foo', 'bar'))
        .expect('Set-Cookie', /session=foo/)
        .expect(200, 'false', done);
    });
  });

  describe('when options.name = my.session', () => {
    it('should use my.session for cookie name', done => {
      var app = App({ name: 'my.session' });
      app.use(function(req, res, next) {
        (req as any).session.message = 'hi';
        res.end();
      });

      request(app)
        .get('/')
        .expect(shouldHaveCookie('my.session-0'))
        .expect(200, done);
    });
  });

  describe('when options.signed = true', () => {
    describe('when options.keys are set', () => {
      it('should work', done => {
        var app = connect();
        app.use(
          multiCookieSession({
            keys: ['a', 'b'],
          })
        );
        app.use(function(req, res, next) {
          (req as any).session.message = 'hi';
          res.end();
        });

        request(app)
          .get('/')
          .expect(200, '', done);
      });
    });

    describe('when options.secret is set', () => {
      it('should work', done => {
        var app = connect();
        app.use(
          multiCookieSession({
            secret: 'a',
          })
        );
        app.use(function(req, res, next) {
          (req as any).session.message = 'hi';
          res.end();
        });

        request(app)
          .get('/')
          .expect(200, '', done);
      });
    });

    describe('when options.keys are not set', () => {
      it('should throw', () => {
        expect(() => {
          multiCookieSession();
        }).toThrowError('');
      });
    });
  });

  describe('when options.signed = false', () => {
    describe('when app.keys are not set', () => {
      it('should work', done => {
        var app = connect();
        app.use(
          multiCookieSession({
            signed: false,
          })
        );
        app.use(function(req, res, next) {
          (req as any).session.message = 'hi';
          res.end();
        });

        request(app)
          .get('/')
          .expect(200, done);
      });
    });
  });

  describe('when options.secure = true', () => {
    describe('when connection not secured', () => {
      it('should not Set-Cookie', done => {
        var app = App({ secure: true });
        app.use(function(req, res, next) {
          process.nextTick(() => {
            (req as any).session.message = 'hello!';
            res.end('greetings');
          });
        });

        request(app)
          .get('/')
          .expect(shouldNotSetCookies())
          .expect(200, done);
      });
    });
  });

  describe('when the session contains a ;', () => {
    it('should still work', done => {
      var app = App();
      app.use(function(req, res, next) {
        if ((req as any).method === 'POST') {
          (req as any).session.string = ';';
          res.statusCode = 204;
          res.end();
        } else {
          res.end((req as any).session.string);
        }
      });

      request(app)
        .post('/')
        .expect(shouldHaveCookie('session-0'))
        .expect(shouldHaveCookieWithValue('session-0', 'eyJzdHJpbmciOiI7In0=$'))
        .expect(204, (err, res: any) => {
          if (err) return done(err);
          request(app)
            .get('/')
            .set('Cookie', cookieHeader(cookies(res)))
            .expect(';', done);
        });
    });
  });

  describe('when the session is invalid', () => {
    it('should create new session', done => {
      var app = App({ name: 'my.session', signed: false });
      app.use(function(req, res, next) {
        if ((req as any).method === 'POST') {
          (req as any).session.string = 'foo';
          res.statusCode = 204;
          res.end();
        } else {
          res.end(String((req as any).session.isNew));
          // res.end((req as any).session.string);
        }
      });

      request(app)
        .post('/')
        .expect(shouldHaveCookie('my.session-0'))
        .expect(204, (err, res: any) => {
          if (err) return done(err);
          request(app)
            .get('/')
            .set('Cookie', 'my.session-0x=bogus')
            .expect(200, 'true', done);
        });
    });
  });

  describe('when the session not new', () => {
    it('isNew should return false', done => {
      var app = App({ name: 'my.session', signed: false });
      app.use(function(req, res, next) {
        if ((req as any).method === 'POST') {
          (req as any).session.string = 'foo';
          res.statusCode = 204;
          res.end();
        } else {
          res.end(String((req as any).session.isNew));
        }
      });

      request(app)
        .post('/')
        .expect(shouldHaveCookie('my.session-0'))
        .expect(204, (err, res: any) => {
          if (err) return done(err);
          request(app)
            .get('/')
            .set('Cookie', cookieHeader(cookies(res)))
            .expect(200, 'false', done);
        });
    });
  });

  describe('new session', () => {
    describe('when not accessed', () => {
      it('should not Set-Cookie', done => {
        var app = App();
        app.use(function(req, res, next) {
          res.end('greetings');
        });

        request(app)
          .get('/')
          .expect(shouldNotSetCookies())
          .expect(200, done);
      });
    });

    describe('when accessed and not populated', () => {
      it('should not Set-Cookie', done => {
        var app = App();
        app.use(function(req, res, next) {
          var sess = (req as any).session;
          res.end(JSON.stringify(sess));
        });

        request(app)
          .get('/')
          .expect(shouldNotSetCookies())
          .expect(200, done);
      });
    });

    describe('when populated', () => {
      it('should Set-Cookie', done => {
        var app = App();
        app.use(function(req, res, next) {
          (req as any).session.message = 'hello';
          res.end();
        });

        request(app)
          .get('/')
          .expect(shouldHaveCookie('session-0'))
          .expect(200, done);
      });
    });
  });

  describe('saved session', () => {
    var cookie: any;

    beforeEach(done => {
      var app = App();
      app.use(function(req, res, next) {
        (req as any).session.message = 'hello';
        res.end();
      });

      request(app)
        .get('/')
        .expect(shouldHaveCookie('session-0'))
        .expect(200, function(err, res: any) {
          if (err) return done(err);
          cookie = cookieHeader(cookies(res));
          done();
        });
    });

    describe('when not accessed', () => {
      it('should not Set-Cookie', done => {
        var app = App();
        app.use(function(req, res, next) {
          res.end('aklsjdfklasjdf');
        });

        request(app)
          .get('/')
          .set('Cookie', cookie)
          .expect(shouldNotSetCookies())
          .expect(200, done);
      });
    });

    describe('when accessed but not changed', () => {
      it('should be the same session', done => {
        var app = App();
        app.use(function(req, res, next) {
          assert.strictEqual((req as any).session.message, 'hello');
          res.end('aklsjdfkljasdf');
        });

        request(app)
          .get('/')
          .set('Cookie', cookie)
          .expect(200, done);
      });

      it('should not Set-Cookie', done => {
        var app = App();
        app.use(function(req, res, next) {
          assert.strictEqual((req as any).session.message, 'hello');
          res.end('aklsjdfkljasdf');
        });

        request(app)
          .get('/')
          .set('Cookie', cookie)
          .expect(shouldNotSetCookies())
          .expect(200, done);
      });
    });

    describe('when accessed and changed', () => {
      it('should Set-Cookie', done => {
        var app = App();
        app.use(function(req, res, next) {
          (req as any).session.money = '$$$';
          res.end('klajsdlkfjadsf');
        });

        const sessionObj = { message: 'hello', money: '$$$' };
        const encoded = encodeBase64(sessionObj);

        request(app)
          .get('/')
          .set('Cookie', cookie)
          .expect(shouldHaveCookieWithValue('session-0', encoded))
          .expect(shouldHaveCookie('session-0'))
          .expect(200, done);
      });
    });
  });

  describe('when session = ', () => {
    describe('null', () => {
      it('should expire the session', done => {
        var app = App();
        app.use(function(req, res, next) {
          (req as any).session = null;
          res.end('lkajsdf');
        });

        request(app)
          .get('/')
          .expect(shouldNotSetCookies())
          .expect(200, done);
      });

      it('should no longer return a session', done => {
        var app = App();
        app.use(function(req, res, next) {
          (req as any).session = null;
          res.end(JSON.stringify((req as any).session));
        });

        request(app)
          .get('/')
          .expect(shouldNotSetCookies())
          .expect(200, 'null', done);
      });
    });

    describe('an empty object', () => {
      it('should not Set-Cookie', done => {
        var app = App();
        app.use(function(req, res, next) {
          (req as any).session = {};
          res.end('hello, world');
        });

        request(app)
          .get('/')
          .expect(shouldNotSetCookies())
          .expect(200, 'hello, world', done);
      });
    });

    describe('an object', () => {
      it('should create a session', done => {
        var app = App();
        app.use(function(req, res, next) {
          (req as any).session = { message: 'hello' };
          res.end('klajsdfasdf');
        });

        request(app)
          .get('/')
          .expect(
            shouldHaveCookieWithValue(
              'session-0',
              'eyJtZXNzYWdlIjoiaGVsbG8ifQ==$'
            )
          )
          .expect(200, done);
      });
    });

    describe('anything else', () => {
      it('should throw', done => {
        var app = App();
        app.use(function(req, res, next) {
          (req as any).session = 'aklsdjfasdf';
        });

        request(app)
          .get('/')
          .expect(500, done);
      });
    });
  });

  describe('req.session.isPopulated', () => {
    it('should be false on new session', done => {
      var app = App();
      app.use(function(req, res, next) {
        res.end(String((req as any).session.isPopulated));
      });

      request(app)
        .get('/')
        .expect(200, 'false', done);
    });

    it('should be true after adding property', done => {
      var app = App();
      app.use(function(req, res, next) {
        (req as any).session.message = 'hello!';
        res.end(String((req as any).session.isPopulated));
      });

      request(app)
        .get('/')
        .expect(200, 'true', done);
    });
  });

  describe('req.sessionOptions', () => {
    it('should be the session options', done => {
      var app = App({ name: 'my.session' });
      app.use(function(req, res, next) {
        const options = (req as any).sessionOptions;
        res.end(JSON.stringify(options));
      });

      const resp = JSON.stringify({
        name: 'my.session',
        overwrite: true,
        httpOnly: true,
        signed: true,
        secure: false,
      });

      request(app)
        .get('/')
        .expect(200, resp, done);
    });

    it('should alter the cookie setting', done => {
      var app = App({ maxAge: 3600000, name: 'my.session' });
      app.use(function(req, res, next) {
        if ((req as any).url === '/max') {
          (req as any).sessionOptions.maxAge = 6500000;
        }

        (req as any).session.message = 'hello!';
        res.end();
      });

      request(app)
        .get('/')
        .expect(shouldHaveCookieWithTTLBetween('my.session-0', 0, 3600000))
        .expect(200, function(err) {
          if (err) return done(err);
          request(app)
            .get('/max')
            .expect(
              shouldHaveCookieWithTTLBetween('my.session-0', 5000000, Infinity)
            )
            .expect(200, done);
        });
    });
  });
});

describe('Multi-Cookie Session', () => {
  describe('if session payload > maxLength', () => {
    it('should send multiple cookies', done => {
      const app = App({ maxSize: 15 });
      app.use(function(req: any, res, next) {
        (req as any).session.a = '12345';
        res.end(String((req as any).sessionOptions.maxSize));
      });

      const encoded = encodeBase64({ a: '12345' });

      request(app)
        .get('/')
        .expect(shouldHaveCookieWithValue('session-0', encoded.substr(0, 15)))
        .expect(shouldHaveCookieWithValue('session-1', encoded.substr(15)))
        .expect(200, done);
    });

    it('should read multiple cookies', done => {
      const app = App({ maxSize: 15 });
      app.use(function(req, res, next) {
        if ((req as any).method === 'POST') {
          (req as any).session.a = '12345';
          res.statusCode = 204;
          res.end();
        } else {
          res.end((req as any).session.a);
        }
      });

      request(app)
        .post('/')
        .expect(204, (err, res: any) => {
          if (err) return done(err);
          request(app)
            .get('/')
            .set('Cookie', cookieHeader(cookies(res)))
            .expect('12345', done);
        });
    });

    it('should delete extra cookies if session shrinks', done => {
      const app = App({ maxSize: 15 });
      app.use(function(req, res, next) {
        if ((req as any).method === 'POST') {
          (req as any).session.a = '12345';
          res.statusCode = 204;
          res.end();
        } else {
          (req as any).session.a = '';
          res.end((req as any).session.a);
        }
      });

      request(app)
        .post('/')
        .expect(shouldHaveCookieWithValue('session-0', 'eyJhIjoiMTIzNDU'))
        .expect(shouldHaveCookieWithValue('session-1', 'ifQ==$'))
        .expect(204, (err, res: any) => {
          if (err) return done(err);
          request(app)
            .get('/')
            .set('Cookie', cookieHeader(cookies(res)))
            .expect(shouldHaveCookieWithValue('session-0', 'eyJhIjoiIn0=$'))
            .expect(shouldHaveCookieWithTTLBetween('session-1', -Infinity, 0))
            .expect('', done);
        });
    });

    it('should delete all cookies if session set to false', done => {
      const app = App({ maxSize: 15 });
      app.use(function(req, res, next) {
        if ((req as any).method === 'POST') {
          (req as any).session.a = '12345';
          res.statusCode = 204;
          res.end();
        } else {
          (req as any).session = null;
          res.end();
        }
      });

      request(app)
        .post('/')
        .expect(shouldHaveCookieWithValue('session-0', 'eyJhIjoiMTIzNDU'))
        .expect(shouldHaveCookieWithValue('session-1', 'ifQ==$'))
        .expect(204, (err, res: any) => {
          if (err) return done(err);
          request(app)
            .get('/')
            .set('Cookie', cookieHeader(cookies(res)))
            .expect(shouldHaveCookieWithTTLBetween('session-0', -Infinity, 0))
            .expect(shouldHaveCookieWithTTLBetween('session-1', -Infinity, 0))
            .expect(200, done);
        });
    });
  });
});

function App(options: Options = {}) {
  options.keys = ['a', 'b'];
  var app = connect();
  app.use(multiCookieSession(options));
  return app;
}

function cookieHeader(cookies: any) {
  return Object.keys(cookies)
    .map(function(name) {
      return `${name}=${cookies[name].value}`;
    })
    .join('; ');
}

function cookies(res: IncomingMessage) {
  var headers = res.headers['set-cookie'] || [];
  var obj = Object.create(null);

  for (var i = 0; i < headers.length; i++) {
    var params = Object.create(null);
    var parts = headers[i].split(';');
    var nvp = parts[0].split('=');

    for (var j = 1; j < parts.length; j++) {
      var pvp = parts[j].split('=');

      params[pvp[0].trim().toLowerCase()] = pvp[1] ? pvp[1].trim() : true;
    }

    var ttl = params.expires
      ? Date.parse(params.expires) - Date.parse((res.headers as any).date)
      : null;

    obj[nvp[0].trim()] = {
      value: nvp
        .slice(1)
        .join('=')
        .trim(),
      params: params,
      ttl: ttl,
    };
  }

  return obj;
}

// function logCookies() {
//   return function(res: any) {
//     console.log(cookies(res));
//   };
// }

function shouldHaveCookie(name: any) {
  return function(res: any) {
    assert.ok(name in cookies(res), 'should have cookie "' + name + '"');
  };
}

function shouldHaveCookieWithParameter(name: string, param: any) {
  return function(res: any) {
    assert.ok(name in cookies(res), 'should have cookie "' + name + '"');
    assert.ok(
      param.toLowerCase() in cookies(res)[name].params,
      'should have parameter "' + param + '"'
    );
  };
}

function shouldHaveCookieWithoutParameter(name: any, param: any) {
  return (res: any) => {
    assert.ok(name in cookies(res), 'should have cookie "' + name + '"');
    assert.ok(
      !(param.toLowerCase() in cookies(res)[name].params),
      'should not have parameter "' + param + '"'
    );
  };
}

function shouldHaveCookieWithTTLBetween(name: string, low: any, high: any) {
  return (res: any) => {
    assert.ok(name in cookies(res), 'should have cookie "' + name + '"');
    assert.ok(
      'expires' in cookies(res)[name].params,
      'should have parameter "expires"'
    );
    assert.ok(
      cookies(res)[name].ttl >= low && cookies(res)[name].ttl <= high,
      'should have TTL between ' + low + ' and ' + high
    );
  };
}

function shouldHaveCookieWithValue(name: string, value: any) {
  return (res: any) => {
    assert.ok(name in cookies(res), 'should have cookie "' + name + '"');
    assert.strictEqual(cookies(res)[name].value, value);
  };
}

function shouldNotSetCookies() {
  return (res: any) => {
    assert.strictEqual(
      res.headers['set-cookie'],
      undefined,
      'should not set cookies'
    );
  };
}
