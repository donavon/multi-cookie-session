type KeyValue<T = any> = { [key: string]: T };

type Context = {
  _new: boolean;
  _val?: string;
};

/** Create session context to store metadata. */
const createSessionContext = (json?: string): Context => ({
  _new: !json,
  _val: json,
});

/**
 * Session model.
 *
 * @param {Context} ctx
 * @param {Object} obj
 * @private
 */

export class Session {
  private _ctx: Context;

  constructor(ctx: Context, obj: KeyValue | undefined) {
    this._ctx = ctx;

    if (obj) {
      for (let key in obj) {
        (this as any)[key] = obj[key]; // TODO fix this any :(
      }
    }
  }

  /** Create new session. */
  static create(obj?: KeyValue) {
    const ctx = createSessionContext();
    return new Session(ctx, obj);
  }

  /** Create session from serialized form. */
  static deserialize(json: string) {
    var ctx = createSessionContext(json);
    const obj = JSON.parse(json);
    return new Session(ctx, obj);
  }

  /** Serialize a session into a JSON string. */
  static serialize(sess: Session) {
    const { _ctx, ...rest } = sess;
    const json = JSON.stringify(rest);
    return json;
  }

  /** Return true if the session is changed for this request. */
  get isChanged() {
    return this._ctx._new || this._ctx._val !== Session.serialize(this);
  }

  /** Return true if the session is new for this request. */
  get isNew() {
    return this._ctx._new;
  }

  /** Return true if there are session keys. */
  get isPopulated() {
    return Object.keys(this).length > 1; // don't count _ctx. TODO redesign
  }
}
