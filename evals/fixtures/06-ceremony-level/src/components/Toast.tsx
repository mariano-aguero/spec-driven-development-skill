import { useEffect } from 'react'

type ToastProps = { message: string; onClose: () => void }

const TOAST_DURATION_MS = 3000

export function ErrorToast({ message, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, TOAST_DURATION_MS)
    return () => clearTimeout(timer)
  }, [onClose])

  return <div role="alert" className="toast toast-error">{message}</div>
}
