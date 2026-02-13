"use client"

import * as React from "react"
import { ChatInterface } from "@/components/chat-interface"
import { SettingsDrawer } from "@/components/settings-drawer"
import { STORAGE_KEY, DEFAULT_MODEL, MCP_STORAGE_KEY, MCP_SETTINGS_KEY } from "@/lib/constants"
import { McpEnabledSettings, McpServerConfig } from "@/lib/mcp"

interface SettingsData {
  openaiApiKey: string
  openaiBaseUrl: string
  model: string
}

interface WorkspaceSettingsExport {
  version: number
  exportedAt: string
  settings: SettingsData
  mcpServers: McpServerConfig[]
  mcpChatSettings: McpEnabledSettings
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isSettingsData(value: unknown): value is SettingsData {
  if (!isObject(value)) return false
  return (
    typeof value.openaiApiKey === "string" &&
    typeof value.openaiBaseUrl === "string" &&
    typeof value.model === "string"
  )
}

function isMcpEnabledSettings(value: unknown): value is McpEnabledSettings {
  if (!isObject(value)) return false
  if (typeof value.mcpEnabled !== "boolean") return false
  if (value.mcpServerId !== undefined && typeof value.mcpServerId !== "string") return false
  return true
}

function isMcpServerConfig(value: unknown): value is McpServerConfig {
  if (!isObject(value)) return false
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.url === "string" &&
    typeof value.enabled === "boolean" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    (value.description === undefined || typeof value.description === "string") &&
    (value.apiKey === undefined || typeof value.apiKey === "string")
  )
}

function parseStoredMcpServers(stored: string | null): McpServerConfig[] {
  if (!stored) return []
  const parsed: unknown = JSON.parse(stored)
  if (!Array.isArray(parsed) || !parsed.every(isMcpServerConfig)) {
    throw new Error("Invalid MCP server config format")
  }
  return parsed
}

function parseStoredMcpChatSettings(stored: string | null): McpEnabledSettings {
  if (!stored) return { mcpEnabled: false }
  const parsed: unknown = JSON.parse(stored)
  if (!isMcpEnabledSettings(parsed)) {
    throw new Error("Invalid MCP chat settings format")
  }
  return parsed
}

export default function Home() {
  const [settings, setSettings] = React.useState<SettingsData>({
    openaiApiKey: "",
    openaiBaseUrl: "",
    model: DEFAULT_MODEL,
  })
  const [mcpConfigKey, setMcpConfigKey] = React.useState(0)

  // Load settings from localStorage on mount
  React.useEffect(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEY)
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (e) {
        console.error("Failed to load settings:", e)
      }
    }
  }, [])

  // Save settings to localStorage
  const handleSettingsChange = (newSettings: SettingsData) => {
    setSettings(newSettings)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
  }

  // Trigger re-render of chat interface when MCP config changes
  const handleMcpConfigChange = () => {
    setMcpConfigKey((prev) => prev + 1)
  }

  const handleExportSettings = () => {
    try {
      const exportData: WorkspaceSettingsExport = {
        version: 1,
        exportedAt: new Date().toISOString(),
        settings,
        mcpServers: parseStoredMcpServers(localStorage.getItem(MCP_STORAGE_KEY)),
        mcpChatSettings: parseStoredMcpChatSettings(localStorage.getItem(MCP_SETTINGS_KEY)),
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      const stamp = new Date().toISOString().replace(/[:.]/g, "-")
      link.href = url
      link.download = `air-agent-workspace-settings-${stamp}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to export workspace settings:", error)
      alert("Export failed. Please check browser console for details.")
    }
  }

  const handleImportSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    try {
      const text = await file.text()
      const parsed: unknown = JSON.parse(text)

      if (!isObject(parsed)) {
        throw new Error("Invalid import file")
      }

      let importedCount = 0

      const importedSettings =
        "settings" in parsed ? parsed.settings : parsed
      if (isSettingsData(importedSettings)) {
        setSettings(importedSettings)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(importedSettings))
        importedCount += 1
      }

      if ("mcpServers" in parsed) {
        if (!Array.isArray(parsed.mcpServers) || !parsed.mcpServers.every(isMcpServerConfig)) {
          throw new Error("Invalid MCP servers format")
        }
        localStorage.setItem(MCP_STORAGE_KEY, JSON.stringify(parsed.mcpServers))
        importedCount += 1
      }

      if ("mcpChatSettings" in parsed) {
        if (!isMcpEnabledSettings(parsed.mcpChatSettings)) {
          throw new Error("Invalid MCP chat settings format")
        }
        localStorage.setItem(MCP_SETTINGS_KEY, JSON.stringify(parsed.mcpChatSettings))
        importedCount += 1
      }

      if (importedCount === 0) {
        throw new Error("No valid settings found in import file")
      }

      setMcpConfigKey((prev) => prev + 1)
      alert("Workspace settings imported successfully")
    } catch (error) {
      console.error("Failed to import workspace settings:", error)
      alert("Import failed. Please ensure this is a valid exported settings JSON file.")
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <SettingsDrawer
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onExport={handleExportSettings}
        onImport={handleImportSettings}
        onMcpConfigChange={handleMcpConfigChange}
      />
      <main className="flex-1 container mx-auto px-4 py-4 overflow-hidden">
        <ChatInterface
          key={mcpConfigKey}
          apiKey={settings.openaiApiKey}
          baseUrl={settings.openaiBaseUrl}
          model={settings.model}
        />
      </main>
    </div>
  )
}
