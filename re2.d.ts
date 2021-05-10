declare module 're2' {

  interface RE2MatchArray<K> extends Array<K> {
    index?: number;
    input?: K;
  }

  interface RE2ExecArray<K> extends Array<K> {
    index: number;
    input: K;
  }

  interface RE2 extends RegExp {
    exec<K extends String | Buffer>(str: K): RE2ExecArray<K> | null;

    test(str: string | Buffer): boolean;

    match<K extends String | Buffer>(str: K): RE2MatchArray<K> | null;

    replace<K extends String | Buffer>(str: K, replaceValue: string | Buffer): K;
    replace<K extends String | Buffer>(str: K, replacer: (substring: string, ...args: any[]) => string | Buffer): K;

    search(str: string | Buffer): number;

    split<K extends String | Buffer>(str: K, limit?: number): K[];
  }

  interface RE2Constructor extends RegExpConstructor {
    new(pattern: Buffer | RegExp | string): RE2;
    new(pattern: Buffer | string, flags?: string): RE2;
    (pattern: Buffer | RegExp | string): RE2;
    (pattern: Buffer | string, flags?: string): RE2;
    readonly prototype: RE2;

    unicodeWarningLevel: 'nothing' | 'warnOnce' | 'warn' | 'throw';
    getUtf8Length(value: string): number;
    getUtf16Length(value: Buffer): number;
  }

  var RE2: RE2Constructor;
  export = RE2;
}
