import RE2 from 're2';

function assertType<T>(_val: T) {}

function test_constructors() {
  const re1 = new RE2('abc');
  const re2 = new RE2('abc', 'gi');
  const re3 = new RE2(Buffer.from('abc'));
  const re4 = new RE2(Buffer.from('abc'), 'i');
  const re5 = new RE2(/abc/i);
  const re6 = new RE2(re1);
  const re7 = RE2('abc');
  const re8 = RE2('abc', 'gi');
  const re9 = RE2(Buffer.from('abc'));
  const re10 = RE2(/abc/i);
  assertType<RE2>(re1);
  assertType<RE2>(re2);
  assertType<RE2>(re3);
  assertType<RE2>(re4);
  assertType<RE2>(re5);
  assertType<RE2>(re6);
  assertType<RE2>(re7);
  assertType<RE2>(re8);
  assertType<RE2>(re9);
  assertType<RE2>(re10);
}

function test_properties() {
  const re = new RE2('abc', 'dgimsuy');
  assertType<string>(re.source);
  assertType<string>(re.flags);
  assertType<boolean>(re.global);
  assertType<boolean>(re.ignoreCase);
  assertType<boolean>(re.multiline);
  assertType<boolean>(re.dotAll);
  assertType<boolean>(re.unicode);
  assertType<boolean>(re.sticky);
  assertType<boolean>(re.hasIndices);
  assertType<number>(re.lastIndex);
  assertType<string>(re.internalSource);
  re.lastIndex = 5;
}

function test_execTypes() {
  const re = new RE2('quick\\s(brown).+?(?<verb>jumps)', 'ig');
  const result = re.exec('The Quick Brown Fox Jumps Over The Lazy Dog');
  if (!(result && result.groups)) {
    throw 'Unexpected Result';
  }
  assertType<number>(result.index);
  assertType<string>(result.input);
  assertType<string | undefined>(result.groups['verb']);
}

function test_execBufferTypes() {
  const re = new RE2('abc', 'ig');
  const result = re.exec(Buffer.from('xabcx'));
  if (!result) {
    throw 'Unexpected Result';
  }
  assertType<number>(result.index);
  assertType<Buffer>(result.input);
  assertType<Buffer>(result[0]);
}

function test_matchTypes() {
  const re = new RE2('quick\\s(brown).+?(?<verb>jumps)', 'ig');
  const result = re.match('The Quick Brown Fox Jumps Over The Lazy Dog');
  if (!(result && result.index && result.input && result.groups)) {
    throw 'Unexpected Result';
  }
  assertType<number>(result.index);
  assertType<string>(result.input);
  assertType<string | undefined>(result.groups['verb']);
}

function test_matchBufferTypes() {
  const re = new RE2('abc', 'i');
  const result = re.match(Buffer.from('xabcx'));
  if (!result) {
    throw 'Unexpected Result';
  }
  assertType<Buffer>(result[0]);
}

function test_testTypes() {
  const re = new RE2('abc');
  assertType<boolean>(re.test('xabcx'));
  assertType<boolean>(re.test(Buffer.from('xabcx')));
}

function test_searchTypes() {
  const re = new RE2('abc');
  assertType<number>(re.search('xabcx'));
  assertType<number>(re.search(Buffer.from('xabcx')));
}

function test_replaceTypes() {
  const re = new RE2('abc', 'g');
  assertType<string>(re.replace('xabcx', 'def'));
  assertType<string>(re.replace('xabcx', (match: string) => match.toUpperCase()));
  assertType<Buffer>(re.replace(Buffer.from('xabcx'), Buffer.from('def')));
}

function test_splitTypes() {
  const re = new RE2(',');
  assertType<string[]>(re.split('a,b,c'));
  assertType<string[]>(re.split('a,b,c', 2));
  assertType<Buffer[]>(re.split(Buffer.from('a,b,c')));
  assertType<Buffer[]>(re.split(Buffer.from('a,b,c'), 2));
}

function test_toStringType() {
  const re = new RE2('abc', 'gi');
  assertType<string>(re.toString());
}

function test_staticMembers() {
  assertType<number>(RE2.getUtf8Length('hello'));
  assertType<number>(RE2.getUtf16Length(Buffer.from('hello')));
  assertType<'nothing' | 'warnOnce' | 'warn' | 'throw'>(
    RE2.unicodeWarningLevel
  );
  RE2.unicodeWarningLevel = 'nothing';

  const {RE2: NamedRE2} = RE2;
  assertType<typeof RE2>(NamedRE2);
  const re = new NamedRE2('abc');
  assertType<RE2>(re);
}

function test_setTypes() {
  const set = new RE2.Set(['alpha', Buffer.from('beta')], 'i', {
    anchor: 'start'
  });
  assertType<number[]>(set.match('alphabet'));
  assertType<boolean>(set.test(Buffer.from('alphabet')));
  assertType<'unanchored' | 'start' | 'both'>(set.anchor);
  assertType<string[]>(set.sources);
  assertType<string>(set.flags);
  assertType<number>(set.size);
  assertType<string>(set.source);
  assertType<string>(set.toString());

  const set2 = RE2.Set(['a', 'b']);
  assertType<number[]>(set2.match('a'));

  const set3 = new RE2.Set([new RE2('a'), /b/]);
  assertType<boolean>(set3.test('a'));

  const set4 = new RE2.Set(['a'], {anchor: 'both'});
  assertType<'unanchored' | 'start' | 'both'>(set4.anchor);
}

test_constructors();
test_properties();
test_execTypes();
test_execBufferTypes();
test_matchTypes();
test_matchBufferTypes();
test_testTypes();
test_searchTypes();
test_replaceTypes();
test_splitTypes();
test_toStringType();
test_staticMembers();
test_setTypes();
