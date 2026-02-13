"use client"

import * as React from "react"
import { Settings, Download, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeSelector } from "@/components/theme-selector"
import { McpConfigDialog } from "@/components/mcp-config-dialog"

interface SettingsData {
  openaiApiKey: string
  openaiBaseUrl: string
  model: string
}

interface SettingsDrawerProps {
  settings: SettingsData
  onSettingsChange: (settings: SettingsData) => void
  onExport: () => void
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  onMcpConfigChange: () => void
}

export function SettingsDrawer({
  settings,
  onSettingsChange,
  onExport,
  onImport,
  onMcpConfigChange,
}: SettingsDrawerProps) {
  const [localSettings, setLocalSettings] = React.useState(settings)
  const [open, setOpen] = React.useState(false)
  const importInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleSave = () => {
    onSettingsChange(localSettings)
  }

  const handleImportClick = () => {
    importInputRef.current?.click()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Open settings" className="fixed right-4 top-4 z-40">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="!left-auto right-0 top-0 h-screen w-full max-w-md !translate-x-0 !translate-y-0 rounded-none sm:rounded-none">
        <DialogHeader>
          <DialogTitle>Workspace Settings</DialogTitle>
          <DialogDescription>
            Manage API, MCP, theme and workspace import/export in one place.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="drawer-apiKey">OpenAI API Key</Label>
            <Input
              id="drawer-apiKey"
              type="password"
              placeholder="sk-..."
              value={localSettings.openaiApiKey}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, openaiApiKey: e.target.value })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="drawer-model">Model</Label>
            <Input
              id="drawer-model"
              type="text"
              placeholder="gpt-4o-mini"
              value={localSettings.model}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, model: e.target.value })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="drawer-baseUrl">OpenAI Base URL (optional)</Label>
            <Input
              id="drawer-baseUrl"
              type="url"
              placeholder="https://api.openai.com/v1"
              value={localSettings.openaiBaseUrl}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, openaiBaseUrl: e.target.value })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label>Theme</Label>
            <ThemeSelector />
          </div>

          <div className="border-t pt-4 grid gap-2">
            <Label>MCP Servers</Label>
            <McpConfigDialog
              onServerChange={onMcpConfigChange}
              trigger={<Button variant="outline">Manage MCP Servers</Button>}
            />
          </div>

          <div className="border-t pt-4 grid gap-2">
            <Label>Workspace File</Label>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(event) => {
                void onImport(event)
              }}
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={onExport} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={handleImportClick} className="flex-1">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => setLocalSettings(settings)}>
            Reset
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
