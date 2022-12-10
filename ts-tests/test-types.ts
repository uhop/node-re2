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

test_execTypes()
test_matchTypes()
