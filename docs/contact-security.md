# Contact form operation and verification

The portfolio keeps Gmail SMTP (`smtp.gmail.com:465`, verified TLS). Set the
existing `AUTH_USER` and `AUTH_PASS` securely in the hosting environment. They are
not `NEXT_PUBLIC_` variables. A missing/invalid sender or empty password returns
503 before opening a transport. Never put credentials in this document or Git.

## Request contract and limits

`POST /api/send` accepts `application/json` with string fields `email`, `subject`,
and `message`. Other fields are ignored and never become mail options. Values are
trimmed. Each field is required, including the Message textarea.

| Limit | Value |
| --- | --- |
| Email | 254 UTF-16 code units, local part at most 64; one unquoted ASCII mailbox |
| Subject | 150 UTF-16 code units; no header control characters |
| Message | 5,000 UTF-16 code units; no null byte; line breaks allowed |
| Raw request body | 32 KiB of UTF-8 bytes, checked while streaming, regardless of Content-Length |
| Body read deadline | 5 seconds |
| SMTP DNS / connect / greeting / idle timeout | 5 / 10 / 10 / 15 seconds |
| Total mail operation deadline | None; await the native SMTP operation (see below) |
| Browser request deadline | 35 seconds |

All POST-handler responses are JSON `{ "success": boolean, "message": string }` with
`Cache-Control: no-store`. Status codes: 200 confirmed success; 400 malformed or
invalid data; 403 cross-site browser metadata; 408 slow request body; 413 body
too large; 500 unexpected failure; 502 upstream mail error; 503 unavailable mail
configuration or native SMTP timeout (`ETIMEDOUT`). No SMTP response, stack trace, credentials, or
message content is logged or returned.

The authenticated account is both the fixed sender and recipient. The validated
visitor mailbox is `replyTo`. HTML is escaped, a plain-text alternative is
included, and Nodemailer file/URL access is disabled. Email/subject header control
characters and recipient lists are rejected. Existing provider and notifications
are retained.

The browser resets only after a 2xx response with a valid success confirmation.
Failures retain the fields and release both the pending-request lock and disabled
button. A network timeout cannot prove that a message was not delivered: a lost
response followed by a retry can still produce duplicate mail. There is no
cross-request idempotency store.

## SMTP timeouts, cleanup and delivery ambiguity

The installed Nodemailer version is 10.1.2. Its non-pooled SMTP transport creates
a separate connection inside each send. The transport's public `close()` releases
transport resources and emits `close`; it does **not** cancel that connection.
The old 25-second `Promise.race()` returned 503 while `sendMail()` could remain
active. That race has been removed. The handler now awaits the actual send's
settlement, maps native `ETIMEDOUT` to the existing generic 503 response, and
calls transport `close()` afterwards. Other mail errors remain generic 502.
No private Nodemailer fields or methods are used by application or test code.

The supported transport options retain DNS 5s, connection 10s, greeting 10s and
socket inactivity 15s limits. In this installed version the connection budget
also constrains setup, including greeting/TLS. Native errors and send completion
close the underlying connection. Established sockets first send FIN; if the
peer refuses to close its half, Nodemailer destroys the local socket after a
five-second teardown grace period. API failure therefore does not mean the TCP
socket is already destroyed, but the send has settled and socket cleanup is
bounded on this path. This grace period is installed-version behavior verified
by the tests, not a configurable application deadline.

There is no separate `responseTimeout` or in-flight `AbortSignal` option on this
transport. `socketTimeout` bounds **inactivity while waiting for responses**, not
the total duration of a command or transaction: incoming progress can reset it.
Multiple slow responses, or a continuously active peer, can outlive 25 seconds
and the browser's unchanged 35-second request deadline. Browser abort/client
disconnect does not cancel server-side SMTP. Native timeouts handle silent peers;
they do not establish an absolute bound against a peer that keeps sending data.
The hosting function's execution budget must accommodate this behavior. Forced
platform termination is not a delivery or cleanup guarantee. If a strict global
SMTP deadline becomes necessary, separately approve a publicly supported,
explicitly owned abortable socket lifecycle or an appropriate transport; do not
restore an abandoned-promise race or assume pooling alone solves cancellation.

Distinguish these outcomes:

- A **connection timeout** occurs during setup, before this transaction sends DATA.
- An **SMTP response timeout** means the connection was inactive; after DATA it
  cannot establish whether the provider accepted the message.
- **Local connection termination** stops local communication; it cannot retract
  a message the peer has already accepted.
- A successful final SMTP **250 response** confirms acceptance by the peer, not
  final inbox delivery. Later filtering, rejection or a bounce is still possible.
- A lost final response can produce a timeout even if the peer accepted DATA.
  Retrying can duplicate a message. There is no exactly-once delivery guarantee
  or automatic server-side retry. Existing user-facing error handling is retained.

## Abuse protection and remaining work

Implemented: bounded streaming reads, field limits, deadlines, fixed recipient,
and rejection of explicitly cross-site Fetch Metadata or a foreign `Origin`.
The Origin check uses the public HTTP Host and the scheme from Next.js's request
URL, because Next.js may use an internal hostname in that URL. Reverse proxies
must preserve the public Host and correctly forward the scheme. Arbitrary
X-Forwarded-Host headers are not trusted. No CORS setting or client-side check is
treated as authentication.
Clients without Origin/Fetch Metadata can still call this public API; bots can
forge those headers.

No global rate limit, Redis/database, CAPTCHA, paid service, or in-memory counter
was added. A burst of valid requests can still cause SMTP abuse and provider
quota exhaustion. The simplest next operational defence is a hosting/WAF rule
for POST `/api/send` (rate limit and request-size/timeout policy). Verify plan
availability and cost first; it has not been configured here. Reliable limits
across serverless instances would otherwise need shared state or an approved
provider. This API currently does not return 429.

## Tests (no real email)

One test framework, Playwright, covers direct handler/mailer tests, loopback SMTP
regressions and Chromium form tests. Unit tests inject fake transports. SMTP
tests use the real installed Nodemailer against an ephemeral `127.0.0.1` sink
which never relays mail or advertises AUTH; production credentials are not read.
All valid browser submissions are intercepted, with a blocking fallback. Real
HTTP requests to the production API contain invalid input only.

SMTP regressions cover connection timeout during a real stalled TLS handshake,
greeting timeout, delayed responses, stalled final acknowledgement, rejection,
successful MIME transmission, retry after timeout and a deliberately half-open
peer. They assert actual peer socket closure before fixture teardown and no
active send or unhandled rejection. The half-open test additionally retains a
test-owned socket through the public `connection` option and observes native
local destruction within a 6.5-second cleanup window. A 26-second progressing
transaction prevents regression to the old 25-second race and demonstrates the
inactivity-only limit; that test has a 35-second execution limit. Other tests use
the suite's 20-second limit, shortened native timeouts and unconditional cleanup.
The TLS setup test covers the connection deadline without depending on a flaky
unroutable-address/SYN timeout. It does not claim to test every OS network failure.

```sh
npm ci
npm run build
npm test
```

Install a Playwright-managed Chromium with `npx playwright install chromium` when
needed. Alternatively use an existing browser without downloading one:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test
```

The suite starts and stops the production server on loopback port 3105 and
refuses to reuse an unknown server. Generated traces, screenshots and results
are ignored by Git. Production build is a prerequisite. Run standalone type
checking after builds finish because `.next/types` is regenerated during build.
Live SMTP credentials, delivery, Gmail policy and hosting rate-limit rules are
separate operational checks and are not validated by mocked tests.
