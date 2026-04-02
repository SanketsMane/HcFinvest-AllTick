import { API_URL } from '../config/api'
import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { 
  Building2,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  CreditCard,
  Globe,
  QrCode,
  RefreshCw,
  Upload,
  Smartphone,
  DollarSign,
  Percent
} from 'lucide-react'

const AdminBankSettings = () => {
  const [paymentMethods, setPaymentMethods] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMethod, setEditingMethod] = useState(null)
  const [form, setForm] = useState({
    type: 'Bank Transfer',
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    ifscCode: '',
    upiId: '',
    qrCodeImage: '',
    isActive: true
  })
  
  // Currency markup states
  const [currencyMarkups, setCurrencyMarkups] = useState([])
  const [showCurrencyModal, setShowCurrencyModal] = useState(false)
  const [editingCurrency, setEditingCurrency] = useState(null)
  const [currencyForm, setCurrencyForm] = useState({
    currency: 'INR',
    symbol: '₹',
    rateToUSD: 83,
    markup: 0,
    isActive: true
  })

  // Bank requests states
  const [activeTab, setActiveTab] = useState('methods') // methods, requests
  const [bankRequests, setBankRequests] = useState([])
  const [requestStats, setRequestStats] = useState({ pending: 0, approved: 0, rejected: 0 })
  const [requestFilter, setRequestFilter] = useState('Pending')

  useEffect(() => {
    fetchPaymentMethods()
    fetchCurrencyMarkups()
    fetchBankRequests()
    fetchRequestStats()
  }, [])

  useEffect(() => {
    fetchBankRequests()
  }, [requestFilter])

  const fetchBankRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/payment-methods/admin/bank-requests?status=${requestFilter}`)
      const data = await res.json()
      setBankRequests(data.requests || [])
    } catch (error) {
      console.error('Error fetching bank requests:', error)
    }
  }

  const fetchRequestStats = async () => {
    try {
      const res = await fetch(`${API_URL}/payment-methods/admin/bank-requests/stats`)
      const data = await res.json()
      setRequestStats(data.stats || { pending: 0, approved: 0, rejected: 0 })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleApproveRequest = async (id) => {
    try {
      const res = await fetch(`${API_URL}/payment-methods/admin/bank-requests/${id}/approve`, {
        method: 'PUT'
      })
      const data = await res.json()
      if (data.success) {
        alert('Bank account approved!')
        fetchBankRequests()
        fetchRequestStats()
      }
    } catch (error) {
      alert('Error approving request')
    }
  }

  const handleRejectRequest = async (id) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return

    try {
      const res = await fetch(`${API_URL}/payment-methods/admin/bank-requests/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      const data = await res.json()
      if (data.success) {
        alert('Bank account rejected!')
        fetchBankRequests()
        fetchRequestStats()
      }
    } catch (error) {
      alert('Error rejecting request')
    }
  }

  const fetchCurrencyMarkups = async () => {
    try {
      const res = await fetch(`${API_URL}/payment-methods/currencies`)
      const data = await res.json()
      setCurrencyMarkups(data.currencies || [])
    } catch (error) {
      console.error('Error fetching currencies:', error)
    }
  }

  // Common currencies with symbols
  const commonCurrencies = [
    { currency: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { currency: 'EUR', symbol: '€', name: 'Euro' },
    { currency: 'GBP', symbol: '£', name: 'British Pound' },
    { currency: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { currency: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { currency: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { currency: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
    { currency: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { currency: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { currency: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { currency: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
    { currency: 'THB', symbol: '฿', name: 'Thai Baht' },
    { currency: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
    { currency: 'PHP', symbol: '₱', name: 'Philippine Peso' },
    { currency: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
    { currency: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
    { currency: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
    { currency: 'ZAR', symbol: 'R', name: 'South African Rand' },
    { currency: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    { currency: 'MXN', symbol: '$', name: 'Mexican Peso' },
  ]

  // Fetch live exchange rates
  const fetchLiveRates = async () => {
    try {
      const res = await fetch(`${API_URL}/payment-methods/currencies/live-rates`)
      const data = await res.json()
      if (data.success && data.rates) {
        alert(`Live rates fetched! ${Object.keys(data.rates).length} currencies updated.`)
        fetchCurrencyMarkups()
      } else {
        alert(data.message || 'Failed to fetch live rates')
      }
    } catch (error) {
      console.error('Error fetching live rates:', error)
      alert('Error fetching live rates')
    }
  }

  // Add all common currencies with live rates
  const addAllCurrencies = async () => {
    if (!confirm('This will add all common currencies with live exchange rates. Continue?')) return
    
    try {
      const res = await fetch(`${API_URL}/payment-methods/currencies/add-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currencies: commonCurrencies })
      })
      const data = await res.json()
      if (data.success) {
        alert(`Added ${data.addedCount} currencies with live rates!`)
        fetchCurrencyMarkups()
      } else {
        alert(data.message || 'Failed to add currencies')
      }
    } catch (error) {
      console.error('Error adding currencies:', error)
      alert('Error adding currencies')
    }
  }

  // Update single currency with live rate
  const updateLiveRate = async (currencyCode) => {
    try {
      const res = await fetch(`${API_URL}/payment-methods/currencies/update-rate/${currencyCode}`, {
        method: 'PUT'
      })
      const data = await res.json()
      if (data.success) {
        alert(`${currencyCode} rate updated to ${data.rate}`)
        fetchCurrencyMarkups()
      } else {
        alert(data.message || 'Failed to update rate')
      }
    } catch (error) {
      alert('Error updating rate')
    }
  }

  const handleSaveCurrency = async () => {
    try {
      const url = editingCurrency 
        ? `${API_URL}/payment-methods/currencies/${editingCurrency._id}`
        : `${API_URL}/payment-methods/currencies`
      const method = editingCurrency ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currencyForm)
      })
      const data = await res.json()
      
      if (res.ok) {
        alert(editingCurrency ? 'Currency updated!' : 'Currency added!')
        setShowCurrencyModal(false)
        setEditingCurrency(null)
        resetCurrencyForm()
        fetchCurrencyMarkups()
      } else {
        alert(data.message || 'Error saving currency')
      }
    } catch (error) {
      alert('Error saving currency')
    }
  }

  const handleDeleteCurrency = async (id) => {
    if (!confirm('Are you sure you want to delete this currency?')) return
    try {
      const res = await fetch(`${API_URL}/payment-methods/currencies/${id}`, { method: 'DELETE' })
      if (res.ok) {
        alert('Currency deleted!')
        fetchCurrencyMarkups()
      }
    } catch (error) {
      alert('Error deleting currency')
    }
  }

  const openEditCurrencyModal = (currency) => {
    setEditingCurrency(currency)
    setCurrencyForm({
      currency: currency.currency,
      symbol: currency.symbol,
      rateToUSD: currency.rateToUSD,
      markup: currency.markup || 0,
      isActive: currency.isActive
    })
    setShowCurrencyModal(true)
  }

  const resetCurrencyForm = () => {
    setCurrencyForm({
      currency: 'INR',
      symbol: '₹',
      rateToUSD: 83,
      markup: 0,
      isActive: true
    })
  }

  const fetchPaymentMethods = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/payment-methods/all`)
      const data = await res.json()
      setPaymentMethods(data.paymentMethods || [])
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    try {
      const url = editingMethod 
        ? `${API_URL}/payment-methods/${editingMethod._id}`
        : `${API_URL}/payment-methods`
      const method = editingMethod ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      
      if (res.ok) {
        alert(editingMethod ? 'Payment method updated!' : 'Payment method created!')
        setShowAddModal(false)
        setEditingMethod(null)
        resetForm()
        fetchPaymentMethods()
      } else {
        alert(data.message || 'Error saving payment method')
      }
    } catch (error) {
      alert('Error saving payment method')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return
    try {
      const res = await fetch(`${API_URL}/payment-methods/${id}`, { method: 'DELETE' })
      if (res.ok) {
        alert('Payment method deleted!')
        fetchPaymentMethods()
      }
    } catch (error) {
      alert('Error deleting payment method')
    }
  }

  const handleToggleStatus = async (method) => {
    try {
      await fetch(`${API_URL}/payment-methods/${method._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !method.isActive })
      })
      fetchPaymentMethods()
    } catch (error) {
      alert('Error updating status')
    }
  }

  const openEditModal = (method) => {
    setEditingMethod(method)
    setForm({
      type: method.type,
      bankName: method.bankName || '',
      accountNumber: method.accountNumber || '',
      accountHolderName: method.accountHolderName || '',
      ifscCode: method.ifscCode || '',
      upiId: method.upiId || '',
      qrCodeImage: method.qrCodeImage || '',
      isActive: method.isActive
    })
    setShowAddModal(true)
  }

  const resetForm = () => {
    setForm({
      type: 'Bank Transfer',
      bankName: '',
      accountNumber: '',
      accountHolderName: '',
      ifscCode: '',
      upiId: '',
      qrCodeImage: '',
      isActive: true
    })
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setForm({ ...form, qrCodeImage: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const bankMethods = paymentMethods.filter(m => m.type === 'Bank Transfer')
  const upiMethods = paymentMethods.filter(m => m.type === 'UPI')
  const qrMethods = paymentMethods.filter(m => m.type === 'QR Code')

  return (
    <AdminLayout title="Bank Settings" subtitle="Manage bank accounts and payment methods">
      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl mb-8 w-fit shadow-inner">
        <button
          onClick={() => setActiveTab('methods')}
          className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${
            activeTab === 'methods' 
              ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Payment Methods
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${
            activeTab === 'requests' 
              ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Bank Requests
          {requestStats.pending > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] rounded-full animate-pulse shadow-lg shadow-red-100">
              {requestStats.pending}
            </span>
          )}
        </button>
      </div>

      {/* Bank Requests Tab */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm shadow-slate-100 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 sm:p-8 border-b border-slate-50">
            <div>
              <h2 className="text-slate-900 font-black text-2xl tracking-tight">Bank Verification Requests</h2>
              <p className="text-slate-500 text-sm font-medium mt-1">Review and manage user-submitted payout methods</p>
            </div>
            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 w-fit">
              {['Pending', 'Approved', 'Rejected'].map(status => (
                <button
                  key={status}
                  onClick={() => setRequestFilter(status)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    requestFilter === status
                      ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {status} <span className="ml-1 opacity-50">({requestStats[status.toLowerCase()] || 0})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-4">
            {bankRequests.length === 0 ? (
              <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <RefreshCw size={24} className="text-slate-300" />
                </div>
                <p className="text-slate-500 font-bold italic">No {requestFilter.toLowerCase()} requests found</p>
              </div>
            ) : (
              bankRequests.map((req) => (
                <div key={req._id} className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-slate-200 hover:shadow-xl hover:shadow-slate-100 transition-all group">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          req.type === 'Bank Transfer' ? 'bg-blue-500/20 text-blue-500' : 'bg-purple-500/20 text-purple-500'
                        }`}>
                          {req.type}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          req.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-500' :
                          req.status === 'Approved' ? 'bg-green-500/20 text-green-500' :
                          'bg-red-500/20 text-red-500'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-slate-900 font-medium">{req.userId?.firstName} {req.userId?.lastName}</p>
                        <p className="text-gray-500 text-sm">{req.userId?.email}</p>
                        <p className="text-gray-500 text-xs font-mono">User ID: {req.userId?._id}</p>
                      </div>

                      {req.type === 'Bank Transfer' ? (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-500">Bank Name</p>
                            <p className="text-slate-900">{req.bankName}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Account Number</p>
                            <p className="text-slate-900 font-mono">{req.accountNumber}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Account Holder</p>
                            <p className="text-slate-900">{req.accountHolderName}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">IFSC Code</p>
                            <p className="text-slate-900 font-mono">{req.ifscCode}</p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-gray-500 text-sm">UPI ID</p>
                          <p className="text-purple-400 font-mono text-lg">{req.upiId}</p>
                        </div>
                      )}

                      {req.rejectionReason && (
                        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <p className="text-red-400 text-sm">Rejection Reason: {req.rejectionReason}</p>
                        </div>
                      )}

                      <p className="text-gray-500 text-xs mt-3">
                        Submitted: {new Date(req.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {req.status === 'Pending' && (
                      <div className="flex sm:flex-col gap-2">
                        <button
                          onClick={() => handleApproveRequest(req._id)}
                          className="flex-1 sm:flex-none px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-1"
                        >
                          <Check size={16} /> Approve
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req._id)}
                          className="flex-1 sm:flex-none px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-1"
                        >
                          <X size={16} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Payment Methods Tab */}
      {activeTab === 'methods' && (
        <>
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={fetchPaymentMethods}
              className="p-3 bg-white border border-slate-200 hover:border-blue-400 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm active:scale-95"
              title="Refresh"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={() => { resetForm(); setEditingMethod(null); setShowAddModal(true) }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 font-black text-xs uppercase tracking-widest active:scale-95"
            >
              <Plus size={18} />
              Add Payment Method
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-80 bg-white rounded-3xl border border-slate-200 shadow-sm">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
                <RefreshCw size={32} className="animate-spin text-blue-400" />
              </div>
              <p className="text-slate-500 font-bold italic">Loading secure data...</p>
            </div>
          ) : (
            <>
              {/* Bank Accounts */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden mb-8 shadow-sm shadow-slate-100">
                <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shadow-inner">
                      <Building2 size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-slate-900 font-black text-xl tracking-tight">Bank Accounts</h2>
                      <p className="text-slate-500 text-sm font-medium">Standard transfer gateways</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-4">
                  {bankMethods.length === 0 ? (
                    <p className="text-slate-400 text-center py-10 font-bold italic">No bank profiles added yet</p>
                  ) : (
                    bankMethods.map((bank) => (
                      <div key={bank._id} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all group">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                            <Building2 size={28} className="text-blue-500" />
                          </div>
                          <div>
                            <p className="text-slate-900 font-black text-lg">{bank.bankName}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                              <p className="text-slate-500 text-sm font-bold">A/C: <span className="text-slate-900 font-mono tracking-wider">{bank.accountNumber}</span></p>
                              <p className="text-slate-500 text-sm font-bold">IFSC: <span className="text-slate-900 font-mono">{bank.ifscCode}</span></p>
                            </div>
                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-2">Holder: {bank.accountHolderName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleStatus(bank)}
                            className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all ${
                              bank.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            {bank.isActive ? 'Active' : 'Inactive'}
                          </button>
                          <div className="h-8 w-px bg-slate-200 hidden lg:block mx-1"></div>
                          <button 
                            onClick={() => openEditModal(bank)}
                            className="p-3 bg-white border border-slate-200 hover:border-blue-400 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(bank._id)}
                            className="p-3 bg-white border border-slate-200 hover:border-red-400 rounded-xl text-slate-400 hover:text-red-500 transition-all shadow-sm"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* UPI Methods */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden mb-8 shadow-sm shadow-slate-100">
                <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center shadow-inner">
                      <Smartphone size={24} className="text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-slate-900 font-black text-xl tracking-tight">UPI Management</h2>
                      <p className="text-slate-500 text-sm font-medium">Digital wallet endpoints</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-4">
                  {upiMethods.length === 0 ? (
                    <p className="text-slate-400 text-center py-10 font-bold italic">No active UPI IDs</p>
                  ) : (
                    upiMethods.map((upi) => (
                      <div key={upi._id} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-purple-200 transition-all group">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                            <Smartphone size={28} className="text-purple-500" />
                          </div>
                          <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Global UPI Endpoint</p>
                            <p className="text-purple-600 text-2xl font-black font-mono tracking-tight">{upi.upiId}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleStatus(upi)}
                            className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all ${
                              upi.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            {upi.isActive ? 'Active' : 'Inactive'}
                          </button>
                          <div className="h-8 w-px bg-slate-200 hidden lg:block mx-1"></div>
                          <button 
                            onClick={() => openEditModal(upi)}
                            className="p-3 bg-white border border-slate-200 hover:border-blue-400 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(upi._id)}
                            className="p-3 bg-white border border-slate-200 hover:border-red-400 rounded-xl text-slate-400 hover:text-red-500 transition-all shadow-sm"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* QR Codes */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden mb-8 shadow-sm shadow-slate-100">
                <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center shadow-inner">
                      <QrCode size={24} className="text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-slate-900 font-black text-xl tracking-tight">QR Gateways</h2>
                      <p className="text-slate-500 text-sm font-medium">Instant scan to pay profiles</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-4">
                  {qrMethods.length === 0 ? (
                    <p className="text-slate-400 text-center py-10 font-bold italic">No QR scan methods configured</p>
                  ) : (
                    qrMethods.map((qr) => (
                      <div key={qr._id} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-orange-200 transition-all group">
                        <div className="flex items-center gap-5">
                          {qr.qrCodeImage ? (
                            <div className="relative group/qr">
                              <img src={qr.qrCodeImage} alt="QR Code" className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md group-hover/qr:scale-110 transition-transform cursor-pointer" />
                              <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover/qr:opacity-100 transition-opacity flex items-center justify-center">
                                <QrCode size={20} className="text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                              <QrCode size={32} className="text-slate-300" />
                            </div>
                          )}
                          <div>
                            <p className="text-slate-900 font-black text-lg">Visual QR Scan</p>
                            <p className="text-slate-500 text-sm font-medium">Direct deposit method via image scan</p>
                            <span className="inline-block mt-2 px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest rounded-md border border-orange-100">Instant Verification</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleStatus(qr)}
                            className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all ${
                              qr.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            {qr.isActive ? 'Active' : 'Inactive'}
                          </button>
                          <div className="h-8 w-px bg-slate-200 hidden lg:block mx-1"></div>
                          <button 
                            onClick={() => openEditModal(qr)}
                            className="p-3 bg-white border border-slate-200 hover:border-blue-400 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(qr._id)}
                            className="p-3 bg-white border border-slate-200 hover:border-red-400 rounded-xl text-slate-400 hover:text-red-500 transition-all shadow-sm"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Currency Markups Section */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden mb-8 shadow-sm shadow-slate-100">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 sm:p-8 border-b border-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center shadow-inner">
                      <Globe size={24} className="text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-slate-900 font-black text-xl tracking-tight">Global Forex Rates</h2>
                      <p className="text-slate-500 text-sm font-medium">Manage currency conversions and profit margins</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={addAllCurrencies}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all font-bold text-xs uppercase tracking-widest"
                    >
                      <Globe size={14} />
                      Add All
                    </button>
                    <button 
                      onClick={fetchLiveRates}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all font-bold text-xs uppercase tracking-widest"
                    >
                      <RefreshCw size={14} />
                      Refetch Live
                    </button>
                    <button 
                      onClick={() => { resetCurrencyForm(); setEditingCurrency(null); setShowCurrencyModal(true) }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 font-bold text-xs uppercase tracking-widest"
                    >
                      <Plus size={14} />
                      Add Custom
                    </button>
                  </div>
                </div>
            <div className="p-6 sm:p-8 space-y-4">
              {currencyMarkups.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <Globe size={48} className="text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold italic mb-6">No active currency configs found</p>
                  <button 
                    onClick={addAllCurrencies}
                    className="px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 font-black text-xs uppercase tracking-widest transition-all"
                  >
                    Load Standard Presets
                  </button>
                </div>
              ) : (
                currencyMarkups.map((curr) => (
                  <div key={curr._id} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-green-200 transition-all group">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl font-black text-slate-900 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                        {curr.symbol}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="text-slate-900 font-black text-xl tracking-tight">{curr.currency}</p>
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest rounded">Forex Ready</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm font-bold">
                          <p className="text-slate-500">Live Rate: <span className="text-slate-900 font-mono">1 USD = {curr.symbol}{curr.rateToUSD?.toFixed(2)}</span></p>
                          <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                          <p className="text-slate-500">Markup: <span className="text-blue-600">+{curr.markup}%</span></p>
                        </div>
                        <p className="text-green-600 text-xs font-black uppercase tracking-widest mt-2 flex items-center gap-1">
                          <Check size={12} /> Final Rate: 1 USD = {curr.symbol}{((curr.rateToUSD || 0) * (1 + (curr.markup || 0) / 100)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateLiveRate(curr.currency)}
                        className="p-3 bg-white border border-slate-200 hover:border-purple-400 rounded-xl text-slate-400 hover:text-purple-600 transition-all shadow-sm"
                        title="Sync Live Rate"
                      >
                        <RefreshCw size={18} />
                      </button>
                      <div className="h-8 w-px bg-slate-200 hidden lg:block mx-1"></div>
                      <button 
                        onClick={() => openEditCurrencyModal(curr)}
                        className="p-3 bg-white border border-slate-200 hover:border-blue-400 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCurrency(curr._id)}
                        className="p-3 bg-white border border-slate-200 hover:border-red-400 rounded-xl text-slate-400 hover:text-red-500 transition-all shadow-sm"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </>
  )}

      {/* Add/Edit Payment Method Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-8 border-b border-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shadow-inner">
                  <CreditCard size={28} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-slate-900 font-black text-2xl tracking-tight">
                    {editingMethod ? 'Refine Method' : 'Add Gateway'}
                  </h3>
                  <p className="text-slate-500 font-medium text-sm">Configure deposit parameters</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowAddModal(false); setEditingMethod(null); }} 
                className="text-slate-400 hover:text-slate-900 p-3 hover:bg-slate-100 rounded-2xl transition-all"
              >
                <X size={28} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <label className="block text-slate-900 text-xs font-black uppercase tracking-widest mb-3 italic">Gateway Architecture</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Bank Transfer', 'UPI', 'QR Code'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm({ ...form, type })}
                      className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                        form.type === type 
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md shadow-blue-50' 
                          : 'border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {form.type === 'Bank Transfer' && (
                <div className="space-y-5 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="col-span-2">
                      <label className="block text-slate-700 text-sm font-bold mb-2">Banking Institution</label>
                      <input
                        type="text"
                        value={form.bankName}
                        onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                        placeholder="e.g., Chase, HDFC, Barclays"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-sm font-bold mb-2">Account Number</label>
                      <input
                        type="text"
                        value={form.accountNumber}
                        onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                        placeholder="0000 0000 0000"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-mono font-bold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-sm font-bold mb-2">IFSC / SWIFT Code</label>
                      <input
                        type="text"
                        value={form.ifscCode}
                        onChange={(e) => setForm({ ...form, ifscCode: e.target.value })}
                        placeholder="AAAA0123456"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-mono font-bold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-700 text-sm font-bold mb-2">Beneficiary Name</label>
                    <input
                      type="text"
                      value={form.accountHolderName}
                      onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })}
                      placeholder="Legal Name on Account"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                    />
                  </div>
                </div>
              )}

              {form.type === 'UPI' && (
                <div className="animate-in slide-in-from-top-2">
                  <label className="block text-slate-700 text-sm font-bold mb-2">Unified Payment ID (UPI ID)</label>
                  <input
                    type="text"
                    value={form.upiId}
                    onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                    placeholder="user@bankname"
                    className="w-full bg-purple-50 border-2 border-purple-100 rounded-2xl px-5 py-5 text-purple-700 font-mono font-black text-xl placeholder-purple-300 focus:outline-none focus:border-purple-500 focus:bg-white transition-all shadow-inner"
                  />
                  <p className="text-slate-400 text-xs mt-3 italic">Direct digital wallet endpoint for instant processing</p>
                </div>
              )}

              {form.type === 'QR Code' && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                  <label className="block text-slate-700 text-sm font-bold mb-2">Visual Scan Media</label>
                  <div className="relative group/upload h-64 bg-slate-50 border-4 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center transition-all hover:bg-slate-100 hover:border-orange-200">
                    <input
                      type="file"
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    {form.qrCodeImage ? (
                      <div className="relative w-full h-full p-4">
                        <img src={form.qrCodeImage} alt="QR Preview" className="w-full h-full object-contain rounded-2xl" />
                        <div className="absolute inset-x-0 bottom-6 flex justify-center">
                          <span className="bg-orange-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">Replace Asset</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-8">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover/upload:scale-110 transition-transform">
                          <Upload size={32} className="text-slate-300 group-hover:text-orange-500 transition-colors" />
                        </div>
                        <p className="text-slate-500 font-bold">Drop QR Media here</p>
                        <p className="text-slate-400 text-xs mt-1">High resolution PNG/JPG recommended</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-50 rounded-b-[2.5rem] flex gap-4">
              <button
                onClick={() => { setShowAddModal(false); setEditingMethod(null); }}
                className="flex-1 bg-white border-2 border-slate-100 text-slate-500 py-4 rounded-2xl hover:bg-slate-100 hover:text-slate-900 transition-all font-black text-xs uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 text-xs uppercase tracking-widest"
              >
                {editingMethod ? 'Save Changes' : 'Deploy Gateway'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Currency Modal */}
      {showCurrencyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center shadow-inner">
                    <DollarSign size={28} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-black text-2xl tracking-tight">
                      {editingCurrency ? 'Update Rate' : 'New Currency'}
                    </h3>
                    <p className="text-slate-500 font-medium text-sm">Forex profile configuration</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setShowCurrencyModal(false); setEditingCurrency(null); }} 
                  className="text-slate-400 hover:text-slate-900 p-3 hover:bg-slate-100 rounded-2xl transition-all"
                >
                  <X size={28} />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-700 text-sm font-bold mb-2">ISO Code</label>
                  <input
                    type="text"
                    value={currencyForm.currency}
                    onChange={(e) => setCurrencyForm({ ...currencyForm, currency: e.target.value.toUpperCase() })}
                    placeholder="USD, EUR, INR"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-black text-xl placeholder-slate-400 focus:outline-none focus:border-green-500 focus:bg-white transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 text-sm font-bold mb-2">Symbol</label>
                  <input
                    type="text"
                    value={currencyForm.symbol}
                    onChange={(e) => setCurrencyForm({ ...currencyForm, symbol: e.target.value })}
                    placeholder="$, €, ₹"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-black text-xl placeholder-slate-400 focus:outline-none focus:border-green-500 focus:bg-white transition-all shadow-inner text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-sm font-bold mb-2">Base Conversion (to 1 USD)</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$1.00 = </span>
                  <input
                    type="number"
                    step="0.0001"
                    value={currencyForm.rateToUSD}
                    onChange={(e) => setCurrencyForm({ ...currencyForm, rateToUSD: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-20 pr-5 py-4 text-slate-900 font-black text-xl placeholder-slate-400 focus:outline-none focus:border-green-500 focus:bg-white transition-all shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-sm font-bold mb-2">Profit Markup (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={currencyForm.markup}
                    onChange={(e) => setCurrencyForm({ ...currencyForm, markup: parseFloat(e.target.value) })}
                    className="w-full bg-blue-50 border-2 border-blue-100 rounded-2xl px-5 py-4 text-blue-700 font-black text-xl placeholder-blue-300 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                  />
                  <Percent size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-400" />
                </div>
                <p className="text-slate-400 text-xs mt-3 italic">Final rate seen by users: {(currencyForm.rateToUSD * (1 + currencyForm.markup / 100)).toFixed(2)} {currencyForm.currency}</p>
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-50 rounded-b-[2.5rem] flex gap-4">
              <button
                onClick={() => { setShowCurrencyModal(false); setEditingCurrency(null); }}
                className="flex-1 bg-white border-2 border-slate-100 text-slate-500 py-4 rounded-2xl hover:bg-slate-100 hover:text-slate-900 transition-all font-black text-xs uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCurrency}
                className="flex-1 bg-green-600 text-white font-black py-4 rounded-2xl hover:bg-green-700 shadow-xl shadow-green-100 transition-all active:scale-95 text-xs uppercase tracking-widest"
              >
                {editingCurrency ? 'Sync Changes' : 'Activate Forex'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminBankSettings
