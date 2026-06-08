"use client"

import React from "react"
import { useEffect, useState } from "react"
import { cn } from "../../lib/utils"

interface AnimatedListProps {
  className?: string
  children?: React.ReactNode
  delay?: number
}

export function AnimatedList({
  className,
  children,
  delay = 1000,
}: AnimatedListProps) {
  const [index, setIndex] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % React.Children.count(children))
    }, delay)

    return () => clearInterval(interval)
  }, [mounted, delay, children])

  const childrenArray = React.Children.toArray(children)

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {childrenArray.map((child, i) => (
        <div
          key={i}
          style={{
            opacity: i === index ? 1 : 0.3,
            transform: i === index ? "translateX(0)" : "translateX(-20px)",
            transition: "all 0.5s ease-out",
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

export default AnimatedList
