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
      <div className="flex justify-end mb-6">
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-blue-600 shadow-lg shadow-slate-200 transition-all active:scale-95 group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Add Account Type
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {accountTypes.map((type) => (
                <div 
                  key={type._id} 
                  className={`group bg-white rounded-2xl p-5 border transition-all duration-300 hover:shadow-lg flex flex-col ${type.isActive ? 'border-slate-200' : 'border-red-100 bg-red-50/10 opacity-70'}`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border ${type.isDemo ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <h3 className="text-slate-900 font-bold text-base tracking-tight leading-none mb-1">{type.name}</h3>
                        {type.isDemo && (
                          <span className="text-amber-600 text-[9px] font-bold uppercase tracking-widest bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">Sandbox</span>
                        )}
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full shadow-sm ${type.isActive ? 'bg-green-500 shadow-green-200' : 'bg-red-500 shadow-red-200'}`} title={type.isActive ? 'Active' : 'Disabled'} />
                  </div>

                  {/* Description */}
                  <p className="text-slate-500 text-xs font-medium mb-5 line-clamp-2 min-h-[32px] leading-relaxed">
                    {type.description || 'Professional trading account setup.'}
                  </p>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                      <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-1">Min Deposit</p>
                      <p className="text-slate-900 font-bold text-sm leading-none">${type.minDeposit?.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                      <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-1">Leverage</p>
                      <p className="text-slate-900 font-bold text-sm leading-none">{type.leverage}</p>
                    </div>
                    <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                      <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-1">Spread</p>
                      <p className="text-slate-900 font-bold text-sm leading-none">{type.minSpread || 0} pips</p>
                    </div>
                    <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                      <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-1">Commission</p>
                      <p className="text-slate-900 font-bold text-sm leading-none">{type.commission > 0 ? `$${type.commission}` : '0'}</p>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-3 col-span-2 shadow-sm flex items-center justify-between">
                      <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                        {type.isDemo ? 'Virtual Balance' : 'Exposure Limit'}
                      </p>
                      <p className="text-white font-bold text-sm leading-none">
                        ${(type.isDemo ? type.demoBalance : type.exposureLimit || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-auto border-t border-slate-50 pt-4">
                    <button
                      onClick={() => openEditModal(type)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-slate-50 text-slate-700 py-2.5 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all border border-slate-100 shadow-sm"
                    >
                      <Edit size={12} className="text-slate-400" /> Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(type)}
                      className={`px-3 py-2.5 rounded-lg transition-all text-xs font-bold border ${type.isActive ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}
                      title={type.isActive ? 'Disable' : 'Enable'}
                    >
                      {type.isActive ? <Check size={14} className="mx-auto" /> : <Plus size={14} className="mx-auto" />}
                    </button>
                    <button
                      onClick={() => handleDelete(type._id)}
                      className="px-3 py-2.5 bg-white text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all border border-slate-200"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <CreditCard size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingType ? 'Edit Account Type' : 'Create Account Type'}
                  </h2>
                  <p className="text-xs font-medium text-slate-500">Fine-tune trading parameters and limits</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-2 hover:bg-slate-50 text-slate-400 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Account Category Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., ECN, Professional, VIP"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief objective overview..."
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Min Deposit ($)</label>
                    <input
                      type="number"
                      value={formData.minDeposit}
                      onChange={(e) => setFormData({ ...formData, minDeposit: e.target.value })}
                      placeholder="100"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Max Leverage</label>
                    <div className="flex items-center gap-2">
                      <div className="bg-slate-100 px-3 py-3 rounded-xl text-slate-500 font-bold text-sm border border-slate-200">1:</div>
                      <input
                        type="number"
                        min="1"
                        value={formData.leverage.replace('1:', '')}
                        onChange={(e) => setFormData({ ...formData, leverage: `1:${e.target.value}` })}
                        placeholder="100"
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Min Spread (Pips)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.minSpread}
                      onChange={(e) => setFormData({ ...formData, minSpread: e.target.value })}
                      placeholder="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Commission ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.commission}
                      onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                      placeholder="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-slate-900 uppercase tracking-wider">Demo Simulation</span>
                      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Virtual capital sandbox</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isDemo: !formData.isDemo })}
                      className={`w-12 h-6 rounded-full transition-all p-1 ${formData.isDemo ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${formData.isDemo ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  
                  {formData.isDemo ? (
                    <div className="pt-4 border-t border-slate-200 animate-in slide-in-from-top-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 ml-1">Starting Allocation ($)</label>
                      <input
                        type="number"
                        value={formData.demoBalance}
                        onChange={(e) => setFormData({ ...formData, demoBalance: e.target.value })}
                        className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-lg font-bold text-blue-600 focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                      />
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-slate-200 animate-in slide-in-from-top-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 ml-1">Exposure Limit ($)</label>
                      <input
                        type="number"
                        value={formData.exposureLimit}
                        onChange={(e) => setFormData({ ...formData, exposureLimit: e.target.value })}
                        placeholder="0 for no limit"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                      />
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[10px] font-bold uppercase tracking-widest text-center animate-pulse">
                    {error}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-3.5 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-blue-600 shadow-xl shadow-slate-200 transition-all active:scale-95"
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
