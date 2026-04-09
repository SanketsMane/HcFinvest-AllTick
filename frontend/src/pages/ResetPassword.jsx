import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { API_URL } from '../config/api'
import { Lock, CheckCircle2, AlertCircle, X } from 'lucide-react'

const ResetPassword = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Reset token is missing or invalid.')
      return
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Unable to reset password')
      }

      setSuccess(true)
      setTimeout(() => navigate('/user/login', { replace: true }), 1800)
    } catch (err) {
      setError(err.message || 'Unable to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-l from-orange-500/20 via-purple-500/20 to-transparent rounded-full blur-3xl" />

      <div className="relative bg-dark-700 rounded-2xl p-8 w-full max-w-md border border-gray-800">
        <Link to="/user/login" className="absolute top-4 right-4 w-8 h-8 bg-dark-600 rounded-full flex items-center justify-center hover:bg-dark-500 transition-colors">
          <X size={16} className="text-gray-400" />
        </Link>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Password Updated</h2>
            <p className="text-gray-400 mb-6">
              Your password has been reset successfully. Redirecting to login...
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-white mb-2">Reset Password</h1>
            <p className="text-gray-400 text-sm mb-6">
              Set a new secure password for your trading account.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">New Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-dark-600 border border-gray-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full bg-dark-600 border border-gray-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-gray-100 transition-colors mt-2 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default ResetPassword
