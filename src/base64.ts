/** Decode the base64 cookie value to an object. */
export const decode = (encoded: string) => {
  return Buffer.from(encoded, 'base64').toString('utf8');
};

export const encode = (value: string) => {
  return Buffer.from(value).toString('base64');
};
