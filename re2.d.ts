/// <reference types="node" />

declare module 're2' {
  type RE2BinaryInput =
    Buffer | ArrayBufferView | ArrayBuffer | SharedArrayBuffer;

  interface RE2BufferExecArray<T extends RE2BinaryInput = Buffer> {
    index: number;
    input: T;
    0: Buffer;
    groups?: {
      [key: string]: Buffer;
    };
    indices?: RegExpIndicesArray;
  }

  interface RE2BufferMatchArray<T extends RE2BinaryInput = Buffer> {
    index?: number;
    input?: T;
    0: Buffer;
    groups?: {
      [key: string]: Buffer;
    };
  }

  interface RE2 extends RegExp {
    readonly internalSource: string;
    exec(str: string): RegExpExecArray | null;
    exec<T extends RE2BinaryInput>(str: T): RE2BufferExecArray<T> | null;

    match(str: string): RegExpMatchArray | null;
    match<T extends RE2BinaryInput>(str: T): RE2BufferMatchArray<T> | null;

    test(str: string | RE2BinaryInput): boolean;

    replace(str: string, replaceValue: string | RE2BinaryInput): string;
    replace(str: RE2BinaryInput, replaceValue: string | RE2BinaryInput): Buffer;
    replace(
      str: string,
      replacer: (substring: string, ...args: any[]) => string | RE2BinaryInput
    ): string;
    replace(
      str: RE2BinaryInput,
      replacer: (substring: string, ...args: any[]) => string | RE2BinaryInput
    ): Buffer;

    search(str: string | RE2BinaryInput): number;

    split(str: string, limit?: number): string[];
    split(str: RE2BinaryInput, limit?: number): Buffer[];
  }

  interface RE2SetOptions {
    anchor?: 'unanchored' | 'start' | 'both';
    maxMem?: number;
  }

  interface RE2Set {
    readonly size: number;
    readonly source: string;
    readonly sources: string[];
    readonly flags: string;
    readonly anchor: 'unanchored' | 'start' | 'both';
    readonly maxMem: number;

    match(str: string | RE2BinaryInput): number[];
    test(str: string | RE2BinaryInput): boolean;
    toString(): string;
  }

  interface RE2SetConstructor {
    new (
      patterns: Iterable<RE2BinaryInput | RegExp | RE2 | string>,
      flagsOrOptions?: string | RE2BinaryInput | RE2SetOptions,
      options?: RE2SetOptions
    ): RE2Set;
    (
      patterns: Iterable<RE2BinaryInput | RegExp | RE2 | string>,
      flagsOrOptions?: string | RE2BinaryInput | RE2SetOptions,
      options?: RE2SetOptions
    ): RE2Set;
    readonly prototype: RE2Set;
  }

  interface RE2Constructor extends RegExpConstructor {
    new (pattern: RE2BinaryInput | RegExp | RE2 | string): RE2;
    new (
      pattern: RE2BinaryInput | string,
      flags?: string | RE2BinaryInput
    ): RE2;
    (pattern: RE2BinaryInput | RegExp | RE2 | string): RE2;
    (pattern: RE2BinaryInput | string, flags?: string | RE2BinaryInput): RE2;
    readonly prototype: RE2;

    unicodeWarningLevel: 'nothing' | 'warnOnce' | 'warn' | 'throw';
    getUtf8Length(value: string): number;
    getUtf16Length(value: RE2BinaryInput): number;

    Set: RE2SetConstructor;
    RE2: RE2Constructor;
  }

  var RE2: RE2Constructor;
  export = RE2;
}
