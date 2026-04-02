import { API_URL } from '../config/api'
import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { 
  Settings, Save, RefreshCw, Check, X, AlertTriangle, 
  DollarSign, Shield, Bitcoin, Wallet,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle, XCircle 
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const AdminOxapay = () => {
  const { modeColors } = useTheme()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [activeTab, setActiveTab] = useState('config')
  
  // Gateway config
  const [config, setConfig] = useState({
    isActive: false,
    depositEnabled: true,
    minDeposit: 10,
    maxDeposit: 100000,
    withdrawalEnabled: false,
    minWithdrawal: 10,
    maxWithdrawal: 50000,
    depositFeePercent: 0,
    depositFeeFixed: 0,
    description: '',
    instructions: '',
    supportedCryptos: [],
    hasMerchantApiKey: false
  })


  // Transactions
  const [transactions, setTransactions] = useState([])
  const [txLoading, setTxLoading] = useState(false)
  const [txPage, setTxPage] = useState(1)
  const [txTotal, setTxTotal] = useState(0)
  const [txFilter, setTxFilter] = useState('')

  // Payouts
  const [payouts, setPayouts] = useState([])
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [payoutForm, setPayoutForm] = useState({
    userId: '',
    userEmail: '',
    amount: '',
    cryptoCurrency: 'USDT',
    walletAddress: '',
    adminNotes: ''
  })
  const [users, setUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')

  // Withdrawal Requests
  const [withdrawalRequests, setWithdrawalRequests] = useState([])
  const [withdrawalLoading, setWithdrawalLoading] = useState(false)
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0)

  // Stats
  const [stats, setStats] = useState({
    byStatus: [],
    totalDeposits: { count: 0, totalAmount: 0 },
    todayDeposits: { count: 0, totalAmount: 0 },
    totalPayouts: { count: 0, totalAmount: 0 }
  })

  // Get admin token for authenticated requests
  const getAuthHeaders = () => {
    const adminToken = localStorage.getItem('adminToken')
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  }

  useEffect(() => {
    fetchConfig()
    fetchStats()
    fetchWithdrawalRequests()
  }, [])

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions()
    }
    if (activeTab === 'payouts') {
      fetchPayouts()
    }
    if (activeTab === 'withdrawals') {
      fetchWithdrawalRequests()
    }
  }, [activeTab, txPage, txFilter])

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/oxapay/admin/config`, {
        headers: getAuthHeaders()
      })
      const data = await res.json()
      if (data.success && data.gateway) {
        setConfig({
          isActive: data.gateway.isActive || false,
          depositEnabled: data.gateway.depositEnabled !== false,
          minDeposit: data.gateway.minDeposit || 10,
          maxDeposit: data.gateway.maxDeposit || 100000,
          withdrawalEnabled: data.gateway.withdrawalEnabled || false,
          minWithdrawal: data.gateway.minWithdrawal || 10,
          maxWithdrawal: data.gateway.maxWithdrawal || 50000,
          depositFeePercent: data.gateway.depositFeePercent || 0,
          depositFeeFixed: data.gateway.depositFeeFixed || 0,
          description: data.gateway.description || '',
          instructions: data.gateway.instructions || '',
          supportedCryptos: data.gateway.supportedCryptos || [],
          hasMerchantApiKey: data.gateway.hasMerchantApiKey || false
        })
      }
    } catch (error) {
      console.error('Error fetching config:', error)
      setMessage({ type: 'error', text: 'Failed to load configuration' })
    }
    setLoading(false)
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/oxapay/admin/stats`, {
        headers: getAuthHeaders()
      })
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchTransactions = async () => {
    setTxLoading(true)
    try {
      let url = `${API_URL}/oxapay/admin/transactions?page=${txPage}&limit=20`
      if (txFilter) url += `&status=${txFilter}`
      
      const res = await fetch(url, {
        headers: getAuthHeaders()
      })
      const data = await res.json()
      if (data.success) {
        setTransactions(data.transactions || [])
        setTxTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
    setTxLoading(false)
  }

  const fetchPayouts = async () => {
    setPayoutLoading(true)
    try {
      const res = await fetch(`${API_URL}/oxapay/admin/payouts?limit=50`, {
        headers: getAuthHeaders()
      })
      const data = await res.json()
      if (data.success) {
        setPayouts(data.payouts || [])
        if (data.stats?.totalPayouts) {
          setStats(prev => ({ ...prev, totalPayouts: data.stats.totalPayouts }))
        }
      }
    } catch (error) {
      console.error('Error fetching payouts:', error)
    }
    setPayoutLoading(false)
  }

  const searchUsers = async (search) => {
    if (!search || search.length < 2) {
      setUsers([])
      return
    }
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: getAuthHeaders()
      })
      const data = await res.json()
      if (data.users) {
        const filtered = data.users.filter(u => 
          u.email?.toLowerCase().includes(search.toLowerCase()) ||
          u.firstName?.toLowerCase().includes(search.toLowerCase())
        ).slice(0, 10)
        setUsers(filtered)
      }
    } catch (error) {
      console.error('Error searching users:', error)
    }
  }

  const fetchWithdrawalRequests = async () => {
    setWithdrawalLoading(true)
    try {
      const res = await fetch(`${API_URL}/oxapay/admin/withdrawal-requests?status=pending`, {
        headers: getAuthHeaders()
      })
      const data = await res.json()
      if (data.success) {
        setWithdrawalRequests(data.requests || [])
        setPendingWithdrawals(data.pendingCount || 0)
      }
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error)
    }
    setWithdrawalLoading(false)
  }

  const handleApproveWithdrawal = async (id) => {
    if (!confirm('Are you sure you want to approve this withdrawal? This will process the crypto payout.')) return
    
    setWithdrawalLoading(true)
    try {
      const res = await fetch(`${API_URL}/oxapay/admin/approve-withdrawal/${id}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ adminNotes: 'Approved by admin' })
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Withdrawal approved and processing!' })
        fetchWithdrawalRequests()
        fetchStats()
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to approve withdrawal' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error approving withdrawal' })
    }
    setWithdrawalLoading(false)
  }

  const handleRejectWithdrawal = async (id) => {
    const reason = prompt('Enter rejection reason (optional):')
    
    setWithdrawalLoading(true)
    try {
      const res = await fetch(`${API_URL}/oxapay/admin/reject-withdrawal/${id}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason: reason || 'Rejected by admin' })
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Withdrawal rejected and user refunded!' })
        fetchWithdrawalRequests()
        fetchStats()
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to reject withdrawal' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error rejecting withdrawal' })
    }
    setWithdrawalLoading(false)
  }

  const handleCreatePayout = async () => {
    if (!payoutForm.userId || !payoutForm.amount || !payoutForm.walletAddress) {
      setMessage({ type: 'error', text: 'User, amount, and wallet address are required' })
      return
    }

    setPayoutLoading(true)
    try {
      const res = await fetch(`${API_URL}/oxapay/admin/payout`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: payoutForm.userId,
          amount: parseFloat(payoutForm.amount),
          cryptoCurrency: payoutForm.cryptoCurrency,
          walletAddress: payoutForm.walletAddress,
          adminNotes: payoutForm.adminNotes
        })
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Payout created successfully!' })
        setShowPayoutModal(false)
        setPayoutForm({ userId: '', userEmail: '', amount: '', cryptoCurrency: 'USDT', walletAddress: '', adminNotes: '' })
        fetchPayouts()
        fetchStats()
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to create payout' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error creating payout' })
    }
    setPayoutLoading(false)
  }

  const handleSaveConfig = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })
    
    try {
      // Only save config settings, not API keys (API keys are managed in server .env)
      const payload = {
        ...config
      }

      const res = await fetch(`${API_URL}/oxapay/admin/config`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      })
      
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Configuration saved successfully!' })
        fetchConfig()
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save configuration' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving configuration' })
    }
    setSaving(false)
  }

  const handleManualCredit = async (transactionId) => {
    if (!confirm('Are you sure you want to manually credit this transaction?')) return
    
    try {
      const res = await fetch(`${API_URL}/oxapay/admin/manual-credit/${transactionId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ adminNotes: 'Manually credited by admin' })
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Transaction credited successfully!' })
        fetchTransactions()
        fetchStats()
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error crediting transaction' })
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-500',
      processing: 'bg-blue-500/20 text-blue-500',
      success: 'bg-green-500/20 text-green-500',
      failed: 'bg-red-500/20 text-red-500',
      expired: 'bg-gray-500/20 text-gray-500',
      cancelled: 'bg-gray-500/20 text-gray-500'
    }
    return styles[status] || 'bg-gray-500/20 text-gray-500'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle size={14} />
      case 'failed': return <XCircle size={14} />
      case 'pending': return <Clock size={14} />
      case 'processing': return <RefreshCw size={14} className="animate-spin" />
      default: return <Clock size={14} />
    }
  }

  return (
    <AdminLayout title="Oxapay Gateway" subtitle="Crypto payment gateway configuration and management">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-orange-500/20">
              <Bitcoin size={24} className="text-orange-500" />
            </div>
            <div>
              <h1 style={{ color: modeColors.text }} className="text-xl font-bold">Oxapay Payment Gateway</h1>
              <p style={{ color: modeColors.textSecondary }} className="text-sm">Manage crypto deposits and automated payouts</p>
            </div>
          </div>
          <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${config.isActive ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
            {config.isActive ? 'Active' : 'Inactive'}
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div style={{ backgroundColor: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', borderColor: message.type === 'error' ? '#EF4444' : '#22C55E' }} className={`mb-6 p-4 rounded-xl border flex items-center justify-between ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            <div className="flex items-center gap-3">
              {message.type === 'error' ? <XCircle size={20} /> : <CheckCircle size={20} />}
              <p className="font-semibold text-sm sm:text-base">{message.text}</p>
            </div>
            <button onClick={() => setMessage({ type: '', text: '' })} className="p-1 hover:bg-black/5 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-xl p-5 border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                <ArrowUpRight size={20} className="text-green-600" />
              </div>
              <span style={{ color: modeColors.textSecondary }} className="text-xs font-bold uppercase tracking-wider">Total Volume</span>
            </div>
            <p style={{ color: modeColors.text }} className="text-2xl font-bold">${stats.totalDeposits?.totalAmount?.toFixed(2) || '0.00'}</p>
            <p className="text-gray-400 text-xs mt-1">{stats.totalDeposits?.count || 0} Successful deposits</p>
          </div>
          
          <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-xl p-5 border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <DollarSign size={20} className="text-blue-600" />
              </div>
              <span style={{ color: modeColors.textSecondary }} className="text-xs font-bold uppercase tracking-wider">Today</span>
            </div>
            <p style={{ color: modeColors.text }} className="text-2xl font-bold">${stats.todayDeposits?.totalAmount?.toFixed(2) || '0.00'}</p>
            <p className="text-gray-400 text-xs mt-1">{stats.todayDeposits?.count || 0} New deposits today</p>
          </div>
          
          <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-xl p-5 border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                <Clock size={20} className="text-yellow-600" />
              </div>
              <span style={{ color: modeColors.textSecondary }} className="text-xs font-bold uppercase tracking-wider">Awaiting</span>
            </div>
            <p style={{ color: modeColors.text }} className="text-2xl font-bold">
              {stats.byStatus?.find(s => s._id === 'pending')?.count || 0}
            </p>
            <p className="text-gray-400 text-xs mt-1">Pending verification</p>
          </div>
          
          <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-xl p-5 border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                <XCircle size={20} className="text-red-600" />
              </div>
              <span style={{ color: modeColors.textSecondary }} className="text-xs font-bold uppercase tracking-wider">Unpaid</span>
            </div>
            <p style={{ color: modeColors.text }} className="text-2xl font-bold">
              {stats.byStatus?.find(s => s._id === 'failed' || s._id === 'expired')?.count || 0}
            </p>
            <p className="text-gray-400 text-xs mt-1">Failed / Expired invoices</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { id: 'config', label: 'Configuration', icon: Settings },
            { id: 'withdrawals', label: 'Withdrawals', icon: Wallet, count: pendingWithdrawals },
            { id: 'transactions', label: 'Deposits', icon: ArrowUpRight },
            { id: 'payouts', label: 'Payouts', icon: DollarSign }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ 
                backgroundColor: activeTab === tab.id ? '#F97316' : modeColors.card,
                color: activeTab === tab.id ? '#FFFFFF' : modeColors.textSecondary,
                borderColor: activeTab === tab.id ? '#F97316' : modeColors.border
              }}
              className="px-5 py-2.5 rounded-xl font-bold transition-all text-sm sm:text-base flex items-center gap-2 border shadow-sm active:scale-[0.98] relative"
            >
              <tab.icon size={18} />
              {tab.label}
              {tab.count > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center border-2 border-white shadow-sm font-bold animate-pulse">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Configuration Tab */}
        {activeTab === 'config' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* General Settings */}
            <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-2xl p-8 border shadow-sm">
              <h3 style={{ color: modeColors.text }} className="font-bold text-xl mb-6 flex items-center gap-3">
                <Settings size={22} className="text-orange-500" />
                Gateway Rules
              </h3>
              
              <div className="space-y-6">
                <div style={{ backgroundColor: modeColors.bgSecondary }} className="p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p style={{ color: modeColors.text }} className="font-bold">Master Toggle</p>
                    <p style={{ color: modeColors.textSecondary }} className="text-xs">Turn the entire gateway on or off</p>
                  </div>
                  <button
                    onClick={() => setConfig({ ...config, isActive: !config.isActive })}
                    className={`w-14 h-7 rounded-full transition-all relative ${config.isActive ? 'bg-green-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${config.isActive ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>

                <div style={{ backgroundColor: modeColors.bgSecondary }} className="p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p style={{ color: modeColors.text }} className="font-bold">Deposit Access</p>
                    <p style={{ color: modeColors.textSecondary }} className="text-xs">Enable/disable the deposit feature</p>
                  </div>
                  <button
                    onClick={() => setConfig({ ...config, depositEnabled: !config.depositEnabled })}
                    className={`w-14 h-7 rounded-full transition-all relative ${config.depositEnabled ? 'bg-green-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${config.depositEnabled ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label style={{ color: modeColors.textSecondary }} className="block text-sm mb-2 font-medium">Minimum Deposit ($)</label>
                    <input
                      type="number"
                      value={config.minDeposit}
                      onChange={(e) => setConfig({ ...config, minDeposit: parseFloat(e.target.value) || 0 })}
                      style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                      className="w-full px-4 py-3 border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                  <div>
                    <label style={{ color: modeColors.textSecondary }} className="block text-sm mb-2 font-medium">Maximum Deposit ($)</label>
                    <input
                      type="number"
                      value={config.maxDeposit}
                      onChange={(e) => setConfig({ ...config, maxDeposit: parseFloat(e.target.value) || 0 })}
                      style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                      className="w-full px-4 py-3 border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label style={{ color: modeColors.textSecondary }} className="block text-sm mb-2 font-medium">Fee Percentage (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={config.depositFeePercent}
                      onChange={(e) => setConfig({ ...config, depositFeePercent: parseFloat(e.target.value) || 0 })}
                      style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                      className="w-full px-4 py-3 border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                  <div>
                    <label style={{ color: modeColors.textSecondary }} className="block text-sm mb-2 font-medium">Fixed Service Fee ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={config.depositFeeFixed}
                      onChange={(e) => setConfig({ ...config, depositFeeFixed: parseFloat(e.target.value) || 0 })}
                      style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                      className="w-full px-4 py-3 border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* API Status Info */}
            <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-2xl p-8 border shadow-sm">
              <h3 style={{ color: modeColors.text }} className="font-bold text-xl mb-6 flex items-center gap-3">
                <Shield size={22} className="text-blue-500" />
                Backend API Connection
              </h3>
              
              <div className="space-y-6">
                <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.05)', borderColor: 'rgba(34, 197, 94, 0.2)' }} className="p-5 border rounded-xl flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-sm border-2 border-white">
                    <Check size={20} />
                  </div>
                  <div>
                    <p className="text-green-700 font-bold mb-1">Environment Verified</p>
                    <p className="text-green-600 text-sm leading-relaxed">
                      Oxapay API keys are securely integrated within the server-side environment. Gateway logic is initialized and ready for production.
                    </p>
                  </div>
                </div>

                <div style={{ backgroundColor: 'rgba(249, 115, 22, 0.05)', borderColor: 'rgba(249, 115, 22, 0.2)' }} className="p-5 border rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertTriangle size={20} className="text-orange-500" />
                    <p className="text-orange-700 font-bold">Inbound Webhook Verification</p>
                  </div>
                  <p className="text-orange-600 text-sm mb-4 leading-relaxed">
                    Automated payment confirmations require the following Webhook URL to be set in your Oxapay Merchant Dashboard:
                  </p>
                  <div style={{ backgroundColor: modeColors.bgSecondary }} className="p-4 rounded-xl border border-orange-200/30 flex items-center justify-between group">
                    <code className="text-xs font-mono text-orange-700 break-all select-all">
                      https://api.hcfinvest.com/api/oxapay/webhook
                    </code>
                    <RefreshCw size={14} className="text-orange-400 group-hover:rotate-180 transition-transform cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Withdrawal Requests Tab */}
        {activeTab === 'withdrawals' && (
          <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-2xl border overflow-hidden shadow-sm">
            <div style={{ borderBottomColor: modeColors.border }} className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 style={{ color: modeColors.text }} className="font-bold text-lg">Pending Withdrawals</h3>
                <p style={{ color: modeColors.textSecondary }} className="text-sm">{pendingWithdrawals} verification tasks outstanding</p>
              </div>
              <button
                onClick={fetchWithdrawalRequests}
                style={{ backgroundColor: modeColors.bgSecondary, color: modeColors.textSecondary }}
                className="p-2 rounded-xl hover:text-orange-500 transition-colors shadow-sm"
              >
                <RefreshCw size={20} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead style={{ backgroundColor: modeColors.bgSecondary }}>
                  <tr>
                    <th style={{ color: modeColors.textSecondary }} className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Date & Time</th>
                    <th style={{ color: modeColors.textSecondary }} className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Subscriber</th>
                    <th style={{ color: modeColors.textSecondary }} className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Payout Amount</th>
                    <th style={{ color: modeColors.textSecondary }} className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Network</th>
                    <th style={{ color: modeColors.textSecondary }} className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Destination Address</th>
                    <th style={{ color: modeColors.textSecondary }} className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Process</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {withdrawalLoading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-20">
                        <RefreshCw size={40} className="text-orange-500 animate-spin mx-auto opacity-20" />
                        <p className="text-gray-400 mt-4 font-medium animate-pulse">Syncing requests...</p>
                      </td>
                    </tr>
                  ) : withdrawalRequests.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-20">
                        <CheckCircle size={48} className="text-green-500/20 mx-auto mb-4" />
                        <p style={{ color: modeColors.textSecondary }} className="font-bold">Queue is clear! No pending requests.</p>
                      </td>
                    </tr>
                  ) : (
                    withdrawalRequests.map(req => (
                      <tr key={req._id} className="hover:bg-slate-50 transition-colors group">
                        <td className="py-5 px-6">
                          <p style={{ color: modeColors.textSecondary }} className="text-xs font-mono">
                            {new Date(req.createdAt).toLocaleString()}
                          </p>
                        </td>
                        <td className="py-5 px-6">
                          <p style={{ color: modeColors.text }} className="font-bold group-hover:text-orange-500 transition-colors">{req.userId?.firstName || 'Unknown'}</p>
                          <p style={{ color: modeColors.textSecondary }} className="text-xs">{req.userId?.email || ''}</p>
                        </td>
                        <td className="py-5 px-6 text-white font-medium">
                          <span className="px-3 py-1 bg-green-500 text-white font-bold rounded-lg shadow-sm">
                            ${req.amount?.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <span style={{ backgroundColor: modeColors.bgSecondary }} className="px-3 py-1 rounded-lg text-xs font-bold text-slate-600 border border-slate-200">
                            {req.cryptoCurrency || 'USDT'}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <p style={{ color: modeColors.textSecondary }} className="text-xs font-mono truncate max-w-[180px] bg-slate-100 p-2 rounded-lg" title={req.paymentAddress}>
                            {req.paymentAddress}
                          </p>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveWithdrawal(req._id)}
                              className="px-4 py-2 bg-green-500 text-white font-bold rounded-xl text-xs hover:bg-green-600 shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectWithdrawal(req._id)}
                              className="px-4 py-2 bg-red-500 text-white font-bold rounded-xl text-xs hover:bg-red-600 shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-2xl border overflow-hidden shadow-sm">
            {/* Filters */}
            <div style={{ borderBottomColor: modeColors.border }} className="p-6 border-b flex flex-col sm:flex-row items-center gap-4">
              <div className="relative">
                <select
                  value={txFilter}
                  onChange={(e) => { setTxFilter(e.target.value); setTxPage(1) }}
                  style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                  className="px-5 py-2.5 border rounded-xl font-bold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/10 min-w-[200px]"
                >
                  <option value="">All Transactions</option>
                  <option value="pending">🟡 Pending Invoices</option>
                  <option value="processing">🔵 Processing</option>
                  <option value="success">🟢 Confirmed / Success</option>
                  <option value="failed">🔴 Failed / Cancelled</option>
                  <option value="expired">⚪ Expired</option>
                </select>
              </div>
              <button
                onClick={fetchTransactions}
                style={{ backgroundColor: modeColors.bgSecondary, color: modeColors.textSecondary }}
                className="p-3 rounded-xl hover:text-orange-500 transition-colors shadow-sm"
              >
                <RefreshCw size={20} />
              </button>
              <div className="sm:ml-auto">
                <p style={{ color: modeColors.textSecondary }} className="text-sm font-bold bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
                  Total Ledger: <span className="text-orange-500">{txTotal}</span> entries
                </p>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead style={{ backgroundColor: modeColors.bgSecondary }}>
                  <tr>
                    <th style={{ color: modeColors.textSecondary }} className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Entry Date</th>
                    <th style={{ color: modeColors.textSecondary }} className="py-4 px-6 text-xs font-bold uppercase tracking-wider">User Account</th>
                    <th style={{ color: modeColors.textSecondary }} className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Fiat Amount</th>
                    <th style={{ color: modeColors.textSecondary }} className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Crypto Data</th>
                    <th style={{ color: modeColors.textSecondary }} className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Final Status</th>
                    <th style={{ color: modeColors.textSecondary }} className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Credited</th>
                    <th style={{ color: modeColors.textSecondary }} className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {txLoading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-20 text-gray-500">
                        <RefreshCw size={40} className="text-orange-500 animate-spin mx-auto opacity-20" />
                        <p className="mt-4 font-bold">Fetching ledger...</p>
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-20">
                        <Bitcoin size={48} className="text-slate-200 mx-auto mb-4" />
                        <p style={{ color: modeColors.textSecondary }} className="font-bold">No matching transactions found</p>
                      </td>
                    </tr>
                  ) : (
                    transactions.map(tx => (
                      <tr key={tx._id} className="hover:bg-slate-50 transition-colors group">
                        <td className="py-5 px-6">
                          <p style={{ color: modeColors.textSecondary }} className="text-xs font-mono">
                            {new Date(tx.createdAt).toLocaleString()}
                          </p>
                        </td>
                        <td className="py-5 px-6">
                          <p style={{ color: modeColors.text }} className="font-bold group-hover:text-orange-500 transition-colors uppercase">{tx.userId?.firstName || 'Unknown'}</p>
                          <p style={{ color: modeColors.textSecondary }} className="text-xs italic">{tx.userId?.email || 'N/A'}</p>
                        </td>
                        <td className="py-5 px-6 text-orange-600 font-bold">
                          ${tx.amount?.toFixed(2)}
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex flex-col gap-1">
                            <span style={{ backgroundColor: modeColors.bgSecondary }} className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 border border-slate-200 w-fit">
                              {tx.cryptoCurrency || '-'}
                            </span>
                            {tx.cryptoAmount > 0 && <span style={{ color: modeColors.textSecondary }} className="text-[10px] font-mono">{tx.cryptoAmount}</span>}
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusBadge(tx.status)}`}>
                            {getStatusIcon(tx.status)}
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          {tx.walletCredited ? (
                            <span className="text-green-600 font-bold flex items-center gap-1.5 text-xs">
                              <CheckCircle size={16} /> YES
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium flex items-center gap-1.5 text-xs">
                              <Clock size={16} /> NO
                            </span>
                          )}
                        </td>
                        <td className="py-5 px-6">
                          {!tx.walletCredited && tx.status !== 'failed' && tx.status !== 'expired' && (
                            <button
                              onClick={() => handleManualCredit(tx._id)}
                              className="px-4 py-2 bg-blue-500 text-white font-bold rounded-xl text-xs hover:bg-blue-600 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                            >
                              Direct Credit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {txTotal > 20 && (
              <div style={{ borderTopColor: modeColors.border, backgroundColor: modeColors.bgSecondary }} className="p-6 border-t flex items-center justify-between">
                <button
                  onClick={() => setTxPage(p => Math.max(1, p - 1))}
                  disabled={txPage === 1}
                  style={{ backgroundColor: modeColors.card, color: modeColors.text, borderColor: modeColors.border }}
                  className="px-6 py-2 border rounded-xl font-bold disabled:opacity-30 active:scale-95 transition-all flex items-center gap-2"
                >
                  <ArrowUpRight className="rotate-[225deg]" size={18} />
                  Previous
                </button>
                <div style={{ color: modeColors.textSecondary }} className="font-bold text-sm">
                  Page {txPage} of {Math.ceil(txTotal / 20)}
                </div>
                <button
                  onClick={() => setTxPage(p => p + 1)}
                  disabled={txPage === Math.ceil(txTotal / 20)}
                  style={{ backgroundColor: modeColors.card, color: modeColors.text, borderColor: modeColors.border }}
                  className="px-6 py-2 border rounded-xl font-bold disabled:opacity-30 active:scale-95 transition-all flex items-center gap-2"
                >
                  Next
                  <ArrowUpRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}
        {/* Payouts Tab */}
        {activeTab === 'payouts' && (
          <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-2xl border overflow-hidden shadow-sm">
            {/* Header */}
            <div style={{ borderBottomColor: modeColors.border }} className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 style={{ color: modeColors.text }} className="font-bold text-lg">Crypto Payouts</h3>
                <p style={{ color: modeColors.textSecondary }} className="text-sm">Total paid: <span className="text-orange-500 font-bold">${stats.totalPayouts?.totalAmount?.toFixed(2) || '0.00'}</span></p>
              </div>
              <button
                onClick={() => setShowPayoutModal(true)}
                className="px-5 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 flex items-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all text-sm"
              >
                <ArrowDownRight size={18} /> New Payout
              </button>
            </div>

            {/* Payouts Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead style={{ backgroundColor: modeColors.bgSecondary }}>
                  <tr>
                    <th style={{ color: modeColors.textSecondary }} className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Requested At</th>
                    <th style={{ color: modeColors.textSecondary }} className="py-4 px-6 text-xs font-bold uppercase tracking-wider">User Account</th>
                    <th style={{ color: modeColors.textSecondary }} className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Fiat Amount</th>
                    <th style={{ color: modeColors.textSecondary }} className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Crypto Data</th>
                    <th style={{ color: modeColors.textSecondary }} className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payoutLoading ? (
                    <tr>
                      <td colSpan="5" className="text-center py-20">
                        <RefreshCw size={40} className="text-orange-500 animate-spin mx-auto opacity-20" />
                        <p className="text-gray-400 mt-4 font-medium animate-pulse">Syncing payouts...</p>
                      </td>
                    </tr>
                  ) : payouts.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-20">
                        <CheckCircle size={48} className="text-slate-200 mx-auto mb-4" />
                        <p style={{ color: modeColors.textSecondary }} className="font-bold">No payout history found</p>
                      </td>
                    </tr>
                  ) : (
                    payouts.map(payout => (
                      <tr key={payout._id} className="hover:bg-slate-50 transition-colors group">
                        <td className="py-5 px-6">
                          <p style={{ color: modeColors.textSecondary }} className="text-xs font-mono">
                            {new Date(payout.createdAt).toLocaleString()}
                          </p>
                        </td>
                        <td className="py-5 px-6">
                          <p style={{ color: modeColors.text }} className="font-bold group-hover:text-orange-500 transition-colors uppercase">{payout.userId?.firstName || 'Unknown'}</p>
                          <p style={{ color: modeColors.textSecondary }} className="text-xs italic">{payout.userId?.email || ''}</p>
                        </td>
                        <td className="py-5 px-6">
                          <p style={{ color: modeColors.text }} className="font-bold">${payout.amount?.toFixed(2)}</p>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex flex-col gap-1">
                            <span style={{ backgroundColor: modeColors.bgSecondary }} className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 border border-slate-200 w-fit">
                              {payout.cryptoCurrency || '-'}
                            </span>
                            {payout.cryptoAmount > 0 && <span style={{ color: modeColors.textSecondary }} className="text-[10px] font-mono">{payout.cryptoAmount}</span>}
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusBadge(payout.status)}`}>
                            {getStatusIcon(payout.status)}
                            {payout.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payout Modal */}
        {showPayoutModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-2xl w-full max-w-md border overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
              <div style={{ borderBottomColor: modeColors.border }} className="flex items-center justify-between p-6 border-b">
                <h3 style={{ color: modeColors.text }} className="font-bold text-xl">Create Crypto Payout</h3>
                <button onClick={() => setShowPayoutModal(false)} className="p-2 hover:bg-black/5 rounded-xl transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              
              <div className="p-6 space-y-5">
                <div>
                  <label style={{ color: modeColors.textSecondary }} className="block text-sm mb-2 font-medium">Search User</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => { setUserSearch(e.target.value); searchUsers(e.target.value) }}
                      placeholder="Email or Name..."
                      style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                      className="w-full px-4 py-3 border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                    {users.length > 0 && (
                      <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="absolute top-full left-0 w-full mt-2 border rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                        {users.map(user => (
                          <button
                            key={user._id}
                            onClick={() => {
                              setPayoutForm({ ...payoutForm, userId: user._id, userEmail: user.email })
                              setUserSearch(user.email)
                              setUsers([])
                            }}
                            style={{ color: modeColors.text }}
                            className="w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors text-sm border-b last:border-0 border-slate-100"
                          >
                            <span className="font-bold">{user.firstName}</span>
                            <span style={{ color: modeColors.textSecondary }} className="ml-2 font-mono text-xs">{user.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {payoutForm.userId && (
                    <div className="mt-3 flex items-center gap-2 bg-green-500/10 p-2 rounded-lg border border-green-500/20">
                      <CheckCircle size={14} className="text-green-600" />
                      <p className="text-green-700 text-xs font-bold">Matched: {payoutForm.userEmail}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={{ color: modeColors.textSecondary }} className="block text-sm mb-2 font-medium">Amount (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={payoutForm.amount}
                      onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                      style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                      className="w-full px-4 py-3 border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label style={{ color: modeColors.textSecondary }} className="block text-sm mb-2 font-medium">Currency</label>
                    <select
                      value={payoutForm.cryptoCurrency}
                      onChange={(e) => setPayoutForm({ ...payoutForm, cryptoCurrency: e.target.value })}
                      style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                      className="w-full px-4 py-3 border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    >
                      <option value="USDT">USDT</option>
                      <option value="BTC">BTC</option>
                      <option value="ETH">ETH</option>
                      <option value="LTC">LTC</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ color: modeColors.textSecondary }} className="block text-sm mb-2 font-medium">Wallet Address</label>
                  <input
                    type="text"
                    value={payoutForm.walletAddress}
                    onChange={(e) => setPayoutForm({ ...payoutForm, walletAddress: e.target.value })}
                    style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                    className="w-full px-4 py-3 border rounded-xl font-bold font-mono text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    placeholder="Recipient address..."
                  />
                </div>

                <div>
                  <label style={{ color: modeColors.textSecondary }} className="block text-sm mb-2 font-medium">Internal Notes</label>
                  <input
                    type="text"
                    value={payoutForm.adminNotes}
                    onChange={(e) => setPayoutForm({ ...payoutForm, adminNotes: e.target.value })}
                    style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                    className="w-full px-4 py-3 border rounded-xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    placeholder="Reference notes..."
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => setShowPayoutModal(false)}
                    style={{ backgroundColor: modeColors.bgSecondary, color: modeColors.text }}
                    className="flex-1 py-3 font-bold rounded-xl active:scale-[0.98] transition-all border border-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePayout}
                    disabled={payoutLoading || !payoutForm.userId || !payoutForm.amount || !payoutForm.walletAddress}
                    className="flex-[2] py-3 bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {payoutLoading ? <RefreshCw size={20} className="animate-spin" /> : <Shield size={20} />}
                    {payoutLoading ? 'Authorizing Payout...' : 'Send Payment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminOxapay
