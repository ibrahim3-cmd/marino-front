"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { siteConfig } from "@/lib/config"

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [announcement, setAnnouncement] = useState(siteConfig.announcement)

  useEffect(() => {
    setMounted(true)
    const stored = sessionStorage.getItem("announcement-dismissed")
    if (stored === "true") setDismissed(true)

    const backendUrl = process.env.NEXT_PUBLIC_LOCAL_BACKEND_URL || "http://localhost:5000"
    fetch(`${backendUrl}/api/site-settings`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (data?.announcement) setAnnouncement(data.announcement)
      })
      .catch(() => undefined)
  }, [])

  function handleDismiss() {
    setDismissed(true)
    sessionStorage.setItem("announcement-dismissed", "true")
  }

  if (!mounted || dismissed || !announcement) return null

  return (
    <div className="relative bg-foreground px-4 py-2.5 text-center text-xs font-medium text-background sm:text-sm">
      <p>{announcement}</p>
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-1 text-background/60 hover:text-background"
        aria-label="Dismiss announcement"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
