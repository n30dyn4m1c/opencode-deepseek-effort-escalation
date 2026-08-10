const DEFAULT_EFFORT = "high"
const MAX_EFFORT = "max"

const FAILURE_PATTERNS = [
  /exit code:?\s*[1-9]\d*/i,
  /exit status:?\s*[1-9]\d*/i,
  /command not found/i,
  /traceback \(most recent call last\)/i,
  /(?:^|\n)error:/i,
  /no such file or directory/i,
  /permission denied/i,
]

function isFailure(output) {
  const metadata = output?.metadata
  if (metadata?.status === "error" || metadata?.error) return true
  const text = String(output?.output || "")
  return FAILURE_PATTERNS.some((pattern) => pattern.test(text))
}

function sessionIDFromEvent(event) {
  if (event?.type !== "session.error") return null
  const properties = event?.properties
  return properties?.sessionID || null
}

export const EffortEscalationPlugin = async ({ client }, options = {}) => {
  const enabled = options.enabled !== false
  const providerID = typeof options.providerID === "string" ? options.providerID : "deepseek"
  const failureThreshold =
    Number.isInteger(options.failureThreshold) && options.failureThreshold > 0
      ? options.failureThreshold
      : 2

  const escalated = new Set()
  const consecutiveFailures = new Map()

  function escalate(sessionID) {
    if (!enabled || escalated.has(sessionID)) return
    escalated.add(sessionID)
    client.app.log({
      body: {
        service: "effort-escalation",
        level: "info",
        message: `Escalated reasoning effort to ${MAX_EFFORT} for session ${sessionID}`,
      },
    })
  }

  function recordFailure(sessionID) {
    const count = (consecutiveFailures.get(sessionID) || 0) + 1
    consecutiveFailures.set(sessionID, count)
    if (count >= failureThreshold) escalate(sessionID)
  }

  function recordSuccess(sessionID) {
    if (consecutiveFailures.has(sessionID)) consecutiveFailures.delete(sessionID)
  }

  return {
    "chat.params": async (input, output) => {
      if (input.model?.providerID !== providerID) return
      const current = output.options?.reasoningEffort
      if (current !== undefined && current !== "high" && current !== "max") return
      if (current === MAX_EFFORT) return
      output.options = {
        ...output.options,
        reasoningEffort: escalated.has(input.sessionID) ? MAX_EFFORT : DEFAULT_EFFORT,
      }
    },

    "tool.execute.after": async (input, output) => {
      if (isFailure(output)) recordFailure(input.sessionID)
      else recordSuccess(input.sessionID)
    },

    event: async ({ event }) => {
      const sessionID = sessionIDFromEvent(event)
      if (sessionID) escalate(sessionID)
    },
  }
}

export default EffortEscalationPlugin
