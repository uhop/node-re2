declare module 're2' {

  interface RE2BufferExecArray {
    index: number;
    input: Buffer;
    0: Buffer;
    groups?: {
      [key: string]: Buffer
    }
  }

  interface RE2BufferMatchArray {
    index?: number;
    input?: Buffer;
    0: Buffer;
    groups?: {
      [key: string]: Buffer
    }
  }

  interface RE2 extends RegExp {
    exec(str: string): RegExpExecArray | null;
    exec(str: Buffer): RE2BufferExecArray | null;

    match(str: string): RegExpMatchArray | null;
    match(str: Buffer): RE2BufferMatchArray | null;

    test(str: string | Buffer): boolean;

    replace<K extends String | Buffer>(str: K, replaceValue: string | Buffer): K;
    replace<K extends String | Buffer>(str: K, replacer: (substring: string, ...args: any[]) => string | Buffer): K;

    search(str: string | Buffer): number;

    split<K extends String | Buffer>(str: K, limit?: number): K[];
  }

  interface RE2Constructor extends RegExpConstructor {
    new(pattern: Buffer | RegExp | RE2 | string): RE2;
    new(pattern: Buffer | string, flags?: string | Buffer): RE2;
    (pattern: Buffer | RegExp | RE2 | string): RE2;
    (pattern: Buffer | string, flags?: string | Buffer): RE2;
    readonly prototype: RE2;

    unicodeWarningLevel: 'nothing' | 'warnOnce' | 'warn' | 'throw';
    getUtf8Length(value: string): number;
    getUtf16Length(value: Buffer): number;
  }

  var RE2: RE2Constructor;
  export = RE2;
}
