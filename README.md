# opencode-deepseek-effort-escalation

Auto-escalate DeepSeek reasoning effort from `high` to `max` in [opencode](https://opencode.ai) when the model is struggling.

## Problem

`reasoningEffort` is a per-request parameter. opencode sends whatever effort you configured — the model cannot raise its own budget mid-task. With a "default to `high`, escalate to `max` when needed" workflow, you'd normally have to notice the struggle and press `ctrl+t` yourself.

This plugin automates that: it starts every request at `high`, watches for signals that the model is failing, and bumps the session to `max` for subsequent requests.

## Installation

### Local file (recommended)

Copy `src/index.js` into your plugins directory:

```
~/.config/opencode/plugins/effort-escalation.js
```

Files in that directory are auto-loaded on startup — no config change needed.

### npm

```bash
npm install -g opencode-deepseek-effort-escalation
```

```jsonc
{
  "plugin": [
    "opencode-deepseek-effort-escalation",
    ["opencode-deepseek-effort-escalation", { "failureThreshold": 3 }]
  ]
}
```

## Configuration

| Option             | Default     | Description                                                              |
| ------------------ | ----------- | ------------------------------------------------------------------------ |
| `enabled`          | `true`      | Set to `false` to disable the plugin.                                    |
| `providerID`       | `"deepseek"`| Provider the plugin should manage.                                       |
| `failureThreshold` | `2`         | Consecutive tool failures before escalating to `max`.                    |

Example:

```jsonc
{
  "plugin": [
    ["opencode-deepseek-effort-escalation", { "failureThreshold": 3 }]
  ]
}
```

## How it works

- **`chat.params`** — every DeepSeek request starts at `reasoningEffort: "high"` (unless you've already picked a variant).
- **`tool.execute.after`** — flags a failure when a tool reports an error: non-zero exit code, `Error:` output, command-not-found, traceback, etc. `failureThreshold` consecutive failures escalate the session to `max`.
- **`event`** — any `session.error` (provider error, aborted generation) escalates immediately.

Once escalated, the session stays at `max`; a successful tool call resets the failure counter but does not downgrade effort. Restart a session to drop back to `high`.

## Notes

- Escalation is applied per-request, so a failing response still completes at `high` before the bump takes effect on the next request.
- Only models on the configured `providerID` are managed.
- Requires DeepSeek to accept a `"max"` value for `reasoningEffort`; if your API rejects it, keep only `high`.

## License

MIT
