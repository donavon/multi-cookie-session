import * as base64 from '../src/base64';

describe('base64', () => {
  it(`"123" should encode to "MTIz"`, () => {
    const result = base64.encode('123');
    expect(result).toBe('MTIz');
  });

  it(`decode reversed encode`, () => {
    const encoded = base64.encode('123');
    const result = base64.decode(encoded);
    expect(result).toBe('123');
  });
});
