import type { Plugin } from "@opencode-ai/plugin"

export interface EffortEscalationOptions {
  enabled?: boolean
  providerID?: string
  failureThreshold?: number
}

export declare const EffortEscalationPlugin: Plugin
export default EffortEscalationPlugin
