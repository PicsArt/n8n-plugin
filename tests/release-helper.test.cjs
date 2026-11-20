const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

// Execute the actual helper with fake tools in an isolated directory. No version,
// repository, tag, network, or package-manager mutation reaches the real checkout.
for (const failure of ['pnpm test', 'node scripts/verify-package-contents.cjs', 'pnpm audit --audit-level moderate']) {
  test(`release helper stops before commit/tag when ${failure} fails`, () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'picsart-release-gate-'));
    try {
      const log = path.join(dir, 'calls');
      for (const command of ['node', 'pnpm', 'npm', 'git']) {
        fs.writeFileSync(path.join(dir, command), `#!/bin/bash
name=${command}
echo "$name $*" >> "$TEST_CALL_LOG"
if [ "$name $*" = "$TEST_FAIL_COMMAND" ]; then exit 17; fi
if [ "$name" = node ] && [ "$1" = -p ]; then echo 5.4.8; fi
if [ "$name" = git ] && [ "$1" = rev-parse ]; then echo main; fi
exit 0
`, { mode: 0o755 });
      }
      const result = spawnSync('/bin/bash', [path.join(__dirname, '../release.sh'), 'patch'], {
        cwd: dir, encoding: 'utf8', input: 'y\n',
        env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, TEST_CALL_LOG: log, TEST_FAIL_COMMAND: failure },
      });
      assert.equal(result.status, 17, result.stdout + result.stderr);
      const calls = fs.readFileSync(log, 'utf8');
      assert.ok(calls.includes(failure));
      assert.doesNotMatch(calls, /git (?:add|commit|tag|push)/);
      assert.doesNotMatch(result.stdout, /All checks passed/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
}
