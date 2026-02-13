export async function resolveSystemPromptTemplate(template: string): Promise<string> {
  if (!template.trim()) {
    return ""
  }

  const now = new Date()
  const currentTime = now.toLocaleString()
  const currentTimeIso = now.toISOString()
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown"

  const currentLocation = await getCurrentLocationText()

  const replacements: Record<string, string> = {
    current_time: currentTime,
    "当前时间": currentTime,
    current_time_iso: currentTimeIso,
    current_timezone: timezone,
    current_location: currentLocation,
    "当前地理位置": currentLocation,
  }

  return template.replace(/\{\{\s*([^{}\s]+)\s*\}\}/g, (match, key: string) => {
    return replacements[key] ?? match
  })
}

async function getCurrentLocationText(): Promise<string> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return "Location unavailable"
  }

  try {
    const position = await getCurrentPositionWithTimeout(5000)
    const { latitude, longitude, accuracy } = position.coords
    const roundedLatitude = latitude.toFixed(6)
    const roundedLongitude = longitude.toFixed(6)
    const roundedAccuracy = Math.round(accuracy)

    return `lat ${roundedLatitude}, lng ${roundedLongitude} (±${roundedAccuracy}m)`
  } catch {
    return "Location unavailable"
  }
}

function getCurrentPositionWithTimeout(timeoutMs: number): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("Geolocation timeout"))
    }, timeoutMs)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        window.clearTimeout(timer)
        resolve(position)
      },
      (error) => {
        window.clearTimeout(timer)
        reject(error)
      },
      {
        enableHighAccuracy: false,
        timeout: timeoutMs,
        maximumAge: 60_000,
      }
    )
  })
}
