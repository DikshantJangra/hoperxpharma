export interface Alert {
    id: string
    type: "inventory" | "compliance" | "workflow" | "system"
    severity: "critical" | "warning" | "info"
    title: string
    description: string
    createdAt: string
    source: string
    priority: "High" | "Medium" | "Low"
    status: "new" | "snoozed" | "resolved"
    medicine?: string
    resolvedBy?: string
    snoozeUntil?: string
}
