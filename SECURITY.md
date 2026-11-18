# Security policy

## Reporting a vulnerability

Don't report a security vulnerability through a public GitHub issue, pull request, or discussion.

Report it privately through GitHub's [Private Vulnerability Reporting](https://github.com/uhop/node-re2/security/advisories/new)
(the **Report a vulnerability** button on the repository's **Security** tab). This opens a
confidential advisory that only you and the maintainers can see.

If you can't use GitHub reporting, email the maintainer at **eugene.lazutkin@gmail.com** with
`SECURITY` in the subject line. Don't disclose details publicly until a fix is released.

Include in your report:

- the affected node-re2 version, the Node.js version, and the platform,
- the method and its arguments: the pattern, its flags, and the kind of input (a string, a `Buffer`,
  or another binary type),
- a description of the issue and its impact,
- steps to reproduce through a documented method, with the observed result,
- any suggested remediation.

## Scope

node-re2 provides Node.js bindings for [RE2](https://github.com/google/re2) as a drop-in replacement
for `RegExp`. At run time it opens no network connections, spawns no processes, and touches no
files. At install time, its install script downloads a prebuilt binary from GitHub Releases or
builds one from source.

**The threat model is untrusted text and developer-written patterns.** node-re2 is designed to
match untrusted text, such as user input or data from the network, against patterns that your code
writes. Matching time grows linearly with the length of the text, whatever the text contains.

Three classes are in scope:

- **Disproportionate cost on untrusted text.** For a pattern you wrote, a method whose time or
  memory grows faster than the length of the text. The quadratic `split()` and `replace()` cases
  fixed in 1.27.1 and 1.27.2 are examples.
- **A memory-safety or contract violation.** Text or binary input that makes a documented method
  read or write outside a buffer, crash or abort the process, or return bytes the input doesn't
  contain.
- **Install-time integrity.** A prebuilt binary downloaded from GitHub that the install script uses
  although it doesn't match the hashes pinned in the published package's `artifactHashes` field.

## Out of scope

**Untrusted patterns.** A pattern decides how much memory and time it takes to compile, and a long
pattern full of Unicode property classes can exhaust the memory of the process. That cost is in
RE2's parser, and V8's `RegExp` has the same exposure. For more information, see
[Memory cost of Unicode classes](https://github.com/uhop/node-re2/wiki/Unicode-support#memory-cost-of-unicode-classes).
If your application compiles patterns that its users supply, treat them as untrusted input and
limit their size before you build them.

**Differences from `RegExp` that come from RE2's syntax.** RE2 defines some escapes differently,
`\s`, `\S`, and `.` among them. node-re2 documents these differences and doesn't translate them, so
test a validator written for `RegExp` with node-re2 before you switch. For more information, see
[Differences that come from RE2 syntax](https://github.com/uhop/node-re2/wiki/Edge-cases#differences-that-come-from-re2-syntax).

**Calls outside the documented API.** A report that needs an undocumented call, such as a `Symbol`
method called directly with an argument type its documentation doesn't list, describes a usage
error. The README and `re2.d.ts` define the documented forms.

**Calling the API in a loop.** A proof of concept that calls a method _n_ times and reports that it
takes _n_ units of time describes cost, which the caller chose. A report needs an attacker model:
who supplies the text, through which documented method, with which pattern, and what the attacker
gains that the caller didn't already have.

**Memory proportional to the input or to the requested result.** A large input takes memory in
proportion to its size, and a `replace()` template decides the size of its result. A result past
V8's maximum string length throws a `RangeError`. Limit the input your service accepts.

**Defects in RE2 or V8.** A bug in RE2 or in V8 itself belongs to that project, so report it there.
When RE2 releases a fix, node-re2 picks it up with its next update of the vendored RE2.

**Custom mirrors and git installs.** A binary served through `RE2_DOWNLOAD_MIRROR` is your own build
and isn't hash-checked, and an install from git builds from source by design. The npm package is the
verified artifact.

## Scoring

The base score for this package uses **`AV:L`**. node-re2 binds no network stack: crafted text
reaches a method as a string or a buffer, and whether it arrived over a network is a property of
your deployment. CVSS expresses that through the consumer's environmental metrics. Published
advisories here are scored that way, and a report submitted with `AV:N` is rescored and handled.

## Hardening already shipped

Read the [published advisories](https://github.com/uhop/node-re2/security/advisories) before you
report a variant of a known issue:

- a `replace()` result past V8's maximum string length throws a `RangeError` (1.25.1), and an
  amplifying template is sized before its result is allocated (1.27.1),
- a global `match()` with a pattern that matches the empty string advances past each empty match
  (1.25.2),
- `lastIndex` is checked against the length of the subject in UTF-16 code units (1.25.2),
- binary input that ends in a truncated UTF-8 character is never read past its end (1.26.1),
- prebuilt downloads are checked against hashes pinned in the npm package (1.26.0),
- `split()` with a zero-width pattern (1.27.1) and `replace()` with a function replacer on
  non-ASCII text (1.27.2) run in linear time.

## Supported versions

Fixes are released against the latest published version. Upgrade to the latest node-re2 release
before you report, and pin the fixed version once one is available.

## Disclosure process

- We aim to acknowledge a report within a few business days.
- We work to a coordinated-disclosure timeline, up to 90 days by default, and keep you updated on
  progress toward a fix.
- With your permission, we credit reporters in the release notes and the advisory.
- We request a CVE through GitHub's CNA when the advisory is published.

Thank you for helping keep the ecosystem safe.
