import test from 'tape-six';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

// An embedder, such as Electron, can run more than one Node.js environment in
// one isolate, and free each environment when it ends. The harness in
// multi-env/ does the same. It needs Node.js 26.11 or later.

// utilities

const [major = 0, minor = 0] = process.versions.node.split('.').map(Number);
const supported = major > 26 || (major === 26 && minor >= 11);

const re2Path = fileURLToPath(new URL('../re2.js', import.meta.url));
const harnessDir = fileURLToPath(new URL('./multi-env/', import.meta.url));
const harnessPath = fileURLToPath(
  new URL('./multi-env/build/Release/multi_env.node', import.meta.url)
);
const ENVIRONMENTS = 5;

let built = false;
const buildHarness = () => {
  if (built) return;
  const nodeGyp = createRequire(import.meta.url).resolve(
    'node-gyp/bin/node-gyp.js'
  );
  const child = spawnSync(process.execPath, [nodeGyp, 'rebuild'], {
    cwd: harnessDir,
    encoding: 'utf8'
  });
  if (child.status !== 0) {
    throw new Error(
      'Cannot build the harness:\n' + child.stdout + child.stderr
    );
  }
  built = true;
};

// runs the source in new environments, one at a time, and counts their
// contexts that GC does not collect
const countLeakedContexts = source => {
  buildHarness();
  const script = `
    const {getHeapStatistics} = require('node:v8');
    const {run} = require(${JSON.stringify(harnessPath)});
    const countContexts = () => getHeapStatistics().number_of_native_contexts;
    gc();
    const before = countContexts();
    // run the environments before the event loop starts: FreeEnvironment()
    // can run the event loop, and libuv does not allow nested uv_run() calls
    for (let i = 0; i < ${ENVIRONMENTS}; ++i) {
      const result = run(${JSON.stringify(source)});
      if (result !== 'aaa') throw new Error('Unexpected result: ' + result);
    }
    // a compile job in the background can keep a context alive for a short
    // time, so let the event loop run between GCs
    (async () => {
      for (let i = 0; i < 5; ++i) {
        gc();
        await new Promise(resolve => setImmediate(resolve));
      }
      process.stdout.write(String(countContexts() - before));
    })();
  `;
  const child = spawnSync(process.execPath, ['--expose-gc', '-e', script], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit']
  });
  return {status: child.status, leaked: Number(child.stdout)};
};

// tests

const testIfSupported = supported ? test : test.skip;

testIfSupported('test environments without RE2 release their contexts', t => {
  const {status, leaked} = countLeakedContexts("return 'aaa';");
  t.equal(status, 0);
  t.equal(leaked, 0);
});

testIfSupported('test environments with RE2 release their contexts', t => {
  const {status, leaked} = countLeakedContexts(`
    const RE2 = require('module').createRequire(${JSON.stringify(re2Path)})(
      ${JSON.stringify(re2Path)}
    );
    return new RE2('a+').exec('caaat')[0];
  `);
  t.equal(status, 0);
  t.equal(leaked, 0);
});
