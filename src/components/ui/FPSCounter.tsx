import { Stats } from '@react-three/drei'
import { useEffect, useState } from 'react'

export function FPSCounter() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === 'f') {
        setShow(s => !s)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return show ? <Stats /> : null
}
