import { API_URL } from '../config/api'
import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { 
  Plus,
  Edit,
  Trash2,
  X,
  Check,
  RefreshCw,
  CreditCard
} from 'lucide-react'

const AdminAccountTypes = () => {
  const [accountTypes, setAccountTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingType, setEditingType] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    minDeposit: '',
    leverage: '1:100',
    exposureLimit: '',
    minSpread: '0',
    commission: '0',
    isActive: true,
    isDemo: false,
    demoBalance: '10000'
  })

  useEffect(() => {
    fetchAccountTypes()
  }, [])

  const fetchAccountTypes = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/account-types/all`)
      const data = await res.json()
      setAccountTypes(data.accountTypes || [])
    } catch (error) {
      console.error('Error fetching account types:', error)
    }
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.minDeposit || !formData.leverage) {
      setError('Please fill in all required fields')
      return
    }

    try {
      const url = editingType 
        ? `${API_URL}/account-types/${editingType._id}`
        : `${API_URL}/account-types`
      
      const res = await fetch(url, {
        method: editingType ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          minDeposit: parseFloat(formData.minDeposit),
          exposureLimit: formData.exposureLimit ? parseFloat(formData.exposureLimit) : 0,
          minSpread: parseFloat(formData.minSpread) || 0,
          commission: parseFloat(formData.commission) || 0,
          isDemo: formData.isDemo,
          demoBalance: formData.isDemo ? parseFloat(formData.demoBalance) : 0
        })
      })
      const data = await res.json()
      
      if (res.ok) {
        setSuccess(editingType ? 'Account type updated!' : 'Account type created!')
        setShowModal(false)
        resetForm()
        fetchAccountTypes()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError('Error saving account type')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this account type?')) return

    try {
      const res = await fetch(`${API_URL}/account-types/${id}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        setSuccess('Account type deleted!')
        fetchAccountTypes()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (error) {
      setError('Error deleting account type')
    }
  }

  const handleToggleActive = async (type) => {
    try {
      const res = await fetch(`${API_URL}/account-types/${type._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...type, isActive: !type.isActive })
      })
      
      if (res.ok) {
        fetchAccountTypes()
      }
    } catch (error) {
      setError('Error updating account type')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      minDeposit: '',
      leverage: '1:100',
      exposureLimit: '',
      minSpread: '0',
      commission: '0',
      isActive: true,
      isDemo: false,
      demoBalance: '10000'
    })
    setEditingType(null)
    setError('')
  }

  const openEditModal = (type) => {
    setEditingType(type)
    setFormData({
      name: type.name,
      description: type.description || '',
      minDeposit: type.minDeposit.toString(),
      leverage: type.leverage,
      exposureLimit: type.exposureLimit?.toString() || '',
      minSpread: type.minSpread?.toString() || '0',
      commission: type.commission?.toString() || '0',
      isActive: type.isActive,
      isDemo: type.isDemo || false,
      demoBalance: type.demoBalance?.toString() || '10000'
    })
    setShowModal(true)
    setError('')
  }

  return (
    <AdminLayout title="Account Types" subtitle="Manage trading account types">
      <div className="flex justify-end mb-8">
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 font-bold active:scale-95"
        >
          <Plus size={18} /> Add Account Type
        </button>
      </div>

      <div>
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl text-green-600 flex items-center gap-2 font-medium animate-in fade-in slide-in-from-top-4 shadow-sm">
              <Check size={18} /> {success}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw size={32} className="text-slate-300 animate-spin" />
            </div>
          ) : accountTypes.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 border border-slate-200 text-center shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CreditCard size={40} className="text-slate-300" />
              </div>
              <h3 className="text-slate-900 font-bold text-xl mb-2">No Account Types Found</h3>
              <p className="text-slate-500 max-w-xs mx-auto">Start by creating your first trading account type to define leverage and deposit limits.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accountTypes.map((type) => (
                <div 
                  key={type._id} 
                  className={`bg-white rounded-3xl p-6 border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${type.isActive ? 'border-slate-100 shadow-xl shadow-slate-100/50' : 'border-red-50 shadow-none opacity-60'}`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${type.isDemo ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                        <CreditCard size={24} />
                      </div>
                      <div>
                        <h3 className="text-slate-900 font-black text-lg tracking-tight">{type.name}</h3>
                        {type.isDemo && (
                          <span className="text-amber-600 text-[10px] font-black uppercase tracking-widest bg-amber-50 px-1.5 py-0.5 rounded">Demo Account</span>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${type.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {type.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-slate-500 text-sm mb-6 line-clamp-2 min-h-[40px] font-medium leading-relaxed">
                    {type.description || 'Professional trading account setup with optimized parameters.'}
                  </p>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/50">
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">Min Deposit</p>
                      <p className="text-slate-900 font-black text-xl">${type.minDeposit?.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/50">
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">Leverage</p>
                      <p className="text-slate-900 font-black text-xl">{type.leverage}</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/50">
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">Min Spread</p>
                      <p className="text-slate-900 font-black text-xl">{type.minSpread || 0} <span className="text-xs font-medium">pips</span></p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/50">
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">Commission</p>
                      <p className="text-slate-900 font-black text-xl">{type.commission > 0 ? `$${type.commission}` : 'None'}</p>
                    </div>
                    {type.isDemo ? (
                      <div className="bg-amber-50 rounded-2xl p-4 col-span-2 border border-amber-100/50">
                        <p className="text-amber-600/70 text-[10px] font-black uppercase tracking-wider mb-1">Demo Balance</p>
                        <p className="text-amber-600 font-black text-xl">${(type.demoBalance || 10000).toLocaleString()}</p>
                      </div>
                    ) : (
                      <div className="bg-slate-900 rounded-2xl p-4 col-span-2 shadow-lg shadow-slate-200">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">Exposure Limit</p>
                        <p className="text-white font-black text-xl">${(type.exposureLimit || 0).toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-auto">
                    <button
                      onClick={() => openEditModal(type)}
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-3 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all group"
                    >
                      <Edit size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors" /> Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(type)}
                      className={`flex-1 py-3 rounded-xl transition-all text-sm font-bold shadow-sm ${type.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                    >
                      {type.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(type._id)}
                      className="px-4 py-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all border border-slate-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg border border-slate-200 max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shadow-inner">
                  <CreditCard size={24} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-slate-900 font-black text-xl tracking-tight">
                    {editingType ? 'Edit Account Type' : 'Create Account Type'}
                  </h3>
                  <p className="text-slate-500 text-sm font-medium">Fine-tune your trading parameters</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowModal(false); resetForm(); }} 
                className="text-slate-400 hover:text-slate-900 p-2 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 scrollbar-thin">
              {/* Account Name */}
              <div>
                <label className="block text-slate-700 text-sm font-bold mb-2">Account Type Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Standard, Premium, VIP"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-700 text-sm font-bold mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What makes this account special?"
                  rows={2}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Min Deposit & Leverage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-700 text-sm font-bold mb-2">Min Deposit ($) *</label>
                  <input
                    type="number"
                    value={formData.minDeposit}
                    onChange={(e) => setFormData({ ...formData, minDeposit: e.target.value })}
                    placeholder="100"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 text-sm font-bold mb-2">Maximum Leverage *</label>
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-100 px-4 py-3.5 rounded-xl text-slate-500 font-bold border-2 border-slate-100">1:</div>
                    <input
                      type="number"
                      min="1"
                      value={formData.leverage.replace('1:', '')}
                      onChange={(e) => setFormData({ ...formData, leverage: `1:${e.target.value}` })}
                      placeholder="100"
                      className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Exposure Limit */}
              <div>
                <label className="block text-slate-700 text-sm font-bold mb-2">Trade Exposure Limit ($)</label>
                <input
                  type="number"
                  value={formData.exposureLimit}
                  onChange={(e) => setFormData({ ...formData, exposureLimit: e.target.value })}
                  placeholder="Enter 0 for no limit"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* Min Spread and Commission */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-700 text-sm font-bold mb-2">Min Spread (pips)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.minSpread}
                    onChange={(e) => setFormData({ ...formData, minSpread: e.target.value })}
                    placeholder="0"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 text-sm font-bold mb-2">Commission per Lot ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.commission}
                    onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                    placeholder="0"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Demo Account Toggle */}
              <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-100">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <label className="text-slate-900 font-black text-base italic uppercase tracking-tight">Demo Sandbox</label>
                    <p className="text-slate-500 text-xs font-medium mt-1">Practice account with virtual capital and risk-free environment</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isDemo: !formData.isDemo })}
                    className={`w-14 h-7 rounded-full transition-all shrink-0 p-1 ${formData.isDemo ? 'bg-amber-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${formData.isDemo ? 'translate-x-7' : 'translate-x-0'}`} />
                  </button>
                </div>
                
                {formData.isDemo && (
                  <div className="mt-6 pt-6 border-t border-slate-200 animate-in slide-in-from-top-2">
                    <label className="block text-slate-700 text-sm font-bold mb-2">Starting Demo Balance ($)</label>
                    <input
                      type="number"
                      value={formData.demoBalance}
                      onChange={(e) => setFormData({ ...formData, demoBalance: e.target.value })}
                      placeholder="10000"
                      className="w-full bg-white border-2 border-amber-100 rounded-xl px-4 py-3.5 text-slate-900 font-black text-2xl placeholder-slate-300 focus:outline-none focus:border-amber-500 transition-all shadow-inner"
                    />
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border-2 border-red-100 rounded-xl text-red-600 text-sm font-bold animate-pulse text-center">
                  {error}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-4 p-6 sm:p-8 border-t border-slate-50 bg-slate-50/30 shrink-0">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="flex-1 bg-white border-2 border-slate-100 text-slate-500 py-4 rounded-2xl hover:bg-slate-50 hover:text-slate-900 transition-all font-black uppercase tracking-widest text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 uppercase tracking-widest text-xs"
              >
                {editingType ? 'Save Changes' : 'Create Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminAccountTypes
