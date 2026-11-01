import { useEffect, useState } from 'react'

export default function SystemOnline() {
  const [text, setText] = useState('')
  const fullText = 'system online'

  useEffect(() => {
    let i = 0
    let direction = 1
    let timeoutId

    function type() {
      if (direction === 1) {
        if (i <= fullText.length) {
          setText(fullText.slice(0, i))
          i++
          timeoutId = setTimeout(type, 80)
        } else {
          timeoutId = setTimeout(() => {
            direction = -1
            i = fullText.length
            type()
          }, 3000)
        }
      } else {
        if (i >= 0) {
          setText(fullText.slice(0, i))
          i--
          timeoutId = setTimeout(type, 40)
        } else {
          i = 0
          direction = 1
          timeoutId = setTimeout(type, 500)
        }
      }
    }
    type()

    return () => clearTimeout(timeoutId)
  }, [])

  return (
    <div className="flex items-center gap-2">
      <span className="text-mutedtext text-sm tracking-wider">
        {text}
        <span className="animate-pulse">_</span>
      </span>
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
      </span>
    </div>
  )
}
