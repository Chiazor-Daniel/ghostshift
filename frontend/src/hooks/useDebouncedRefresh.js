import { useEffect, useRef } from 'react'

/** Debounced listener for gs:data-changed — avoids refresh storms from realtime. */
export function useDebouncedRefresh(refreshFn, delayMs = 900) {
  const timer = useRef(null)
  const fnRef = useRef(refreshFn)
  fnRef.current = refreshFn

  useEffect(() => {
    const handler = () => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        fnRef.current?.({ silent: true })
      }, delayMs)
    }
    window.addEventListener('gs:data-changed', handler)
    return () => {
      clearTimeout(timer.current)
      window.removeEventListener('gs:data-changed', handler)
    }
  }, [delayMs])
}
