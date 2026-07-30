import { useState } from 'react'
import { useAuth } from '../api/auth'
import { IcEye, IcEyeOff } from '../icons'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kirishda xatolik')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={submit}>
        <div className="brand" style={{ marginBottom: 8 }}>
          <div className="logo">K</div>
          <div>
            <div className="name">KiGo</div>
            <div className="tag">Admin panel</div>
          </div>
        </div>

        <div className="field">
          <label>Email</label>
          <input
            className="input"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@kigo.uz"
            required
          />
        </div>
        <div className="field">
          <label>Parol</label>
          <div className="pw-wrap">
            <input
              className="input pw-input"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowPassword((v) => !v)}
              title={showPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
              aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
              aria-pressed={showPassword}
              tabIndex={-1}
            >
              {showPassword ? <IcEyeOff /> : <IcEye />}
            </button>
          </div>
        </div>

        {error && <div className="login-error">{error}</div>}

        <button className="btn primary" type="submit" disabled={busy || !email || !password}>
          {busy ? 'Kirilmoqda…' : 'Kirish'}
        </button>
      </form>
    </div>
  )
}
