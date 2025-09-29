"use client"
import { useEffect, useState } from "react"

export const RelativeTime = ({ date }: { date: string | Date }) => {
  const [text, setText] = useState("")

  useEffect(() => {
    const d = new Date(date) 
    const update = () => {
      const diff = Math.max(0, Date.now() - d.getTime())
      const sec = Math.floor(diff / 1000)
      if (sec < 10) setText("just now")
      else if (sec < 60) setText(`${sec}s ago`)
      else {
        const min = Math.floor(sec / 60)
        if (min < 60) setText(`${min}m ago`)
        else {
          const hr = Math.floor(min / 60)
          if (hr < 24) setText(`${hr}h ago`)
          else setText(`${Math.floor(hr/24)}d ago`)
        }
      }
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [date])

  return <>{text}</>
}

