import { API_URL } from '../config/api'
import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { 
  Copy,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Users,
  TrendingUp,
  DollarSign,
  Star,
  Check,
  X,
  Clock
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const AdminCopyTrade = () => {
  const { modeColors } = useTheme()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('masters')
  const [masters, setMasters] = useState([])
  const [applications, setApplications] = useState([])
  const [followers, setFollowers] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedMaster, setSelectedMaster] = useState(null)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [approveForm, setApproveForm] = useState({
    approvedCommissionPercentage: 10,
    adminSharePercentage: 30
  })

  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}')

  useEffect(() => {
    fetchDashboard()
    fetchMasters()
    fetchApplications()
    fetchFollowers()
  }, [])

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API_URL}/copy/admin/dashboard`)
      const data = await res.json()
      setDashboard(data.dashboard)
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    }
  }

  const fetchMasters = async () => {
    try {
      const res = await fetch(`${API_URL}/copy/admin/masters`)
      const data = await res.json()
      setMasters(data.masters || [])
    } catch (error) {
      console.error('Error fetching masters:', error)
    }
    setLoading(false)
  }

  const fetchApplications = async () => {
    try {
      const res = await fetch(`${API_URL}/copy/admin/applications`)
      const data = await res.json()
      setApplications(data.applications || [])
    } catch (error) {
      console.error('Error fetching applications:', error)
    }
  }

  const fetchFollowers = async () => {
    try {
      const res = await fetch(`${API_URL}/copy/admin/followers`)
      const data = await res.json()
      setFollowers(data.followers || [])
    } catch (error) {
      console.error('Error fetching followers:', error)
    }
  }

  const handleApprove = async () => {
    if (!selectedMaster) return
    try {
      const res = await fetch(`${API_URL}/copy/admin/approve/${selectedMaster._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: adminUser._id,
          ...approveForm
        })
      })
      const data = await res.json()
      if (data.master) {
        alert('Master approved successfully!')
        setShowApproveModal(false)
        setSelectedMaster(null)
        fetchMasters()
        fetchApplications()
        fetchDashboard()
      }
    } catch (error) {
      console.error('Error approving master:', error)
      alert('Failed to approve master')
    }
  }

  const handleReject = async (masterId) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return
    
    try {
      const res = await fetch(`${API_URL}/copy/admin/reject/${masterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: adminUser._id,
          rejectionReason: reason
        })
      })
      const data = await res.json()
      if (data.master) {
        alert('Master rejected')
        fetchMasters()
        fetchApplications()
        fetchDashboard()
      }
    } catch (error) {
      console.error('Error rejecting master:', error)
    }
  }

  const handleSuspend = async (masterId) => {
    if (!confirm('Are you sure you want to suspend this master?')) return
    
    try {
      const res = await fetch(`${API_URL}/copy/admin/suspend/${masterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: adminUser._id })
      })
      const data = await res.json()
      if (data.master) {
        alert('Master suspended')
        fetchMasters()
        fetchDashboard()
      }
    } catch (error) {
      console.error('Error suspending master:', error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500/20 text-green-500'
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-500'
      case 'SUSPENDED': return 'bg-red-500/20 text-red-500'
      case 'REJECTED': return 'bg-gray-500/20 text-gray-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const filteredMasters = masters.filter(m => 
    m.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.userId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <AdminLayout title="Copy Trade Management" subtitle="Manage master traders and copy trading">
      {/* Stats Portfolio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Master Registry', value: dashboard?.masters?.active, subtitle: `${dashboard?.masters?.pending || 0} pending review`, icon: Star, color: 'yellow' },
          { title: 'Social Velocity', value: dashboard?.followers?.active, subtitle: 'Active copy nodes', icon: Users, color: 'blue' },
          { title: 'Trade Resonance', value: dashboard?.copyTrades?.total, subtitle: `${dashboard?.copyTrades?.open || 0} active signals`, icon: TrendingUp, color: 'green' },
          { title: 'Protocol Pool', value: `$${dashboard?.adminPool?.toFixed(2) || '0.00'}`, subtitle: 'Admin settlement reserve', icon: DollarSign, color: 'purple' }
        ].map((stat, idx) => (
          <div key={idx} style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-[2rem] p-6 border shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-${stat.color}-500/10 rounded-2xl flex items-center justify-center border border-${stat.color}-500/20 group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} className={`text-${stat.color}-600`} />
              </div>
              <div style={{ backgroundColor: modeColors.bgSecondary }} className="px-2 py-1 rounded-lg">
                <span style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest opacity-60">Live Metrics</span>
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

      {/* Navigation Ecosystem */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-4 custom-scrollbar">
        {[
          { key: 'applications', label: `Review Queue (${applications.length})`, icon: Clock },
          { key: 'masters', label: 'Master Registry', icon: Star },
          { key: 'followers', label: 'Social Graph', icon: Users }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{ 
              backgroundColor: activeTab === tab.key ? '#A855F7' : modeColors.card,
              color: activeTab === tab.key ? '#FFFFFF' : modeColors.text,
              borderColor: activeTab === tab.key ? '#A855F7' : modeColors.border,
            }}
            className={`px-6 py-4 rounded-2xl whitespace-nowrap flex items-center gap-3 border shadow-sm transition-all active:scale-[0.98] font-black text-[10px] uppercase tracking-widest ${
              activeTab === tab.key ? 'shadow-lg shadow-purple-500/20' : 'hover:border-purple-200'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Data Visualization Ecosystem */}
      <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-[2.5rem] border overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Applications View */}
        {activeTab === 'applications' && (
          <div>
            <div style={{ backgroundColor: modeColors.bgSecondary }} className="py-5 px-8 border-b border-slate-100 flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <h2 style={{ color: modeColors.text }} className="font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Pending Master Protocols</h2>
            </div>
            {applications.length === 0 ? (
              <div className="text-center py-24 grayscale opacity-30">
                <Clock size={48} className="mx-auto mb-4" />
                <p className="font-black text-[10px] uppercase tracking-widest">No Protocol Requests Found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {applications.map(app => (
                  <div key={app._id} className="p-8 hover:bg-slate-50/50 transition-all group flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-yellow-500/20 group-hover:rotate-6 transition-transform">
                        <span className="text-white font-black text-2xl">{app.displayName?.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 style={{ color: modeColors.text }} className="font-black text-lg tracking-tight">{app.displayName}</h3>
                          <span className="bg-yellow-500/10 text-yellow-600 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-yellow-500/20">Pending Review</span>
                        </div>
                        <p style={{ color: modeColors.textSecondary }} className="text-xs font-bold opacity-60">{app.userId?.firstName} • {app.userId?.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p style={{ color: modeColors.text }} className="font-black text-2xl tracking-tight">{app.requestedCommissionPercentage}%</p>
                        <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest opacity-40">Requested Fee</p>
                      </div>
                      
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleReject(app._id)} 
                          style={{ backgroundColor: modeColors.bgSecondary }}
                          className="px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-red-500 border-2 border-red-500/10 hover:border-red-500 transition-all active:scale-95"
                        >
                          Decline
                        </button>
                        <button 
                          onClick={() => { setSelectedMaster(app); setShowApproveModal(true) }} 
                          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-500/25 hover:opacity-90 transition-all active:scale-95"
                        >
                          Authorize
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Master Registry View */}
        {activeTab === 'masters' && (
          <div>
            <div style={{ backgroundColor: modeColors.bgSecondary }} className="py-5 px-8 border-b border-slate-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <h2 style={{ color: modeColors.text }} className="font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Verified Signal Nodes</h2>
              </div>
              <div className="relative group">
                <Search size={16} style={{ color: modeColors.textSecondary }} className="absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-purple-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="FILTER REGISTRY..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  style={{ backgroundColor: modeColors.card, borderColor: modeColors.border, color: modeColors.text }}
                  className="appearance-none border-2 rounded-2xl pl-12 pr-6 py-2.5 font-black text-[10px] tracking-widest uppercase focus:outline-none focus:border-purple-500 transition-all shadow-inner w-64" 
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th style={{ color: modeColors.textSecondary }} className="text-left py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Signal Identity</th>
                    <th style={{ color: modeColors.textSecondary }} className="text-left py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Agent Core</th>
                    <th style={{ color: modeColors.textSecondary }} className="text-right py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Follower Mass</th>
                    <th style={{ color: modeColors.textSecondary }} className="text-right py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Protocol Fee</th>
                    <th style={{ color: modeColors.textSecondary }} className="text-center py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Status</th>
                    <th style={{ color: modeColors.textSecondary }} className="text-right py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan="6" className="text-center py-24 font-black text-[10px] uppercase tracking-widest opacity-30">Syncing Intelligence...</td></tr>
                  ) : filteredMasters.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-24 font-black text-[10px] uppercase tracking-widest opacity-30">No Intelligence Match</td></tr>
                  ) : filteredMasters.map(master => (
                    <tr key={master._id} className="group hover:bg-slate-50/50 transition-all">
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20 group-hover:scale-105 transition-transform shadow-sm">
                            <span className="text-purple-600 font-black text-lg">{master.displayName?.charAt(0)}</span>
                          </div>
                          <span style={{ color: modeColors.text }} className="font-black text-sm tracking-tight">{master.displayName}</span>
                        </div>
                      </td>
                      <td className="py-6 px-8">
                        <p style={{ color: modeColors.text }} className="font-black text-sm tracking-tight">{master.userId?.firstName}</p>
                        <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-bold opacity-60">{master.userId?.email}</p>
                      </td>
                      <td style={{ color: modeColors.text }} className="py-6 px-8 text-right font-black text-base tracking-tight">{master.stats?.activeFollowers || 0}</td>
                      <td style={{ color: modeColors.text }} className="py-6 px-8 text-right font-mono text-sm font-bold">{master.approvedCommissionPercentage || master.requestedCommissionPercentage}%</td>
                      <td className="py-6 px-8">
                        <div className="flex justify-center">
                          <span className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                            master.status === 'ACTIVE' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 
                            master.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' : 
                            'bg-red-500/10 text-red-600 border-red-500/20'
                          }`}>
                            {master.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-6 px-8 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {master.status === 'PENDING' && (
                            <>
                              <button onClick={() => { setSelectedMaster(master); setShowApproveModal(true) }} className="p-2.5 bg-green-500/10 text-green-600 rounded-xl hover:bg-green-500 hover:text-white transition-all active:scale-90" title="Authorize"><Check size={18} /></button>
                              <button onClick={() => handleReject(master._id)} className="p-2.5 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-90" title="Revoke"><X size={18} /></button>
                            </>
                          )}
                          {master.status === 'ACTIVE' && (
                            <button onClick={() => handleSuspend(master._id)} className="p-2.5 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-90" title="Decommission"><Trash2 size={18} /></button>
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

        {/* Social Graph View */}
        {activeTab === 'followers' && (
          <div>
            <div style={{ backgroundColor: modeColors.bgSecondary }} className="py-5 px-8 border-b border-slate-100 flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <h2 style={{ color: modeColors.text }} className="font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Follower Network Topography</h2>
            </div>
            {followers.length === 0 ? (
              <div className="text-center py-24 grayscale opacity-30">
                <Users size={48} className="mx-auto mb-4" />
                <p className="font-black text-[10px] uppercase tracking-widest">No Node Connections Found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th style={{ color: modeColors.textSecondary }} className="text-left py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Follower Core</th>
                      <th style={{ color: modeColors.textSecondary }} className="text-left py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Signal Parent</th>
                      <th style={{ color: modeColors.textSecondary }} className="text-center py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Protocol Mode</th>
                      <th style={{ color: modeColors.textSecondary }} className="text-right py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Resonant Trades</th>
                      <th style={{ color: modeColors.textSecondary }} className="text-center py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {followers.map(f => (
                      <tr key={f._id} className="group hover:bg-slate-50/50 transition-all">
                        <td className="py-6 px-8">
                          <p style={{ color: modeColors.text }} className="font-black text-sm tracking-tight">{f.followerId?.firstName}</p>
                          <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-bold opacity-60">{f.followerId?.email}</p>
                        </td>
                        <td className="py-6 px-8">
                          <div className="flex items-center gap-3">
                            <Star size={14} className="text-yellow-500" />
                            <span style={{ color: modeColors.text }} className="font-black text-sm tracking-tight">{f.masterId?.displayName}</span>
                          </div>
                        </td>
                        <td className="py-6 px-8 text-center">
                          <span style={{ backgroundColor: modeColors.bgSecondary }} className="px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest border border-slate-100 shadow-inner group-hover:bg-white">
                            {f.copyMode === 'FIXED_LOT' ? `Fixed: ${f.copyValue}` : `${f.copyValue}x Multiplier`}
                          </span>
                        </td>
                        <td style={{ color: modeColors.text }} className="py-6 px-8 text-right font-black text-base tracking-tight">{f.stats?.totalCopiedTrades || 0}</td>
                        <td className="py-6 px-8 text-center">
                          <span className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                            f.status === 'ACTIVE' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                          }`}>
                            {f.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Authorization Modal */}
      {showApproveModal && selectedMaster && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div 
            style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} 
            className="rounded-[3rem] p-10 w-full max-w-xl border-4 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full -mr-24 -mt-24 blur-3xl" />
            
            <div className="relative">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-[2rem] flex items-center justify-center shadow-xl shadow-purple-500/20">
                  <Shield size={36} className="text-white" />
                </div>
                <div>
                  <h2 style={{ color: modeColors.text }} className="text-3xl font-black tracking-tight">Authorize Protocol</h2>
                  <p style={{ color: modeColors.textSecondary }} className="font-bold opacity-60">Granting clearance to: {selectedMaster.displayName}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="space-y-4">
                  <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Master Share (%)</label>
                  <div className="relative group">
                    <input 
                      type="number" 
                      value={approveForm.approvedCommissionPercentage === 0 ? '' : approveForm.approvedCommissionPercentage} 
                      onChange={(e) => setApproveForm(prev => ({ ...prev, approvedCommissionPercentage: e.target.value === '' ? 0 : parseFloat(e.target.value) }))} 
                      style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                      className="w-full border-2 rounded-2xl px-6 py-4 font-black text-xl focus:outline-none focus:border-purple-500 transition-all shadow-inner group-hover:bg-white" 
                      placeholder="0" 
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 font-black text-sm">%</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Platform Tax (%)</label>
                  <div className="relative group">
                    <input 
                      type="number" 
                      value={approveForm.adminSharePercentage === 0 ? '' : approveForm.adminSharePercentage} 
                      onChange={(e) => setApproveForm(prev => ({ ...prev, adminSharePercentage: e.target.value === '' ? 0 : parseFloat(e.target.value) }))} 
                      style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                      className="w-full border-2 rounded-2xl px-6 py-4 font-black text-xl focus:outline-none focus:border-blue-500 transition-all shadow-inner group-hover:bg-white" 
                      placeholder="0" 
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 font-black text-sm">%</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowApproveModal(false)} 
                  style={{ backgroundColor: modeColors.bgSecondary, color: modeColors.textSecondary }}
                  className="flex-1 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest border-2 border-transparent hover:border-slate-200 transition-all active:scale-95"
                >
                  Terminate
                </button>
                <button 
                  onClick={handleApprove} 
                  className="flex-[2] bg-gradient-to-r from-purple-600 to-blue-600 text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-purple-500/40 hover:opacity-90 transition-all active:scale-95 border-b-4 border-purple-800"
                >
                  Finalize Authorization
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminCopyTrade
