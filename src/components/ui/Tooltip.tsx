import { createPortal } from 'react-dom'
import { useEffect, useRef, useState, type ReactNode } from 'react'

type TooltipProps = { content: ReactNode; children: ReactNode; delay?: number }

export function Tooltip({ content, children, delay = 400 }: TooltipProps) {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const timerRef = useRef<number | undefined>(undefined)
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ left: 0, top: 0 })

  const show = () => {
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      const bounds = anchorRef.current?.getBoundingClientRect()
      if (!bounds) return
      const width = 240
      const left = Math.min(Math.max(12, bounds.left + bounds.width / 2 - width / 2), window.innerWidth - width - 12)
      const top = bounds.bottom + 10 + 150 > window.innerHeight ? Math.max(12, bounds.top - 160) : bounds.bottom + 10
      setPosition({ left, top })
      setVisible(true)
    }, delay)
  }

  const hide = () => {
    window.clearTimeout(timerRef.current)
    setVisible(false)
  }

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  return <span ref={anchorRef} className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>{children}{visible && createPortal(<span className="pointer-events-none fixed z-[100] w-[240px] animate-tooltip rounded-xl border border-[#dbe2dd] bg-white p-3 text-left text-[#17211f] shadow-[0_12px_30px_rgba(39,66,53,0.16)]" style={{ left: position.left, top: position.top }} role="tooltip">{content}</span>, document.body)}</span>
}