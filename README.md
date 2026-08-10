# OpenCode DeepSeek Effort Escalation

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Language: JavaScript](https://img.shields.io/badge/Language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

**OpenCode plugin that auto-escalates DeepSeek reasoning effort from `high` to `max` when the model is struggling.**

`reasoningEffort` is a per-request parameter — opencode sends whatever effort you configured, and the model can't raise its own budget mid-task. A "default to `high`, escalate to `max` when needed" workflow normally means noticing the struggle yourself and pressing `ctrl+t`. This plugin automates the escalation: every request starts at `high`, and repeated tool failures or a session error bump the session to `max`.

## Features

- Defaults every DeepSeek request to `reasoningEffort: "high"` unless you've already picked a variant.
- Escalates to `"max"` after `failureThreshold` consecutive tool failures (non-zero exit code, `Error:` output, command-not-found, traceback, …).
- Escalates immediately on any `session.error` (provider error, aborted generation).
- Per-session state: once escalated, the session stays at `max`; a successful tool call resets the counter but doesn't downgrade.
- Configurable provider, failure threshold, and an on/off switch.

## How it works

Three plugin hooks drive the escalation:

| Hook | Role |
|------|------|
| `chat.params` | Sets the effort level for each DeepSeek request — `high` by default, `max` once escalated |
| `tool.execute.after` | Flags failed tool calls and counts consecutive failures per session |
| `event` | Escalates immediately on `session.error` |

## Files

```text
src/index.js       Plugin (plain ESM, no build step)
index.d.ts         TypeScript types
package.json       npm metadata
README.md
LICENSE            MIT
```

## Installation

### Local file (recommended)

Copy `src/index.js` into your plugins directory:

```bash
mkdir -p ~/.config/opencode/plugins
cp src/index.js ~/.config/opencode/plugins/effort-escalation.js
```

Files in that directory auto-load on startup — no config change needed.

### npm

```bash
npm install -g opencode-deepseek-effort-escalation
```

```jsonc
{
  "plugin": ["opencode-deepseek-effort-escalation"]
}
```

## Configuration

| Option             | Default      | Description                                             |
| ------------------ | ------------ | ------------------------------------------------------- |
| `enabled`          | `true`       | Set to `false` to disable the plugin.                   |
| `providerID`       | `"deepseek"` | Provider the plugin should manage.                      |
| `failureThreshold` | `2`          | Consecutive tool failures before escalating to `max`.   |

With options:

```jsonc
{
  "plugin": [
    ["opencode-deepseek-effort-escalation", { "failureThreshold": 3 }]
  ]
}
```

## Notes

- Escalation is applied per-request, so a failing response still completes at `high` before the bump takes effect on the next request.
- Only models on the configured `providerID` are managed.
- Requires DeepSeek to accept a `"max"` value for `reasoningEffort`; if your API rejects it, keep only `high`.
- Restart opencode after adding the plugin; restart a session to drop back to `high`.

## License

This project is licensed under the [MIT License](LICENSE).

## Author

**Neo Malesa** — [n30dyn4m1c](https://github.com/n30dyn4m1c)
