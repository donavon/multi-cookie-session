import { Options } from './Options.types';
import { SessionOptions } from './SessionOptions.types';
import * as base64 from './base64';

const computeKeys = (signed: boolean, secret?: string) => {
  if (signed) {
    if (secret) {
      return [secret];
    }
    throw new Error(
      'options.keys or object.secret is required when option.signed is true'
    );
  }
  return undefined;
};

export const getOptions = (options: Options = {}) => {
  const {
    name = 'session',
    maxSize = 4000,
    overwrite = true,
    httpOnly = true,
    signed = true,
    secret,
    keys = computeKeys(signed, secret),
    secure = false,
    encoder = base64,
    ...rest
  } = options;

  const sessionOptions: SessionOptions = {
    ...rest,
    name,
    maxSize,
    overwrite,
    httpOnly,
    signed,
    keys,
    secure,
    encoder,
  };

  return sessionOptions;
};
