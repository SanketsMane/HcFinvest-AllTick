import { API_URL } from '../config/api'
import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { 
  Settings, Save, RefreshCw, Check, X, AlertTriangle, 
  DollarSign, Shield, Bitcoin, Wallet, User,
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
      const res = await fetch(`${API_URL}/oxapay/admin/config`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(config)
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

  const handleSyncStatus = async (transactionId) => {
    try {
      const res = await fetch(`${API_URL}/oxapay/admin/sync-status/${transactionId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: `Status synced: ${data.status}` })
        fetchTransactions()
        fetchStats()
      } else {
        setMessage({ type: 'error', text: data.message || 'Sync failed' })
      }
    } catch (error) {
      console.error('Sync error:', error)
      setMessage({ type: 'error', text: 'Connection error during sync' })
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      processing: 'bg-blue-50 text-blue-700 border-blue-200',
      success: 'bg-green-50 text-green-700 border-green-200',
      failed: 'bg-red-50 text-red-700 border-red-200',
      expired: 'bg-slate-50 text-slate-500 border-slate-200',
      cancelled: 'bg-slate-50 text-slate-500 border-slate-200'
    }
    return styles[status] || 'bg-slate-50 text-slate-500 border-slate-200'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle size={12} />
      case 'failed': return <XCircle size={12} />
      case 'pending': return <Clock size={12} />
      case 'processing': return <RefreshCw size={12} className="animate-spin" />
      default: return <Clock size={12} />
    }
  }

  return (
    <AdminLayout title="Oxapay Settings" subtitle="Crypto Gateway Management">
      <div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
              <Bitcoin className="text-orange-500" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 font-black tracking-tight">Oxapay Gateway</h1>
              <p className="text-slate-500 text-sm">Configure crypto deposits and manual/automated payouts</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold text-[10px] uppercase tracking-wider ${config.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${config.isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
              {config.isActive ? 'Active' : 'Offline'}
            </div>
          </div>
        </div>

        {/* Global Feedback Message */}
        {message.text && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
            {message.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
            <span className="font-bold text-sm">{message.text}</span>
            <button onClick={() => setMessage({ type: '', text: '' })} className="ml-auto p-1 hover:bg-black/5 rounded-lg">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-slate-50 rounded-lg text-slate-500"><DollarSign size={18} /></div>
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-tight">Lifetime Vol.</span>
            </div>
            <p className="text-2xl font-black text-slate-900">${stats.totalDeposits?.totalAmount?.toLocaleString() || '0.00'}</p>
            <p className="text-[10px] text-slate-400 mt-1 font-bold">{stats.totalDeposits?.count || 0} Successful deposits</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><Clock size={18} /></div>
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-tight">Today</span>
            </div>
            <p className="text-2xl font-black text-slate-900">${stats.todayDeposits?.totalAmount?.toLocaleString() || '0.00'}</p>
            <p className="text-[10px] text-slate-400 mt-1 font-bold">{stats.todayDeposits?.count || 0} New deposits</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><AlertTriangle size={18} /></div>
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-tight">Pending Sync</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.byStatus?.find(s => s._id === 'pending')?.count || 0}</p>
            <p className="text-[10px] text-slate-400 mt-1 font-bold">Awaiting verification</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><CheckCircle size={18} /></div>
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-tight">Withdrawal Queue</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{pendingWithdrawals}</p>
            <p className="text-[10px] text-slate-400 mt-1 font-bold">Requests pending approval</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 w-fit shadow-inner">
          {[
            { id: 'config', label: 'Configuration', icon: Settings },
            { id: 'transactions', label: 'History', icon: Bitcoin },
            { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpRight },
            { id: 'payouts', label: 'Direct Payouts', icon: Wallet }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <tab.icon size={16} />
              {tab.label}
              {tab.id === 'withdrawals' && pendingWithdrawals > 0 && (
                <span className="ml-1 w-5 h-5 bg-orange-500 text-white text-[10px] rounded-full flex items-center justify-center animate-bounce">{pendingWithdrawals}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'config' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* General Settings */}
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-8">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Shield size={20} className="text-slate-400" />
                  Gateway Intelligence
                </h3>

                <div className="space-y-6">
                  {/* Master Toggle */}
                  <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Master Switch</p>
                      <p className="text-[10px] text-slate-500 leading-tight">Turn entire gateway on or off for all users</p>
                    </div>
                    <button
                      onClick={() => setConfig({ ...config, isActive: !config.isActive })}
                      className={`w-14 h-7 rounded-full transition-all relative ${config.isActive ? 'bg-green-500' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${config.isActive ? 'left-8' : 'left-1'}`} />
                    </button>
                  </div>

                  {/* Deposit Access */}
                  <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Deposit Access</p>
                      <p className="text-[10px] text-slate-500 leading-tight">Allow or disallow new payment invoices</p>
                    </div>
                    <button
                      onClick={() => setConfig({ ...config, depositEnabled: !config.depositEnabled })}
                      className={`w-14 h-7 rounded-full transition-all relative ${config.depositEnabled ? 'bg-blue-500' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${config.depositEnabled ? 'left-8' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 text-[10px] font-black uppercase mb-2 ml-1">Min Deposit ($)</label>
                      <input
                        type="number"
                        value={config.minDeposit}
                        onChange={(e) => setConfig({ ...config, minDeposit: e.target.value })}
                        className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] font-black uppercase mb-2 ml-1">Max Deposit ($)</label>
                      <input
                        type="number"
                        value={config.maxDeposit}
                        onChange={(e) => setConfig({ ...config, maxDeposit: e.target.value })}
                        className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all shadow-inner"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Fee & API Status */}
              <div className="space-y-8">
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <DollarSign size={20} className="text-slate-400" />
                    Fee Infrastructure
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 text-[10px] font-black uppercase mb-2 ml-1">Percentage (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={config.depositFeePercent}
                        onChange={(e) => setConfig({ ...config, depositFeePercent: e.target.value })}
                        className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] font-black uppercase mb-2 ml-1">Fixed Fee ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={config.depositFeeFixed}
                        onChange={(e) => setConfig({ ...config, depositFeeFixed: e.target.value })}
                        className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-3xl p-8 text-white space-y-6">
                   <h3 className="text-lg font-black flex items-center gap-2 text-slate-100">
                    <Shield size={20} className="text-slate-500" />
                    Backend System
                  </h3>
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-slate-400 text-[10px] font-bold uppercase">Webhooks</span>
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded-lg border border-blue-500/10 tracking-widest">STABLE</span>
                    </div>
                    <code className="text-[10px] text-white/50 block break-all font-mono leading-relaxed select-all">
                      https://api.hcfinvest.com/api/oxapay/webhook
                    </code>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                    Credentials (Merchant Key, Payout Key) are safely managed via server-side environment variables and are not exposed in browser sessions.
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button Bar */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center gap-3 disabled:opacity-50"
              >
                {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-black text-slate-900">Transaction History</h3>
              <div className="flex gap-2">
                <select 
                  value={txFilter} 
                  onChange={(e) => setTxFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
                <button onClick={fetchTransactions} className="p-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-colors">
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID / User</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Crypto</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {txLoading ? (
                    <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-bold">Loading...</td></tr>
                  ) : transactions.length === 0 ? (
                    <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-bold">No records found</td></tr>
                  ) : transactions.map(tx => (
                    <tr key={tx._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="text-xs font-mono font-bold text-slate-900 mb-1">{tx.gatewayOrderId || tx._id.slice(-8)}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{tx.userId?.firstName || 'User'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${tx.type === 'deposit' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-slate-900">${tx.amount?.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{new Date(tx.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-slate-700 uppercase">{tx.cryptoCurrency} {tx.cryptoAmount}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border uppercase ${getStatusBadge(tx.status)}`}>
                          {getStatusIcon(tx.status)}
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleSyncStatus(tx._id)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all shadow-sm"
                            title="Force Sync"
                          >
                            <RefreshCw size={14} />
                          </button>
                          {tx.status === 'pending' && (
                            <button 
                              onClick={() => handleManualCredit(tx._id)}
                              className="px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-lg hover:bg-black transition-all shadow-sm"
                            >
                              Direct Credit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Withdrawal Requests Tab */}
        {activeTab === 'withdrawals' && (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-lg">Withdrawal Verification Queue</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User / Date</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Destination Address</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {withdrawalLoading ? (
                    <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-bold">Scanning queue...</td></tr>
                  ) : withdrawalRequests.length === 0 ? (
                    <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Queue Clear</td></tr>
                  ) : withdrawalRequests.map(req => (
                    <tr key={req._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-slate-900 mb-1">{req.userId?.firstName || 'Client'}</p>
                        <p className="text-[10px] text-slate-400">{new Date(req.createdAt).toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-slate-900">${req.amount?.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{req.cryptoCurrency} ({req.network})</p>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-[10px] font-mono bg-white px-2 py-1 rounded border border-slate-100 text-slate-600 block w-fit max-w-[200px] truncate select-all">{req.walletAddress}</code>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleRejectWithdrawal(req._id)}
                            className="px-4 py-2 bg-white text-red-600 text-[10px] font-black rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 transition-all"
                          >
                            Reject
                          </button>
                          <button 
                            onClick={() => handleApproveWithdrawal(req._id)}
                            className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black rounded-xl hover:bg-black transition-all shadow-lg shadow-slate-900/10"
                          >
                            Approve Payout
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Direct Payouts (Admin Only) */}
        {activeTab === 'payouts' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Direct Crypto Payout</h3>
                  <p className="text-slate-500 text-xs font-medium">Instantly send funds from master wallet to any client address</p>
                </div>
                <button 
                  onClick={() => setShowPayoutModal(true)}
                  className="px-6 py-3 bg-slate-900 text-white font-black rounded-2xl flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all text-sm shadow-xl shadow-slate-900/10"
                >
                  <ArrowUpRight size={18} />
                  Initiate New Payout
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction ID</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-400">
                    {payoutLoading ? (
                      <tr><td colSpan="4" className="px-6 py-12 text-center font-bold">Synchronizing...</td></tr>
                    ) : payouts.length === 0 ? (
                      <tr><td colSpan="4" className="px-6 py-12 text-center text-[10px] font-black uppercase tracking-widest">No payout history</td></tr>
                    ) : payouts.map(po => (
                      <tr key={po._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono font-bold text-slate-900">{po.trackId || po._id.slice(-8)}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-700">{po.userId?.firstName || 'Admin Transfer'}</td>
                        <td className="px-6 py-4 text-sm font-black text-slate-900">${po.amount?.toFixed(2)}</td>
                        <td className="px-6 py-4">
                           <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border uppercase ${getStatusBadge(po.status)}`}>
                            {getStatusIcon(po.status)}
                            {po.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">Direct Payout Auth</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Authorized Admins Only</p>
              </div>
              <button onClick={() => setShowPayoutModal(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="relative">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Search User (Email/Name)</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value)
                      searchUsers(e.target.value)
                    }}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all placeholder:text-slate-300 shadow-inner"
                    placeholder="Type to search..."
                  />
                </div>
                
                {users.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden">
                    {users.map(u => (
                      <button
                        key={u._id}
                        onClick={() => {
                          setPayoutForm({ ...payoutForm, userId: u._id, userEmail: u.email })
                          setUsers([])
                          setUserSearch(u.email)
                        }}
                        className="w-full px-5 py-4 text-left hover:bg-slate-50 flex flex-col gap-0.5 border-b border-slate-50 last:border-0"
                      >
                        <span className="font-bold text-slate-900 text-sm">{u.firstName} {u.lastName}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{u.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Amount ($)</label>
                  <input
                    type="number"
                    value={payoutForm.amount}
                    onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all shadow-inner"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Asset</label>
                  <select
                    value={payoutForm.cryptoCurrency}
                    onChange={(e) => setPayoutForm({ ...payoutForm, cryptoCurrency: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all"
                  >
                    <option value="USDT">USDT (TRC20)</option>
                    <option value="BTC">BTC</option>
                    <option value="ETH">ETH (ERC20)</option>
                    <option value="LTC">LTC</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Destination Wallet Address</label>
                <input
                  type="text"
                  value={payoutForm.walletAddress}
                  onChange={(e) => setPayoutForm({ ...payoutForm, walletAddress: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all shadow-inner"
                  placeholder="Enter recipient address..."
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1 py-4 font-black text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreatePayout}
                  disabled={payoutLoading}
                  className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {payoutLoading ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                  {payoutLoading ? 'Relaying...' : 'Confirm Payout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminOxapay
