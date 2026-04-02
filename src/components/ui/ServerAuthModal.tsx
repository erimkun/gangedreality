import { useState } from 'react'
import { login } from '@/services/api'

interface ServerAuthModalProps {
  onSuccess: () => void
  onCancel: () => void
}

export default function ServerAuthModal({ onSuccess, onCancel }: ServerAuthModalProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const success = await login(password)
      if (success) {
        onSuccess()
      } else {
        setError('Hatalı şifre')
      }
    } catch {
      setError('Sunucuya bağlanılamadı')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f1419] p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">Sunucu Doğrulama</h2>
        <p className="mt-1 text-sm text-white/60">Sunucuya kaydetmek için şifre girin.</p>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifre"
            autoFocus
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !password}
              className="flex-1 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-black transition-colors hover:bg-cyan-400 disabled:opacity-50"
            >
              {loading ? 'Bağlanıyor...' : 'Giriş Yap'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-white/20 px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/5"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
