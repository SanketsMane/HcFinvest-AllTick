// import { API_URL } from '../config/api'
// import { useState, useEffect } from 'react'
// import { Link, useNavigate, useParams } from 'react-router-dom'
// import { X, Eye, EyeOff, Check, AlertCircle, Loader2 } from 'lucide-react'

// const ResetPassword = () => {
//   const [token, setToken] = useState('')
//   const [password, setPassword] = useState('')
//   const [confirmPassword, setConfirmPassword] = useState('')
//   const [showPassword, setShowPassword] = useState(false)
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false)
//   const [loading, setLoading] = useState(false)
//   const [verifying, setVerifying] = useState(true)
//   const [error, setError] = useState('')
//   const [success, setSuccess] = useState(false)
//   const [tokenValid, setTokenValid] = useState(false)
  
//   const navigate = useNavigate()
//   const { token: urlToken } = useParams()

//   useEffect(() => {
//     const verifyToken = async () => {
//       if (!urlToken) {
//         setError('Invalid reset link')
//         setVerifying(false)
//         return
//       }

//       try {
//         console.log('Verifying token:', urlToken)
//         const res = await fetch(`${API_URL}/auth/verify-reset-token/${urlToken}`)
//         const data = await res.json()
        
//         if (data.success) {
//           setTokenValid(true)
//           setToken(urlToken)
//         } else {
//           setError(data.message || 'Invalid or expired reset link')
//           setTokenValid(false)
//         }
//       } catch (err) {
//         console.error('Token verification error:', err)
//         setError('Failed to verify reset link')
//         setTokenValid(false)
//       } finally {
//         setVerifying(false)
//       }
//     }

//     verifyToken()
//   }, [urlToken])

//   const handleSubmit = async (e) => {
//     e.preventDefault()
    
//     if (!password || !confirmPassword) {
//       setError('Please fill in all fields')
//       return
//     }
    
//     if (password.length < 6) {
//       setError('Password must be at least 6 characters')
//       return
//     }
    
//     if (password !== confirmPassword) {
//       setError('Passwords do not match')
//       return
//     }

//     setLoading(true)
//     setError('')

//     try {
//       // Debug: Log what we're sending
//       console.log('Sending reset request:', { token: token ? 'exists' : 'missing', password: password ? 'exists' : 'missing' })
//       console.log('Token value:', token)
      
//       let res = await fetch(`${API_URL}/auth/reset-password`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ token, password })
//       })
      
//       let data = await res.json()
//       console.log('Backend response:', data)
      
//       // If original token fails, try generating a new one (temporary workaround)
//       if (!data.success && data.message.includes('Invalid or expired token')) {
//         setError('Token expired. Please request a new password reset link.')
//         setLoading(false)
//         return
//       }

//       if (data.success) {
//         setSuccess(true)
//         setTimeout(() => {
//           navigate('/user/login')
//         }, 3000)
//       } else {
//         setError(data.message || 'Failed to reset password')
//       }
//     } catch (err) {
//       setError('Error resetting password. Please try again.')
//     } finally {
//       setLoading(false)
//     }
//   }

//   if (verifying) {
//     return (
//       <div className="min-h-screen bg-black flex items-center justify-center p-4">
//         <div className="text-center">
//           <Loader2 className="animate-spin text-white mx-auto mb-4" size={32} />
//           <p className="text-gray-400">Verifying reset link...</p>
//         </div>
//       </div>
//     )
//   }

//   if (!tokenValid) {
//     return (
//       <div className="min-h-screen bg-black flex items-center justify-center p-4">
//         <div className="bg-dark-700 rounded-2xl p-8 w-full max-w-md border border-gray-800 text-center">
//           <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
//           <h2 className="text-xl font-semibold text-white mb-2">Invalid Reset Link</h2>
//           <p className="text-gray-400 mb-6">{error || 'This reset link is invalid or has expired.'}</p>
//           <Link 
//             to="/user/forgot-password"
//             className="inline-block bg-white text-black font-medium px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
//           >
//             Request New Link
//           </Link>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
//       {/* Background gradient effects */}
//       <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-transparent rounded-full blur-3xl" />
//       <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-l from-orange-500/20 via-purple-500/20 to-transparent rounded-full blur-3xl" />
      
//       {/* Modal */}
//       <div className="relative bg-dark-700 rounded-2xl p-8 w-full max-w-md border border-gray-800">
//         {/* Close button */}
//         <Link to="/user/login" className="absolute top-4 right-4 w-8 h-8 bg-dark-600 rounded-full flex items-center justify-center hover:bg-dark-500 transition-colors">
//           <X size={16} className="text-gray-400" />
//         </Link>

//         {success ? (
//           <div className="text-center py-8">
//             <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
//               <Check size={32} className="text-green-500" />
//             </div>
//             <h2 className="text-xl font-semibold text-white mb-2">Password Reset Successful</h2>
//             <p className="text-gray-400 mb-6">
//               Your password has been updated successfully. 
//               You will be redirected to login page shortly.
//             </p>
//             <Link 
//               to="/user/login"
//               className="inline-block bg-white text-black font-medium px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
//             >
//               Go to Login
//             </Link>
//           </div>
//         ) : (
//           <>
//             {/* Title */}
//             <h1 className="text-2xl font-semibold text-white mb-2">Reset Password</h1>
//             <p className="text-gray-400 text-sm mb-6">
//               Enter your new password below.
//             </p>

//             {/* Form */}
//             <form onSubmit={handleSubmit} className="space-y-4">
//               {/* Password field */}
//               <div>
//                 <label className="block text-gray-400 text-sm mb-2">New Password</label>
//                 <div className="relative">
//                   <input
//                     type={showPassword ? 'text' : 'password'}
//                     placeholder="Enter new password"
//                     value={password}
//                     onChange={(e) => { setPassword(e.target.value); setError('') }}
//                     className="w-full bg-dark-600 border border-gray-700 rounded-lg pl-4 pr-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
//                   >
//                     {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                   </button>
//                 </div>
//               </div>

//               {/* Confirm Password field */}
//               <div>
//                 <label className="block text-gray-400 text-sm mb-2">Confirm Password</label>
//                 <div className="relative">
//                   <input
//                     type={showConfirmPassword ? 'text' : 'password'}
//                     placeholder="Confirm new password"
//                     value={confirmPassword}
//                     onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
//                     className="w-full bg-dark-600 border border-gray-700 rounded-lg pl-4 pr-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                     className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
//                   >
//                     {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                   </button>
//                 </div>
//               </div>

//               {/* Password requirements */}
//               <div className="bg-dark-600 rounded-lg p-3">
//                 <p className="text-gray-400 text-xs mb-2">Password must:</p>
//                 <ul className="text-xs space-y-1">
//                   <li className={`flex items-center gap-2 ${password.length >= 6 ? 'text-green-500' : 'text-gray-500'}`}>
//                     <span className="w-1 h-1 rounded-full bg-current"></span>
//                     Be at least 6 characters
//                   </li>
//                   <li className={`flex items-center gap-2 ${password === confirmPassword && password ? 'text-green-500' : 'text-gray-500'}`}>
//                     <span className="w-1 h-1 rounded-full bg-current"></span>
//                     Match confirm password
//                   </li>
//                 </ul>
//               </div>

//               {/* Error message */}
//               {error && (
//                 <p className="text-red-500 text-sm flex items-start gap-2">
//                   <AlertCircle size={16} className="shrink-0 mt-0.5" />
//                   {error}
//                 </p>
//               )}

//               {/* Submit button */}
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-gray-100 transition-colors mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
//               >
//                 {loading ? (
//                   <>
//                     <Loader2 size={16} className="animate-spin" />
//                     Resetting Password...
//                   </>
//                 ) : (
//                   'Reset Password'
//                 )}
//               </button>
//             </form>

//             {/* Back to login */}
//             <p className="text-center text-gray-500 text-sm mt-6">
//               Remember your password?{' '}
//               <Link to="/user/login" className="text-white hover:underline">Sign in</Link>
//             </p>
//           </>
//         )}
//       </div>
//     </div>
//   )
// }

// export default ResetPassword



import { API_URL } from '../config/api'
import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { X, Eye, EyeOff, Check, AlertCircle, Loader2 } from 'lucide-react'

const ResetPassword = () => {
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState(false)

  const navigate = useNavigate()
  const { token: urlToken } = useParams()

  // 🔐 Password Regex (STRONG VALIDATION)
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,}$/

  useEffect(() => {
    const verifyToken = async () => {
      if (!urlToken) {
        setError('Invalid reset link')
        setVerifying(false)
        return
      }

      try {
        const res = await fetch(`${API_URL}/auth/verify-reset-token/${urlToken}`)
        const data = await res.json()

        if (data.success) {
          setTokenValid(true)
          setToken(urlToken)
        } else {
          setError(data.message || 'Invalid or expired reset link')
        }
      } catch (err) {
        setError('Failed to verify reset link')
      } finally {
        setVerifying(false)
      }
    }

    verifyToken()
  }, [urlToken])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    // 🔥 STRONG PASSWORD VALIDATION
    if (!passwordRegex.test(password)) {
      setError(
        'Password must include uppercase, lowercase, number, special character and be at least 8 characters'
      )
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')

    try {
      let res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })

      let data = await res.json()

      if (data.success) {
        setSuccess(true)
        setTimeout(() => navigate('/user/login'), 3000)
      } else {
        setError(data.message || 'Failed to reset password')
      }
    } catch (err) {
      setError('Error resetting password')
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-white" />
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="mx-auto mb-3" />
          <p>{error}</p>
          <Link to="/user/forgot-password">Request New Link</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-dark-700 p-8 rounded-xl w-full max-w-md">

        <h1 className="text-white text-xl mb-4">Reset Password</h1>

        {success ? (
          <div className="text-center text-green-500">
            <Check className="mx-auto mb-2" />
            Password updated successfully
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* PASSWORD */}
            <div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-dark-600 text-white rounded"
              />
            </div>

            {/* CONFIRM */}
            <div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 bg-dark-600 text-white rounded"
              />
            </div>

            {/* 🔥 LIVE VALIDATION UI */}
            <div className="text-xs space-y-1">
              <p className={password.length >= 8 ? 'text-green-500' : 'text-gray-400'}>
                ✔ At least 8 characters
              </p>
              <p className={/[A-Z]/.test(password) ? 'text-green-500' : 'text-gray-400'}>
                ✔ Uppercase letter
              </p>
              <p className={/[a-z]/.test(password) ? 'text-green-500' : 'text-gray-400'}>
                ✔ Lowercase letter
              </p>
              <p className={/\d/.test(password) ? 'text-green-500' : 'text-gray-400'}>
                ✔ Number
              </p>
              <p className={/[@$!%*?&#^()_\-+=]/.test(password) ? 'text-green-500' : 'text-gray-400'}>
                ✔ Special character
              </p>
            </div>

            {error && <p className="text-red-500">{error}</p>}

            <button className="w-full bg-white text-black py-2 rounded">
              {loading ? 'Loading...' : 'Reset Password'}
            </button>

          </form>
        )}

      </div>
    </div>
  )
}

export default ResetPassword;
