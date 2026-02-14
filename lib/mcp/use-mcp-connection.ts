"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { MCP_SETTINGS_KEY } from "@/lib/constants"
import { McpClient, mcpToolToAirAgentTool, getMcpServer } from "@/lib/mcp"
import { ToolRegistry } from "@/lib/tools"

export interface McpConnectionInfo {
  mcpEnabled: boolean
  mcpServerId: string | undefined
  mcpStatus: string
  mcpError: string | undefined
  mcpReady: boolean
}

export interface UseMcpConnectionReturn extends McpConnectionInfo {
  handleMcpToggle: (enabled: boolean, serverId?: string) => void
}

/**
 * Hook that manages MCP connection lifecycle at the app level.
 * Reads MCP settings from localStorage, connects/disconnects as needed,
 * and registers MCP tools into the provided ToolRegistry.
 */
export function useMcpConnection(toolRegistry: ToolRegistry): UseMcpConnectionReturn {
  const [mcpEnabled, setMcpEnabled] = useState(false)
  const [mcpServerId, setMcpServerId] = useState<string | undefined>()
  const [mcpStatus, setMcpStatus] = useState<string>("disconnected")
  const [mcpError, setMcpError] = useState<string | undefined>()
  const [mcpReady, setMcpReady] = useState(false)

  const mcpClientRef = useRef<McpClient | null>(null)

  // Load MCP settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(MCP_SETTINGS_KEY)
    if (saved) {
      try {
        const settings = JSON.parse(saved)
        setMcpEnabled(settings.mcpEnabled || false)
        setMcpServerId(settings.mcpServerId)
      } catch (e) {
        console.error("Failed to load MCP settings:", e)
      }
    }
  }, [])

  // Handle MCP connection
  useEffect(() => {
    let cancelled = false

    const connectMcp = async () => {
      setMcpReady(false)

      // Disconnect existing client
      if (mcpClientRef.current) {
        await mcpClientRef.current.disconnect()
        mcpClientRef.current = null
      }

      if (!mcpEnabled || !mcpServerId) {
        setMcpStatus("disconnected")
        if (!cancelled) setMcpReady(true)
        return
      }

      const serverConfig = getMcpServer(mcpServerId)
      if (!serverConfig) {
        setMcpError("Server configuration not found")
        setMcpStatus("error")
        if (!cancelled) setMcpReady(true)
        return
      }

      try {
        const client = new McpClient(serverConfig, (status, err) => {
          setMcpStatus(status)
          setMcpError(err)
        })

        await client.connect()

        const mcpTools = await client.listTools()

        if (cancelled) {
          await client.disconnect()
          return
        }

        mcpTools.forEach((mcpTool) => {
          const tool = mcpToolToAirAgentTool(mcpTool, client)
          toolRegistry.registerTool(tool)
        })

        mcpClientRef.current = client
        setMcpError(undefined)
      } catch (err) {
        console.error("Failed to connect to MCP server:", err)
        if (!cancelled) {
          setMcpError(err instanceof Error ? err.message : "Connection failed")
          setMcpStatus("error")
          mcpClientRef.current = null
        }
      } finally {
        if (!cancelled) setMcpReady(true)
      }
    }

    connectMcp()

    return () => {
      cancelled = true
      if (mcpClientRef.current) {
        mcpClientRef.current.disconnect().catch((err) => {
          console.error("Error during MCP cleanup:", err)
        })
        mcpClientRef.current = null
      }
    }
  }, [mcpEnabled, mcpServerId, toolRegistry])

  const handleMcpToggle = useCallback((enabled: boolean, serverId?: string) => {
    setMcpEnabled(enabled)
    setMcpServerId(serverId)

    const settings = { mcpEnabled: enabled, mcpServerId: serverId }
    localStorage.setItem(MCP_SETTINGS_KEY, JSON.stringify(settings))
  }, [])

  return {
    mcpEnabled,
    mcpServerId,
    mcpStatus,
    mcpError,
    mcpReady,
    handleMcpToggle,
  }
}
