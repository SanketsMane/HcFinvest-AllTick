import { API_URL } from '../config/api'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users,
  LogOut,
  RefreshCw,
  CreditCard,
  Settings,
  Search,
  Eye,
  Edit,
  Lock,
  X,
  Check,
  Ban
} from 'lucide-react'

const AdminAccounts = () => {
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState('Accounts')
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showResetPinModal, setShowResetPinModal] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editForm, setEditForm] = useState({
    leverage: '',
    exposureLimit: '',
    status: ''
  })
  const [newPin, setNewPin] = useState('')

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { name: 'User Management', icon: Users, path: '/admin/dashboard' },
    { name: 'Accounts', icon: CreditCard, path: '/admin/accounts' },
    { name: 'Account Types', icon: CreditCard, path: '/admin/account-types' },
    { name: 'Transactions', icon: Settings, path: '/admin/transactions' },
    { name: 'Payment Methods', icon: Settings, path: '/admin/payment-methods' },
  ]

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken')
    if (!adminToken) navigate('/admin')
    fetchAccounts()
  }, [navigate])

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/trading-accounts/all`)
      const data = await res.json()
      setAccounts(data.accounts || [])
    } catch (error) {
      console.error('Error:', error)
    }
    setLoading(false)
  }

  const handleUpdateAccount = async () => {
    if (!selectedAccount) return
    try {
      const res = await fetch(`${API_URL}/trading-accounts/${selectedAccount._id}/admin-update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      if (res.ok) {
        setSuccess('Account updated successfully!')
        setShowEditModal(false)
        setSelectedAccount(null)
        fetchAccounts()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (error) {
      setError('Error updating account')
    }
  }

  const handleResetPin = async () => {
    if (!selectedAccount || !newPin || newPin.length !== 4) {
      setError('PIN must be exactly 4 digits')
      return
    }
    try {
      const res = await fetch(`${API_URL}/trading-accounts/${selectedAccount._id}/reset-pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPin })
      })
      if (res.ok) {
        setSuccess('PIN reset successfully!')
        setShowResetPinModal(false)
        setSelectedAccount(null)
        setNewPin('')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (error) {
      setError('Error resetting PIN')
    }
  }

  const openEditModal = (account) => {
    setSelectedAccount(account)
    setEditForm({
      leverage: account.leverage,
      exposureLimit: account.exposureLimit?.toString() || '0',
      status: account.status
    })
    setShowEditModal(true)
    setError('')
  }

  const filteredAccounts = accounts.filter(acc => 
    acc.accountId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.userId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    navigate('/admin')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className={`${sidebarExpanded ? 'w-52' : 'w-16'} bg-white border-r border-slate-200 flex flex-col transition-all duration-300 shadow-sm`} onMouseEnter={() => setSidebarExpanded(true)} onMouseLeave={() => setSidebarExpanded(false)}>
        <div className="p-4 flex items-center justify-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow-md shadow-blue-200"><span className="text-white font-bold text-sm">A</span></div>
          {sidebarExpanded && <span className="text-slate-900 font-semibold tracking-tight">Admin Console</span>}
        </div>
        <nav className="flex-1 px-2 mt-4">
          {menuItems.map((item) => (
            <button key={item.name} onClick={() => navigate(item.path)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all duration-200 ${activeMenu === item.name ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-50'}`}>
              <item.icon size={18} className="flex-shrink-0" />
              {sidebarExpanded && <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>}
            </button>
          ))}
        </nav>
        <div className="p-2 border-t border-slate-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 rounded-lg">
            <LogOut size={18} />
            {sidebarExpanded && <span className="text-sm font-medium">Log Out</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Account Management</h1>
            <p className="text-slate-500 text-xs mt-0.5">Manage all user trading accounts</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 w-72 transition-all"
              />
            </div>
            <button onClick={fetchAccounts} className="p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shadow-sm group">
              <RefreshCw size={18} className={`text-slate-400 group-hover:text-slate-900 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto">
          {success && <div className="mb-4 p-4 bg-green-50 border border-green-100 rounded-xl text-green-600 flex items-center gap-2 font-medium animate-in fade-in slide-in-from-top-4 shadow-sm"><Check size={18} /> {success}</div>}
          {error && <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 font-medium animate-in fade-in slide-in-from-top-4 shadow-sm">{error}</div>}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm border-b-4 border-b-blue-500">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Accounts</p>
              <p className="text-slate-900 text-3xl font-black">{accounts.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm border-b-4 border-b-green-500">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Active</p>
              <p className="text-green-600 text-3xl font-black">{accounts.filter(a => a.status === 'Active').length}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm border-b-4 border-b-red-500">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Suspended</p>
              <p className="text-red-600 text-3xl font-black">{accounts.filter(a => a.status === 'Suspended').length}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm border-b-4 border-b-purple-500">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Balance</p>
              <p className="text-slate-900 text-3xl font-black">${accounts.reduce((sum, a) => sum + (a.balance || 0), 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Accounts Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left text-slate-500 text-xs font-bold uppercase tracking-wider py-4 px-6">Account ID</th>
                  <th className="text-left text-slate-500 text-xs font-bold uppercase tracking-wider py-4 px-6">User</th>
                  <th className="text-left text-slate-500 text-xs font-bold uppercase tracking-wider py-4 px-6">Type</th>
                  <th className="text-left text-slate-500 text-xs font-bold uppercase tracking-wider py-4 px-6">Balance</th>
                  <th className="text-left text-slate-500 text-xs font-bold uppercase tracking-wider py-4 px-6">Leverage</th>
                  <th className="text-left text-slate-500 text-xs font-bold uppercase tracking-wider py-4 px-6">Status</th>
                  <th className="text-left text-slate-500 text-xs font-bold uppercase tracking-wider py-4 px-6">Actions</th>
                </tr>
              </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="7" className="text-center py-12"><RefreshCw size={24} className="text-slate-400 animate-spin mx-auto" /></td></tr>
                  ) : filteredAccounts.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-12 text-slate-400 font-medium">{searchTerm ? 'No accounts found matching your search' : 'No trading accounts yet'}</td></tr>
                  ) : (
                    filteredAccounts.map((account) => (
                      <tr key={account._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors duration-150">
                        <td className="py-5 px-6">
                          <span className="text-blue-600 font-mono text-sm font-bold bg-blue-50 px-2 py-1 rounded">{account.accountId}</span>
                        </td>
                        <td className="py-5 px-6">
                          <div>
                            <p className="text-slate-900 font-bold">{account.userId?.firstName || 'Unknown'}</p>
                            <p className="text-slate-500 text-xs">{account.userId?.email}</p>
                          </div>
                        </td>
                        <td className="py-5 px-6 text-slate-500 text-sm font-medium">{account.accountTypeId?.name || 'N/A'}</td>
                        <td className="py-5 px-6 text-slate-900 font-black">${account.balance?.toLocaleString() || 0}</td>
                        <td className="py-5 px-6 text-slate-500 text-sm font-medium">{account.leverage}</td>
                        <td className="py-5 px-6">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                            account.status === 'Active' ? 'bg-green-100 text-green-700' :
                            account.status === 'Suspended' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {account.status}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEditModal(account)} className="p-2 hover:bg-blue-50 rounded-lg transition-all text-slate-400 hover:text-blue-600 shadow-sm" title="Edit Properties">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => { setSelectedAccount(account); setShowResetPinModal(true); setError(''); }} className="p-2 hover:bg-yellow-50 rounded-lg transition-all text-slate-400 hover:text-yellow-600 shadow-sm" title="Reset PIN">
                              <Lock size={16} />
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
      </main>

      {/* Edit Account Modal */}
      {showEditModal && selectedAccount && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-slate-900 font-bold text-xl">Edit Account</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
            </div>

            <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Account ID</p>
              <p className="text-blue-600 font-mono font-bold text-lg">{selectedAccount.accountId}</p>
              <p className="text-slate-400 text-xs mt-1">User: {selectedAccount.userId?.firstName || selectedAccount.userId?.email}</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-slate-700 text-sm font-semibold mb-2">Leverage</label>
                <select value={editForm.leverage} onChange={(e) => setEditForm({ ...editForm, leverage: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="1:50">1:50</option>
                  <option value="1:100">1:100</option>
                  <option value="1:200">1:200</option>
                  <option value="1:500">1:500</option>
                  <option value="1:1000">1:1000</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 text-sm font-semibold mb-2">Exposure Limit ($)</label>
                <input type="number" value={editForm.exposureLimit} onChange={(e) => setEditForm({ ...editForm, exposureLimit: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>

              <div>
                <label className="block text-slate-700 text-sm font-semibold mb-2">Account Status</label>
                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="Active" className="text-green-600">Active</option>
                  <option value="Suspended" className="text-red-600">Suspended</option>
                  <option value="Closed" className="text-slate-500">Closed</option>
                </select>
              </div>
            </div>

            {error && <p className="text-red-600 text-sm font-medium mt-4 p-3 bg-red-50 rounded-lg">{error}</p>}

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowEditModal(false)} className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleUpdateAccount} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95">Update Account</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset PIN Modal */}
      {showResetPinModal && selectedAccount && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-slate-900 font-bold text-xl">Reset Account PIN</h3>
              <button onClick={() => { setShowResetPinModal(false); setNewPin(''); }} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
            </div>

            <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Account Info</p>
              <p className="text-blue-600 font-mono font-bold text-lg">{selectedAccount.accountId}</p>
              <p className="text-slate-500 font-medium text-sm mt-1">{selectedAccount.userId?.firstName || selectedAccount.userId?.email}</p>
            </div>

            <div className="mb-6">
              <label className="block text-slate-700 text-sm font-semibold mb-2 text-center">New 4-digit Secure PIN</label>
              <input
                type="text"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="0 0 0 0"
                className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl px-4 py-5 text-slate-900 text-center text-4xl font-black tracking-[1em] focus:outline-none focus:border-blue-500 transition-all"
              />
              <p className="text-slate-400 text-xs text-center mt-3">Resetting PIN will take effect immediately</p>
            </div>

            {error && <p className="text-red-600 text-sm font-medium mb-4 p-3 bg-red-50 rounded-lg">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => { setShowResetPinModal(false); setNewPin(''); }} className="flex-1 bg-slate-100 text-slate-700 font-bold py-4 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleResetPin} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95">Reset Secure PIN</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminAccounts
