import RE2 from 're2';

function assertType<T>(_val: T) {}

function test_execTypes() {
  const re = new RE2('quick\\s(brown).+?(?<verb>jumps)', 'ig');
  const result = re.exec('The Quick Brown Fox Jumps Over The Lazy Dog')
  if (!(result && result.groups)) {
    throw 'Unexpected Result'
  }
  assertType<number>(result.index)
  assertType<string>(result.input)
  assertType<string | undefined>(result.groups['verb'])
}

function test_matchTypes() {
  const re = new RE2('quick\\s(brown).+?(?<verb>jumps)', 'ig');
  const result = re.match('The Quick Brown Fox Jumps Over The Lazy Dog')
  if (!(result && result.index && result.input && result.groups)) {
    throw 'Unexpected Result'
  }
  assertType<number>(result.index)
  assertType<string>(result.input)
  assertType<string | undefined>(result.groups['verb'])
}

function test_setTypes() {
  const set = new RE2.Set(['alpha', Buffer.from('beta')], 'i', {anchor: 'start'})
  assertType<number[]>(set.match('alphabet'))
  assertType<boolean>(set.test(Buffer.from('alphabet')))
  assertType<'unanchored' | 'start' | 'both'>(set.anchor)
  assertType<string[]>(set.sources)
  assertType<string>(set.flags)
}

test_execTypes()
test_matchTypes()
test_setTypes()
