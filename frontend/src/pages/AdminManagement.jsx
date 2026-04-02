import { API_URL } from '../config/api'
import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { 
  Shield,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Key,
  Mail,
  Calendar,
  X,
  Wallet,
  Users,
  DollarSign,
  Link,
  Copy,
  Check,
  AlertCircle,
  Lock,
  ArrowRight,
  Clock
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const AdminManagement = () => {
  const { modeColors } = useTheme()
  const [searchTerm, setSearchTerm] = useState('')
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFundModal, setShowFundModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [copiedSlug, setCopiedSlug] = useState(null)
  
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    urlSlug: '',
    brandName: '',
    permissions: {}
  })
  
  const [fundAmount, setFundAmount] = useState('')
  const [fundDescription, setFundDescription] = useState('')

  const allPermissions = [
    { key: 'canManageUsers', label: 'Manage Users', category: 'Users' },
    { key: 'canCreateUsers', label: 'Create Users', category: 'Users' },
    { key: 'canDeleteUsers', label: 'Delete Users', category: 'Users' },
    { key: 'canViewUsers', label: 'View Users', category: 'Users' },
    { key: 'canManageTrades', label: 'Manage Trades', category: 'Trading' },
    { key: 'canCloseTrades', label: 'Close Trades', category: 'Trading' },
    { key: 'canModifyTrades', label: 'Modify Trades', category: 'Trading' },
    { key: 'canManageAccounts', label: 'Manage Accounts', category: 'Accounts' },
    { key: 'canCreateAccounts', label: 'Create Accounts', category: 'Accounts' },
    { key: 'canDeleteAccounts', label: 'Delete Accounts', category: 'Accounts' },
    { key: 'canModifyLeverage', label: 'Modify Leverage', category: 'Accounts' },
    { key: 'canManageDeposits', label: 'Manage Deposits', category: 'Finance' },
    { key: 'canApproveDeposits', label: 'Approve Deposits', category: 'Finance' },
    { key: 'canManageWithdrawals', label: 'Manage Withdrawals', category: 'Finance' },
    { key: 'canApproveWithdrawals', label: 'Approve Withdrawals', category: 'Finance' },
    { key: 'canManageKYC', label: 'Manage KYC', category: 'KYC' },
    { key: 'canApproveKYC', label: 'Approve KYC', category: 'KYC' },
    { key: 'canManageIB', label: 'Manage IB', category: 'IB' },
    { key: 'canApproveIB', label: 'Approve IB', category: 'IB' },
    { key: 'canManageCopyTrading', label: 'Manage Copy Trading', category: 'Copy Trade' },
    { key: 'canApproveMasters', label: 'Approve Masters', category: 'Copy Trade' },
    { key: 'canManageSymbols', label: 'Manage Symbols', category: 'Settings' },
    { key: 'canManageGroups', label: 'Manage Groups', category: 'Settings' },
    { key: 'canManageSettings', label: 'Manage Settings', category: 'Settings' },
    { key: 'canManageTheme', label: 'Manage Theme', category: 'Settings' },
    { key: 'canViewReports', label: 'View Reports', category: 'Reports' },
    { key: 'canExportReports', label: 'Export Reports', category: 'Reports' },
  ]

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      const res = await fetch(`${API_URL}/admin-mgmt/admins`)
      const data = await res.json()
      if (data.success) {
        setAdmins(data.admins || [])
      }
    } catch (error) {
      console.error('Error fetching admins:', error)
    }
    setLoading(false)
  }

  const handleCreateAdmin = async () => {
    try {
      const res = await fetch(`${API_URL}/admin-mgmt/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin)
      })
      const data = await res.json()
      if (data.success) {
        alert('Admin created successfully!')
        setShowAddModal(false)
        setNewAdmin({ email: '', password: '', firstName: '', lastName: '', phone: '', urlSlug: '', brandName: '', permissions: {} })
        fetchAdmins()
      } else {
        alert(data.message || 'Failed to create admin')
      }
    } catch (error) {
      alert('Error creating admin')
    }
  }

  const handleUpdateAdmin = async () => {
    try {
      const res = await fetch(`${API_URL}/admin-mgmt/admins/${selectedAdmin._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: selectedAdmin.firstName,
          lastName: selectedAdmin.lastName,
          phone: selectedAdmin.phone,
          brandName: selectedAdmin.brandName,
          status: selectedAdmin.status
        })
      })
      const data = await res.json()
      if (data.success) {
        alert('Admin updated successfully!')
        setShowEditModal(false)
        fetchAdmins()
      } else {
        alert(data.message || 'Failed to update admin')
      }
    } catch (error) {
      alert('Error updating admin')
    }
  }

  const handleUpdatePermissions = async () => {
    try {
      const res = await fetch(`${API_URL}/admin-mgmt/admins/${selectedAdmin._id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: selectedAdmin.permissions })
      })
      const data = await res.json()
      if (data.success) {
        alert('Permissions updated successfully!')
        setShowPermissionsModal(false)
        fetchAdmins()
      } else {
        alert(data.message || 'Failed to update permissions')
      }
    } catch (error) {
      alert('Error updating permissions')
    }
  }

  const handleFundAdmin = async () => {
    try {
      const res = await fetch(`${API_URL}/admin-mgmt/wallet/fund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: selectedAdmin._id,
          amount: parseFloat(fundAmount),
          description: fundDescription
        })
      })
      const data = await res.json()
      if (data.success) {
        alert(data.message)
        setShowFundModal(false)
        setFundAmount('')
        setFundDescription('')
        fetchAdmins()
      } else {
        alert(data.message || 'Failed to fund admin')
      }
    } catch (error) {
      alert('Error funding admin')
    }
  }

  const handleToggleStatus = async (admin) => {
    const newStatus = admin.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    try {
      const res = await fetch(`${API_URL}/admin-mgmt/admins/${admin._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      const data = await res.json()
      if (data.success) {
        fetchAdmins()
      }
    } catch (error) {
      alert('Error updating status')
    }
  }

  const handleDeleteAdmin = async (admin) => {
    if (!confirm(`Are you sure you want to delete ${admin.firstName} ${admin.lastName}?`)) return
    try {
      const res = await fetch(`${API_URL}/admin-mgmt/admins/${admin._id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        alert('Admin deleted successfully!')
        fetchAdmins()
      } else {
        alert(data.message || 'Failed to delete admin')
      }
    } catch (error) {
      alert('Error deleting admin')
    }
  }

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }
    try {
      const res = await fetch(`${API_URL}/admin-mgmt/admins/${selectedAdmin._id}/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      })
      const data = await res.json()
      if (data.success) {
        alert('Password reset successfully!')
        setShowPasswordModal(false)
        setNewPassword('')
      } else {
        alert(data.message || 'Failed to reset password')
      }
    } catch (error) {
      alert('Error resetting password')
    }
  }

  const copyToClipboard = (slug) => {
    const url = `${window.location.origin}/${slug}/login`
    navigator.clipboard.writeText(url)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  const filteredAdmins = admins.filter(admin => 
    admin.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.urlSlug?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getPermissionCount = (permissions) => {
    if (!permissions) return 0
    return Object.values(permissions).filter(v => v === true).length
  }

  return (
    <AdminLayout title="Admin Management" subtitle="Manage sub-admins, permissions, and wallets">
      {/* Stats Portfolio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Command Center', value: admins.length, subtitle: 'Total authorized administrators', icon: Shield, color: 'blue' },
          { title: 'Operational', value: admins.filter(a => a.status === 'ACTIVE').length, subtitle: 'Active status protocols', icon: Check, color: 'green' },
          { title: 'Network Mass', value: admins.reduce((sum, a) => sum + (a.userCount || 0), 0), subtitle: 'Total sub-admin users', icon: Users, color: 'purple' },
          { title: 'Liquidity Pool', value: `$${admins.reduce((sum, a) => sum + (a.walletBalance || 0), 0).toLocaleString()}`, subtitle: 'Total admin settlement reserves', icon: Wallet, color: 'yellow' }
        ].map((stat, idx) => (
          <div key={idx} style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-[2rem] p-6 border shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-${stat.color}-500/10 rounded-2xl flex items-center justify-center border border-${stat.color}-500/20 group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} className={`text-${stat.color}-600`} />
              </div>
              <div style={{ backgroundColor: modeColors.bgSecondary }} className="px-2 py-1 rounded-lg">
                <span style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest opacity-60">Admin Stats</span>
              </div>
            </div>
            <p style={{ color: modeColors.textSecondary }} className="text-xs font-black uppercase tracking-widest italic opacity-70 mb-1">{stat.title}</p>
            <p style={{ color: modeColors.text }} className="text-3xl font-black tracking-tight">{stat.value}</p>
            <p style={{ color: modeColors.textMuted }} className="text-[10px] font-bold mt-2 flex items-center gap-1 opacity-60 lowercase">
              <Clock size={10} /> {stat.subtitle}
            </p>
          </div>
        ))}
      </div>

      {/* Infrastructure Ecosystem */}
      <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-[2.5rem] border overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 mb-8">
        <div style={{ backgroundColor: modeColors.bgSecondary }} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-8 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <h2 style={{ color: modeColors.text }} className="font-black text-[10px] uppercase tracking-[0.2em] opacity-60 text-orange-600">Administrator Protocols</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="relative group">
              <Search size={16} style={{ color: modeColors.textSecondary }} className="absolute left-5 top-1/2 -translate-y-1/2 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="text"
                placeholder="PROBE REGISTRY..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ backgroundColor: modeColors.card, borderColor: modeColors.border, color: modeColors.text }}
                className="w-full sm:w-80 appearance-none border-2 rounded-2xl pl-12 pr-6 py-3 font-black text-[10px] tracking-widest uppercase focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 transition-all shadow-inner"
              />
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-500/25 hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Provision Agent
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-24 text-center grayscale opacity-30">
            <Shield size={48} className="mx-auto mb-4 animate-pulse" />
            <p className="font-black text-[10px] uppercase tracking-widest">Querying Administration Core...</p>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="p-24 text-center grayscale opacity-30">
            <Shield size={48} className="mx-auto mb-4" />
            <p className="font-black text-[10px] uppercase tracking-widest">No Authorized Credentials Exist</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th style={{ color: modeColors.textSecondary }} className="py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Admin Identity</th>
                  <th style={{ color: modeColors.textSecondary }} className="py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60 text-center">Protocol Link</th>
                  <th style={{ color: modeColors.textSecondary }} className="py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Settlement Vault</th>
                  <th style={{ color: modeColors.textSecondary }} className="py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60 text-center">Node Density</th>
                  <th style={{ color: modeColors.textSecondary }} className="py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60 text-center">Privileges</th>
                  <th style={{ color: modeColors.textSecondary }} className="py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60 text-center">Status</th>
                  <th style={{ color: modeColors.textSecondary }} className="py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredAdmins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:rotate-6 transition-transform">
                          <span className="text-white font-black text-xl">{admin.firstName?.charAt(0)}</span>
                        </div>
                        <div>
                          <p style={{ color: modeColors.text }} className="font-black text-base tracking-tight leading-none mb-1 group-hover:text-blue-600 transition-colors">{admin.firstName} {admin.lastName}</p>
                          <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-bold opacity-60 lowercase">{admin.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-8">
                      <div className="flex flex-col items-center gap-1.5">
                        <span style={{ backgroundColor: modeColors.bgSecondary }} className="px-3 py-1.5 rounded-xl font-mono text-[10px] font-black tracking-widest text-[#A855F7] border border-purple-500/10 shadow-inner group-hover:bg-white transition-colors">/{admin.urlSlug}</span>
                        <button 
                          onClick={() => copyToClipboard(admin.urlSlug)}
                          className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-purple-600 transition-colors"
                        >
                          {copiedSlug === admin.urlSlug ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
                          {copiedSlug === admin.urlSlug ? 'Protocol Cached' : 'Replicate Route'}
                        </button>
                      </div>
                    </td>
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-2 mb-1">
                        <Wallet size={12} className="text-yellow-600 opacity-40" />
                        <p style={{ color: modeColors.text }} className="font-black text-base tracking-tight">${admin.walletBalance?.toLocaleString() || 0}</p>
                      </div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-60 italic">Pool Reserve: ${admin.totalGivenToUsers?.toLocaleString() || 0}</p>
                    </td>
                    <td className="py-6 px-8">
                      <div className="flex flex-col items-center">
                        <p style={{ color: modeColors.text }} className="font-black text-base tracking-tight">{admin.userCount || 0}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 opacity-60">Connected Nodes</p>
                      </div>
                    </td>
                    <td className="py-6 px-8">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield size={12} className="text-purple-600 opacity-40" />
                          <span style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest">{getPermissionCount(admin.permissions)} Scopes</span>
                        </div>
                        <div className="flex gap-1">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className={`w-1 h-1 rounded-full ${i < getPermissionCount(admin.permissions) ? 'bg-purple-500' : 'bg-slate-200'}`} />
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-8">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleToggleStatus(admin)}
                          className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] border shadow-sm transition-all active:scale-95 ${
                            admin.status === 'ACTIVE' 
                              ? 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500 hover:text-white' 
                              : 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500 hover:text-white'
                          }`}
                        >
                          {admin.status}
                        </button>
                      </div>
                    </td>
                    <td className="py-6 px-8 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <button 
                          onClick={() => { setSelectedAdmin(admin); setShowFundModal(true) }}
                          className="p-3 bg-green-500/10 text-green-600 rounded-xl hover:bg-green-500 hover:text-white transition-all active:scale-90 border border-green-500/20"
                          title="Inject Funds"
                        >
                          <DollarSign size={16} />
                        </button>
                        <button 
                          onClick={() => { setSelectedAdmin({...admin}); setShowPermissionsModal(true) }}
                          className="p-3 bg-purple-500/10 text-purple-600 rounded-xl hover:bg-purple-500 hover:text-white transition-all active:scale-90 border border-purple-500/20"
                          title="Scope Configuration"
                        >
                          <Key size={16} />
                        </button>
                        <button 
                          onClick={() => { setSelectedAdmin(admin); setShowPasswordModal(true) }}
                          className="p-3 bg-yellow-500/10 text-yellow-600 rounded-xl hover:bg-yellow-500 hover:text-white transition-all active:scale-90 border border-yellow-500/20"
                          title="Key Reset"
                        >
                          <Lock size={16} />
                        </button>
                        <button 
                          onClick={() => { setSelectedAdmin({...admin}); setShowEditModal(true) }}
                          className="p-3 bg-blue-500/10 text-blue-600 rounded-xl hover:bg-blue-500 hover:text-white transition-all active:scale-90 border border-blue-500/20"
                          title="Update Profile"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteAdmin(admin)}
                          className="p-3 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-90 border border-red-500/20"
                          title="Revoke Permission"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div 
            style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} 
            className="rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto border-4 shadow-2xl relative animate-in zoom-in-95 duration-300 custom-scrollbar"
          >
            <div className="sticky top-0 z-10 p-8 border-b border-slate-100 flex items-center justify-between" style={{ backgroundColor: modeColors.card }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Plus size={24} className="text-white" />
                </div>
                <div>
                  <h3 style={{ color: modeColors.text }} className="text-2xl font-black tracking-tight">Provision Agent</h3>
                  <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest opacity-60">Registering new administrative protocol</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all active:scale-90">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Identity Core</label>
                  <input
                    type="text"
                    value={newAdmin.firstName}
                    onChange={(e) => setNewAdmin({...newAdmin, firstName: e.target.value})}
                    style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                    className="w-full border-2 rounded-2xl px-6 py-4 font-black text-sm focus:outline-none focus:border-orange-500 transition-all shadow-inner group-hover:bg-white"
                    placeholder="FIRST NAME"
                  />
                </div>
                <div className="space-y-3 pt-6.5 mt-6.5">
                  <label className="hidden opacity-0">spacer</label>
                  <input
                    type="text"
                    value={newAdmin.lastName}
                    onChange={(e) => setNewAdmin({...newAdmin, lastName: e.target.value})}
                    style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                    className="w-full border-2 rounded-2xl px-6 py-4 font-black text-sm focus:outline-none focus:border-orange-500 transition-all shadow-inner group-hover:bg-white"
                    placeholder="LAST NAME"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Authentication Bridge (Email)</label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                  style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                  className="w-full border-2 rounded-2xl px-6 py-4 font-black text-sm focus:outline-none focus:border-orange-500 transition-all shadow-inner group-hover:bg-white lowercase"
                  placeholder="admin@protocol.io"
                />
              </div>

              <div className="space-y-3">
                <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Cipher Configuration (Password)</label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                  style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                  className="w-full border-2 rounded-2xl px-6 py-4 font-black text-sm focus:outline-none focus:border-orange-500 transition-all shadow-inner group-hover:bg-white"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-3">
                <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Protocol Routing (Slug)</label>
                <div className="flex items-center group">
                  <div style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border }} className="px-6 py-4 rounded-l-2xl border-2 border-r-0 font-black text-slate-400">/</div>
                  <input
                    type="text"
                    value={newAdmin.urlSlug}
                    onChange={(e) => setNewAdmin({...newAdmin, urlSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                    style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                    className="flex-1 border-2 rounded-r-2xl px-6 py-4 font-black text-sm focus:outline-none focus:border-orange-500 transition-all shadow-inner group-hover:bg-white"
                    placeholder="partner-node"
                  />
                </div>
                <p style={{ color: modeColors.textSecondary }} className="text-[9px] font-black uppercase tracking-widest opacity-40 px-2 flex items-center gap-2 italic">
                  <Link size={10} /> Route: {window.location.origin}/{newAdmin.urlSlug || 'node'}/login
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Brand Signature</label>
                  <input
                    type="text"
                    value={newAdmin.brandName}
                    onChange={(e) => setNewAdmin({...newAdmin, brandName: e.target.value})}
                    style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                    className="w-full border-2 rounded-2xl px-6 py-4 font-black text-sm focus:outline-none focus:border-orange-500 transition-all shadow-inner group-hover:bg-white"
                    placeholder="BRAND IDENTITY"
                  />
                </div>
                <div className="space-y-3">
                  <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Signal Contact</label>
                  <input
                    type="text"
                    value={newAdmin.phone}
                    onChange={(e) => setNewAdmin({...newAdmin, phone: e.target.value})}
                    style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                    className="w-full border-2 rounded-2xl px-6 py-4 font-black text-sm focus:outline-none focus:border-orange-500 transition-all shadow-inner group-hover:bg-white"
                    placeholder="+ PHONE"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Initial Clearance Scopes</label>
                <div style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border }} className="grid grid-cols-2 gap-3 p-6 rounded-[2rem] border-2 shadow-inner max-h-48 overflow-y-auto custom-scrollbar">
                  {allPermissions.slice(0, 10).map(perm => (
                    <label key={perm.key} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white transition-all cursor-pointer shadow-sm border border-transparent hover:border-slate-100 group">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={newAdmin.permissions[perm.key] || false}
                          onChange={(e) => setNewAdmin({
                            ...newAdmin,
                            permissions: {...newAdmin.permissions, [perm.key]: e.target.checked}
                          })}
                          className="w-5 h-5 rounded-lg border-2 border-slate-300 text-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all cursor-pointer"
                        />
                      </div>
                      <span style={{ color: modeColors.textMuted }} className="text-[9px] font-black uppercase tracking-widest group-hover:text-orange-600 transition-colors">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex gap-4">
              <button
                onClick={() => setShowAddModal(false)}
                style={{ backgroundColor: modeColors.card, color: modeColors.textMuted }}
                className="flex-1 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest border-2 border-slate-200 hover:bg-slate-100 transition-all active:scale-95 shadow-sm"
              >
                Terminate
              </button>
              <button
                onClick={handleCreateAdmin}
                className="flex-[2] py-5 bg-gradient-to-r from-orange-600 to-red-600 text-white font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-orange-500/40 hover:opacity-90 transition-all active:scale-95 border-b-4 border-orange-800"
              >
                Finalize Provisioning
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && selectedAdmin && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div 
            style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} 
            className="rounded-[3rem] w-full max-w-xl border-4 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300"
          >
            <div className="p-10">
              <div className="flex items-center gap-6 mb-10">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-blue-500/20">
                  <Edit size={36} className="text-white" />
                </div>
                <div>
                  <h2 style={{ color: modeColors.text }} className="text-3xl font-black tracking-tight leading-none mb-1">Identity Sync</h2>
                  <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest opacity-60">Updating administrative credentials</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">First Identity</label>
                    <input
                      type="text"
                      value={selectedAdmin.firstName}
                      onChange={(e) => setSelectedAdmin({...selectedAdmin, firstName: e.target.value})}
                      style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                      className="w-full border-2 rounded-2xl px-6 py-4 font-black text-sm focus:outline-none focus:border-blue-500 transition-all shadow-inner group-hover:bg-white"
                    />
                  </div>
                  <div className="space-y-3">
                    <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Last Identity</label>
                    <input
                      type="text"
                      value={selectedAdmin.lastName}
                      onChange={(e) => setSelectedAdmin({...selectedAdmin, lastName: e.target.value})}
                      style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                      className="w-full border-2 rounded-2xl px-6 py-4 font-black text-sm focus:outline-none focus:border-blue-500 transition-all shadow-inner group-hover:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Brand Signature</label>
                  <input
                    type="text"
                    value={selectedAdmin.brandName}
                    onChange={(e) => setSelectedAdmin({...selectedAdmin, brandName: e.target.value})}
                    style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                    className="w-full border-2 rounded-2xl px-6 py-4 font-black text-sm focus:outline-none focus:border-blue-500 transition-all shadow-inner group-hover:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Operations Loop (Phone)</label>
                    <input
                      type="text"
                      value={selectedAdmin.phone || ''}
                      onChange={(e) => setSelectedAdmin({...selectedAdmin, phone: e.target.value})}
                      style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                      className="w-full border-2 rounded-2xl px-6 py-4 font-black text-sm focus:outline-none focus:border-blue-500 transition-all shadow-inner group-hover:bg-white"
                    />
                  </div>
                  <div className="space-y-3">
                    <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Protocol Status</label>
                    <select
                      value={selectedAdmin.status}
                      onChange={(e) => setSelectedAdmin({...selectedAdmin, status: e.target.value})}
                      style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                      className="w-full border-2 rounded-2xl px-6 py-4 font-black text-[10px] tracking-widest uppercase focus:outline-none focus:border-blue-500 transition-all shadow-inner group-hover:bg-white appearance-none cursor-pointer"
                    >
                      <option value="ACTIVE">Active Deployment</option>
                      <option value="SUSPENDED">Suspended / Frozen</option>
                      <option value="PENDING">Pending Approval</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-12">
                <button
                  onClick={() => setShowEditModal(false)}
                  style={{ backgroundColor: modeColors.bgSecondary, color: modeColors.textMuted }}
                  className="flex-1 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest border-2 border-transparent hover:border-slate-200 transition-all active:scale-95 shadow-sm"
                >
                  Discard
                </button>
                <button
                  onClick={handleUpdateAdmin}
                  className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-blue-500/40 hover:opacity-90 transition-all active:scale-95 border-b-4 border-blue-800"
                >
                  Commit Modifications
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liquidity Injection Modal */}
      {showFundModal && selectedAdmin && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div 
            style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} 
            className="rounded-[3rem] w-full max-w-md border-4 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300"
          >
            <div className="p-10 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-green-500/20 mx-auto mb-8 group">
                <DollarSign size={48} className="text-white group-hover:scale-110 transition-transform" />
              </div>

              <h2 style={{ color: modeColors.text }} className="text-3xl font-black tracking-tight mb-2">Liquidity Injection</h2>
              <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-8">Funding Provision: {selectedAdmin.firstName}</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div style={{ backgroundColor: modeColors.bgSecondary }} className="p-5 rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Current Vault</p>
                  <p className="text-xl font-black text-green-600">${selectedAdmin.walletBalance?.toLocaleString() || 0}</p>
                </div>
                <div style={{ backgroundColor: modeColors.bgSecondary }} className="p-5 rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Active Nodes</p>
                  <p style={{ color: modeColors.text }} className="text-xl font-black">{selectedAdmin.userCount || 0}</p>
                </div>
              </div>

              <div className="space-y-6 text-left">
                <div className="space-y-3">
                  <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Injection Quantum ($)</label>
                  <div className="relative group">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-xl text-green-600">$</span>
                    <input
                      type="number"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                      className="w-full border-2 rounded-2xl pl-12 pr-6 py-5 font-black text-2xl focus:outline-none focus:border-green-500 transition-all shadow-inner group-hover:bg-white"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Authorization Remark</label>
                  <input
                    type="text"
                    value={fundDescription}
                    onChange={(e) => setFundDescription(e.target.value)}
                    style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                    className="w-full border-2 rounded-2xl px-6 py-4 font-black text-[10px] tracking-widest uppercase focus:outline-none focus:border-green-500 transition-all shadow-inner group-hover:bg-white"
                    placeholder="PROTOCOL LOG ENTRY..."
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button
                  onClick={() => setShowFundModal(false)}
                  style={{ backgroundColor: modeColors.bgSecondary, color: modeColors.textMuted }}
                  className="flex-1 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest border-2 border-transparent hover:border-slate-200 transition-all active:scale-95 shadow-sm"
                >
                  Abort
                </button>
                <button
                  onClick={handleFundAdmin}
                  disabled={!fundAmount || parseFloat(fundAmount) <= 0}
                  className="flex-[2] bg-gradient-to-r from-green-600 to-emerald-600 text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-green-500/40 hover:opacity-90 transition-all active:scale-95 border-b-4 border-green-800 disabled:opacity-30 disabled:pointer-events-none"
                >
                  Confirm Provision
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clearance Configuration Modal */}
      {showPermissionsModal && selectedAdmin && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div 
            style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} 
            className="rounded-[3rem] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border-4 shadow-2xl relative animate-in zoom-in-95 duration-300"
          >
            <div className="p-8 border-b border-slate-100 flex items-center justify-between" style={{ backgroundColor: modeColors.card }}>
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-purple-500/20">
                  <Key size={32} className="text-white" />
                </div>
                <div>
                  <h3 style={{ color: modeColors.text }} className="text-2xl font-black tracking-tight">Scope Configuration</h3>
                  <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest opacity-60 font-black italic">Targeting Protocol: {selectedAdmin.firstName} {selectedAdmin.lastName}</p>
                </div>
              </div>
              <button onClick={() => setShowPermissionsModal(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all active:scale-90">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-10 overflow-y-auto space-y-10 flex-1 custom-scrollbar">
              {['Users', 'Trading', 'Accounts', 'Finance', 'KYC', 'IB', 'Copy Trade', 'Settings', 'Reports'].map((category, idx) => (
                <div key={category} className="animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                    <h4 style={{ color: modeColors.text }} className="font-black text-[10px] uppercase tracking-[0.3em] opacity-40">{category} Authorization Matrix</h4>
                  </div>
                  <div style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-6 rounded-[2rem] border-2 shadow-inner">
                    {allPermissions.filter(p => p.category === category).map(perm => (
                      <label key={perm.key} className="flex items-center gap-4 p-4 rounded-xl hover:bg-white transition-all cursor-pointer shadow-sm border border-transparent hover:border-slate-100 group">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedAdmin.permissions?.[perm.key] || false}
                            onChange={(e) => setSelectedAdmin({
                              ...selectedAdmin,
                              permissions: {...selectedAdmin.permissions, [perm.key]: e.target.checked}
                            })}
                            className="w-5 h-5 rounded-lg border-2 border-slate-300 text-purple-600 focus:ring-4 focus:ring-purple-500/10 transition-all cursor-pointer"
                          />
                        </div>
                        <span style={{ color: modeColors.textMuted }} className="text-[9px] font-black uppercase tracking-widest group-hover:text-purple-600 transition-colors leading-tight">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex gap-4">
              <button
                onClick={() => setShowPermissionsModal(false)}
                style={{ backgroundColor: modeColors.card, color: modeColors.textMuted }}
                className="flex-1 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest border-2 border-slate-200 hover:bg-slate-100 transition-all active:scale-95"
              >
                Zero Protocol
              </button>
              <button
                onClick={handleUpdatePermissions}
                className="flex-[2] bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-purple-500/40 hover:opacity-90 transition-all active:scale-95 border-b-4 border-purple-800 flex items-center justify-center gap-3"
              >
                <Shield size={18} />
                Confirm Authorization Matrix
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Password Reset Modal */}
      {showPasswordModal && selectedAdmin && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div 
            style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} 
            className="rounded-[3rem] w-full max-w-md border-4 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300"
          >
            <div className="p-10 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-yellow-500/20 mx-auto mb-8 group">
                <Lock size={48} className="text-white group-hover:rotate-12 transition-transform" />
              </div>

              <h2 style={{ color: modeColors.text }} className="text-3xl font-black tracking-tight mb-2">Credential Rotation</h2>
              <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-8 font-black italic">Targeting Protocol: {selectedAdmin.firstName}</p>

              <div className="bg-red-500/5 border-2 border-red-500/10 rounded-[2rem] p-6 mb-8 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <AlertCircle size={40} className="text-red-500" />
                </div>
                <div className="flex items-center gap-3 text-red-600 mb-2">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Critical Override Alert</span>
                </div>
                <p className="text-red-500/80 text-[11px] leading-relaxed font-black uppercase tracking-tight">
                  Resetting credentials will terminate all active session tokens for this administrator. this action is logged in the immutable audit trail.
                </p>
              </div>

              <div className="space-y-6 text-left">
                <div className="space-y-3">
                  <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">New Master Password</label>
                  <div className="relative group">
                    <Key size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-yellow-500 transition-colors" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                      className="w-full border-2 rounded-2xl pl-14 pr-6 py-5 font-black text-sm focus:outline-none focus:border-yellow-500 transition-all shadow-inner group-hover:bg-white"
                      placeholder="MIN 6 CHARACTERS REQUIRED"
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button
                  onClick={() => { setShowPasswordModal(false); setNewPassword('') }}
                  style={{ backgroundColor: modeColors.bgSecondary, color: modeColors.textMuted }}
                  className="flex-1 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest border-2 border-transparent hover:border-slate-200 transition-all active:scale-95 shadow-sm"
                >
                  Abort
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={!newPassword || newPassword.length < 6}
                  className="flex-[2] bg-gradient-to-r from-yellow-600 to-orange-600 text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-yellow-500/40 hover:opacity-90 transition-all active:scale-95 border-b-4 border-yellow-800 flex items-center justify-center gap-3 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Key size={18} />
                  Authorize Rotation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminManagement
