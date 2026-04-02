import { API_URL } from '../config/api'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { 
  Check, 
  X, 
  RefreshCw, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  MoreVertical,
  ChevronRight,
  ShieldCheck
} from 'lucide-react'

const AdminTransactions = () => {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showRemarkModal, setShowRemarkModal] = useState(false)
  const [selectedTx, setSelectedTx] = useState(null)
  const [actionType, setActionType] = useState('')
  const [adminRemarks, setAdminRemarks] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken')
    if (!adminToken) navigate('/admin')
    fetchTransactions()
  }, [navigate])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/wallet/admin/transactions`)
      const data = await res.json()
      setTransactions(data.transactions || [])
    } catch (error) {
      console.error('Error:', error)
      setError('Communication sync failure with the ledger nodes.')
    }
    setLoading(false)
  }

  const handleAction = async () => {
    if (!selectedTx) return
    setProcessing(true)
    try {
      const endpoint = actionType === 'approve' ? 'approve' : 'reject'
      const res = await fetch(`${API_URL}/wallet/transaction/${selectedTx._id}/${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminRemarks })
      })
      if (res.ok) {
        setSuccess(`Transaction ${actionType}d successfully.`)
        setShowRemarkModal(false)
        setSelectedTx(null)
        setAdminRemarks('')
        fetchTransactions()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(`Failed to ${actionType} transaction.`)
      }
    } catch (error) {
      setError('Internal processing error.')
    }
    setProcessing(false)
  }

  const filteredTransactions = transactions.filter(tx => {
    const matchesFilter = filter === 'all' || 
      (filter === 'pending' && tx.status === 'Pending') ||
      (filter === 'deposits' && tx.type === 'Deposit') ||
      (filter === 'withdrawals' && tx.type === 'Withdrawal')
    
    const matchesSearch = 
      (tx.userId?.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.userId?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.status || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  })

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-50 text-green-700 border-green-100'
      case 'Rejected': return 'bg-red-50 text-red-700 border-red-100'
      default: return 'bg-yellow-50 text-yellow-700 border-yellow-100'
    }
  }

  return (
    <AdminLayout title="Global Treasury" subtitle="Synchronize and authorize cross-border capital flows">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Pending Authorizations', count: transactions.filter(t => t.status === 'Pending').length, icon: Clock, color: 'yellow' },
          { label: 'Deposit Volume (24h)', count: '$' + transactions.filter(t => t.type === 'Deposit').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString(), icon: TrendingUp, color: 'blue' },
          { label: 'Total Outflows', count: '$' + transactions.filter(t => t.type === 'Withdrawal').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString(), icon: TrendingDown, color: 'red' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 bg-${stat.color}-50 rounded-2xl flex items-center justify-center`}>
                <stat.icon className={`text-${stat.color}-600`} size={24} />
              </div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">{stat.label}</p>
            </div>
            <p className="text-slate-900 text-3xl font-black tracking-tight">{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Main Ledger Container */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm shadow-slate-100 animate-in fade-in slide-in-from-bottom-4">
        {/* Advanced Filtering Header */}
        <div className="p-6 sm:p-10 border-b border-slate-50 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
             <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                   <ShieldCheck size={28} className="text-white" />
                </div>
                <div>
                   <h2 className="text-slate-900 font-black text-2xl tracking-tight uppercase">Master Ledger</h2>
                   <p className="text-slate-600 font-bold text-xs uppercase tracking-widest mt-1">Real-time financial stream synchronization</p>
                </div>
             </div>

             <div className="flex flex-wrap items-center gap-3">
               <div className="relative">
                 <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input 
                   type="text" 
                   placeholder="Identify User or Payload..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-12 pr-6 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner w-full sm:w-64"
                 />
               </div>
               <div className="flex bg-slate-50 p-1.5 rounded-[1.2rem] border-2 border-slate-100">
                  {['all', 'pending', 'deposits', 'withdrawals'].map(f => (
                    <button 
                      key={f} 
                      onClick={() => setFilter(f)} 
                      className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white text-blue-600 shadow-xl shadow-slate-100' : 'text-slate-400 hover:text-slate-900'}`}
                    >
                      {f}
                    </button>
                  ))}
               </div>
             </div>
          </div>

          {success && (
            <div className="p-4 bg-green-50 border border-green-100 rounded-2xl text-green-700 flex items-center gap-3 font-black text-[10px] uppercase tracking-widest animate-in slide-in-from-top-2">
              <Check size={16} /> {success}
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 flex items-center gap-3 font-black text-[10px] uppercase tracking-widest">
              <AlertCircle size={16} /> {error}
            </div>
          )}
        </div>

        {/* Ledger Table Rendering */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="text-left py-6 px-10 text-slate-400 font-black text-[10px] uppercase tracking-widest">Temporal Info</th>
                <th className="text-left py-6 px-10 text-slate-400 font-black text-[10px] uppercase tracking-widest">Account Node</th>
                <th className="text-left py-6 px-10 text-slate-400 font-black text-[10px] uppercase tracking-widest">Operation</th>
                <th className="text-right py-6 px-10 text-slate-400 font-black text-[10px] uppercase tracking-widest">Payload Amount</th>
                <th className="text-center py-6 px-10 text-slate-400 font-black text-[10px] uppercase tracking-widest">State Vector</th>
                <th className="text-right py-6 px-10 text-slate-400 font-black text-[10px] uppercase tracking-widest">Protocol Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                   <td colSpan="6" className="py-24 text-center">
                      <RefreshCw size={40} className="text-slate-200 animate-spin mx-auto mb-4" />
                      <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Syncing Nodes...</p>
                   </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                   <td colSpan="6" className="py-24 text-center grayscale opacity-50">
                      <Filter size={40} className="text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 text-xs font-black uppercase tracking-widest italic">No matching operations detected</p>
                   </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-8 px-10 whitespace-nowrap">
                       <p className="text-slate-900 font-bold text-xs tracking-tight">{formatDate(tx.createdAt).split(',')[0]}</p>
                       <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic mt-0.5">{formatDate(tx.createdAt).split(',')[1]}</p>
                    </td>
                    <td className="py-8 px-10 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-900 font-black text-xs">
                          {tx.userId?.firstName?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="text-slate-900 font-black text-sm tracking-tight">{tx.userId?.firstName || 'Unknown User'}</p>
                          <p className="text-slate-500 text-[10px] font-bold truncate max-w-[120px]">{tx.userId?.email || 'origin-undefined'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-8 px-10 whitespace-nowrap">
                       <div className="flex flex-col">
                          <span className={`text-[10px] font-black uppercase tracking-widest italic mb-1 ${tx.type === 'Deposit' ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.type} Sequence
                          </span>
                          <span className="text-slate-400 text-xs font-bold">{tx.paymentMethod}</span>
                       </div>
                    </td>
                    <td className="py-8 px-10 text-right whitespace-nowrap">
                       <p className={`text-xl font-black tracking-tighter ${tx.type === 'Deposit' ? 'text-slate-900' : 'text-slate-900'}`}>
                         {tx.type === 'Deposit' ? '+' : '-'}${tx.amount.toLocaleString()}
                       </p>
                    </td>
                    <td className="py-8 px-10 text-center whitespace-nowrap">
                       <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 font-black text-[9px] uppercase tracking-widest ${getStatusStyle(tx.status)}`}>
                         <div className={`w-1.5 h-1.5 rounded-full ${tx.status === 'Approved' ? 'bg-green-500' : tx.status === 'Rejected' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`} />
                         {tx.status}
                       </div>
                    </td>
                    <td className="py-8 px-10 text-right whitespace-nowrap">
                       {tx.status === 'Pending' ? (
                          <div className="flex justify-end gap-2">
                             <button 
                               onClick={() => { setSelectedTx(tx); setActionType('approve'); setShowRemarkModal(true); }}
                               className="p-3.5 bg-white border-2 border-slate-100 text-green-600 rounded-2xl hover:bg-green-50 hover:border-green-200 transition-all shadow-sm active:scale-90"
                             >
                               <Check size={18} />
                             </button>
                             <button 
                               onClick={() => { setSelectedTx(tx); setActionType('reject'); setShowRemarkModal(true); }}
                               className="p-3.5 bg-white border-2 border-slate-100 text-red-600 rounded-2xl hover:bg-red-50 hover:border-red-200 transition-all shadow-sm active:scale-90"
                             >
                               <X size={18} />
                             </button>
                          </div>
                       ) : (
                          <button className="p-3 text-slate-200 hover:text-slate-900 transition-colors">
                             <ChevronRight size={20} />
                          </button>
                       )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Authorization Gateway (Modal) */}
      {showRemarkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-10 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
               <div className="flex items-center gap-5">
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-sm border border-white ${actionType === 'approve' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                     {actionType === 'approve' ? <Check size={32} /> : <XCircle size={32} />}
                  </div>
                  <div>
                     <h3 className="text-slate-900 font-black text-2xl tracking-tight uppercase">Protocol Execution</h3>
                     <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1 italic">Authorized Admin Override</p>
                  </div>
               </div>
            </div>

            <div className="p-10 space-y-8">
               <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 shadow-inner text-center">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 italic">Operation Payload</p>
                  <p className="text-slate-900 text-5xl font-black tracking-tighter">${selectedTx?.amount.toLocaleString()}</p>
                  <div className="flex items-center justify-center gap-3 mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                     <span>Node: {selectedTx?.userId?.firstName}</span>
                     <span>•</span>
                     <span>Type: {selectedTx?.type}</span>
                  </div>
               </div>

               <div>
                 <label className="block text-slate-900 text-[10px] font-black uppercase tracking-widest mb-3 italic">Audit Remarks (Telemetry)</label>
                 <textarea 
                   value={adminRemarks} 
                   onChange={(e) => setAdminRemarks(e.target.value)} 
                   placeholder="Add internal verification notes..." 
                   rows={3} 
                   className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner resize-none" 
                 />
               </div>
            </div>

            <div className="p-10 bg-slate-50/30 flex gap-4 border-t border-slate-50">
              <button 
                onClick={() => setShowRemarkModal(false)} 
                className="flex-1 bg-white border-2 border-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest py-5 rounded-2xl hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95"
              >
                Cancel Trace
              </button>
              <button 
                onClick={handleAction} 
                disabled={processing}
                className={`flex-[2] text-white font-black text-xs uppercase tracking-widest py-5 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${actionType === 'approve' ? 'bg-green-600 hover:bg-green-700 shadow-green-100' : 'bg-red-600 hover:bg-red-700 shadow-red-100'}`}
              >
                {processing ? <RefreshCw className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                Confirm Execution
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminTransactions
