import test from 'tape-six';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

// utilities

const re2Path = fileURLToPath(new URL('../re2.js', import.meta.url));
const ROUNDS = 200;
const WORKERS = 8;

const workerSource = create => `
  const {workerData} = require('node:worker_threads');
  const RE2 = require(${JSON.stringify(re2Path)});
  const state = new Int32Array(workerData);
  let seen = 0;
  for (;;) {
    Atomics.wait(state, 0, seen);
    seen = Atomics.load(state, 0);
    if (seen < 0) break;
    while (Atomics.load(state, 2) === 0);
    ${create};
    Atomics.add(state, 1, 1);
  }
`;

// a child process, because the warning level is global to the process
const countWarnings = create => {
  const script = `
    const {Worker} = require('node:worker_threads');
    const RE2 = require(${JSON.stringify(re2Path)});
    const sync = new SharedArrayBuffer(12), state = new Int32Array(sync);
    const workers = Array.from({length: ${WORKERS}}, () =>
      new Worker(${JSON.stringify(workerSource(create))}, {eval: true, workerData: sync}));
    const tick = () => new Promise(resolve => setImmediate(resolve));
    (async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      for (let round = 1; round <= ${ROUNDS}; ++round) {
        RE2.unicodeWarningLevel = 'warnOnce';
        Atomics.store(state, 1, 0);
        Atomics.store(state, 2, 0);
        Atomics.store(state, 0, round);
        Atomics.notify(state, 0);
        await tick();
        Atomics.store(state, 2, 1);
        while (Atomics.load(state, 1) < ${WORKERS}) await tick();
      }
      Atomics.store(state, 0, -1);
      Atomics.notify(state, 0);
      await Promise.all(workers.map(worker => new Promise(resolve => worker.once('exit', resolve))));
    })();
  `;
  const child = spawnSync(process.execPath, ['-e', script], {
    encoding: 'utf8'
  });
  return {
    status: child.status,
    warnings: child.stderr
      .split(/\r?\n/)
      .filter(line => line.includes('DeprecationWarning')).length
  };
};

// tests

test('test warnOnce warns once per reset across threads: RE2', t => {
  const {status, warnings} = countWarnings("new RE2('.')");
  t.equal(status, 0);
  t.equal(warnings, ROUNDS);
});

test('test warnOnce warns once per reset across threads: RE2.Set', t => {
  const {status, warnings} = countWarnings("new RE2.Set(['.'])");
  t.equal(status, 0);
  t.equal(warnings, ROUNDS);
});
