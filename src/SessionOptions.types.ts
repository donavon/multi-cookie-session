import Keygrip from 'keygrip';
import { Encoder } from './Options.types';

export type SessionOptions = {
  name: string;
  httpOnly: boolean;
  keys?: string[] | Keygrip;
  overwrite: boolean;
  signed: boolean;
  secure: boolean;
  maxAge?: number;
  maxSize: number;
  encoder: Encoder;
};
