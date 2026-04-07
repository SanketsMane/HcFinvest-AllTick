import { API_URL } from '../config/api'
import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { 
  FileCheck,
  Search,
  Eye,
  Check,
  X,
  Clock,
  Download,
  User,
  FileText,
  Calendar,
  RefreshCw,
  ArrowRight,
  ShieldCheck
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const AdminKYC = () => {
  const { modeColors } = useTheme()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [kycRequests, setKycRequests] = useState([])
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedKyc, setSelectedKyc] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchKycRequests()
  }, [filterStatus])

  const fetchKycRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/kyc/all?status=${filterStatus}`)
      const data = await res.json()
      if (data.success) {
        setKycRequests(data.kycList || [])
        setStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 })
      }
    } catch (error) {
      console.error('Error fetching KYC requests:', error)
    }
    setLoading(false)
  }

  const handleApprove = async (kycId) => {
    setActionLoading(true)
    try {
      const res = await fetch(`${API_URL}/kyc/approve/${kycId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      if (data.success) {
        alert('KYC approved successfully')
        fetchKycRequests()
        setShowViewModal(false)
      } else {
        alert(data.message || 'Failed to approve KYC')
      }
    } catch (error) {
      console.error('Error approving KYC:', error)
      alert('Failed to approve KYC')
    }
    setActionLoading(false)
  }

  const handleReject = async () => {
    if (!selectedKyc) return
    setActionLoading(true)
    try {
      const res = await fetch(`${API_URL}/kyc/reject/${selectedKyc._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason || 'Documents not acceptable' })
      })
      const data = await res.json()
      if (data.success) {
        alert('KYC rejected')
        fetchKycRequests()
        setShowRejectModal(false)
        setShowViewModal(false)
        setRejectReason('')
      } else {
        alert(data.message || 'Failed to reject KYC')
      }
    } catch (error) {
      console.error('Error rejecting KYC:', error)
      alert('Failed to reject KYC')
    }
    setActionLoading(false)
  }

  const viewKycDetails = async (kyc) => {
    setSelectedKyc(kyc)
    setShowViewModal(true)
  }

  const formatDocType = (type) => {
    return type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-500'
      case 'pending': return 'bg-yellow-500/20 text-yellow-500'
      case 'rejected': return 'bg-red-500/20 text-red-500'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <Check size={14} />
      case 'pending': return <Clock size={14} />
      case 'rejected': return <X size={14} />
      default: return null
    }
  }

  const filteredRequests = kycRequests.filter(req => {
    const userName = req.user?.name || ''
    const userEmail = req.user?.email || ''
    const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  return (
    <AdminLayout title="Identity Verification" subtitle="Process and manage global KYC submissions">
      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Base', value: stats.total, icon: FileCheck, color: 'blue', themeColor: 'blue' },
          { label: 'In Review', value: stats.pending, icon: Clock, color: 'amber', themeColor: 'yellow' },
          { label: 'Validated', value: stats.approved, icon: Check, color: 'green', themeColor: 'green' },
          { label: 'Flagged', value: stats.rejected, icon: X, color: 'red', themeColor: 'red' }
        ].map((stat, idx) => (
          <div key={idx} style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-[2rem] p-6 border shadow-sm group">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-${stat.themeColor}-500/10 rounded-2xl flex items-center justify-center border border-${stat.themeColor}-500/20 shadow-sm group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} className={`text-${stat.themeColor === 'yellow' ? 'amber' : stat.themeColor}-600`} />
              </div>
              <span style={{ backgroundColor: modeColors.bgSecondary, color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg opacity-60">Realtime</span>
            </div>
            <p style={{ color: modeColors.textSecondary }} className="text-xs font-black uppercase tracking-widest italic">{stat.label}</p>
            <p style={{ color: modeColors.text }} className="text-3xl font-black mt-1 tracking-tight">{stat.value?.toLocaleString() || 0}</p>
          </div>
        ))}
      </div>

      {/* KYC Management Interface */}
      <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-[2.5rem] border overflow-hidden shadow-sm shadow-slate-100 animate-in fade-in slide-in-from-bottom-4">
        <div style={{ borderBottomColor: modeColors.border }} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 sm:p-8 border-b">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-8 bg-orange-500 rounded-full" />
            <div>
              <h2 style={{ color: modeColors.text }} className="font-black text-2xl tracking-tight">Identity Nexus</h2>
              <p style={{ color: modeColors.textSecondary }} className="text-sm font-medium opacity-70">Regulatory compliance and biometric validation</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative group">
              <Search size={18} style={{ color: modeColors.textSecondary }} className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-orange-500" />
              <input
                type="text"
                placeholder="Search UID/Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                className="w-full sm:w-64 border-2 rounded-2xl pl-12 pr-4 py-3 font-bold text-sm focus:outline-none focus:border-orange-500 transition-all placeholder-slate-400 shadow-inner"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
              className="border-2 rounded-2xl px-6 py-3 font-black text-xs uppercase tracking-widest focus:outline-none focus:border-orange-500 transition-all cursor-pointer shadow-inner"
            >
              <option value="all">Global Cache</option>
              <option value="pending">Waiting Review</option>
              <option value="approved">Verified Only</option>
              <option value="rejected">Flagged Only</option>
            </select>
          </div>
        </div>

        {/* List Content */}
        <div className="p-6 sm:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
              <RefreshCw size={48} className="animate-spin text-slate-300 mb-4" />
              <p style={{ color: modeColors.textSecondary }} className="font-black text-[10px] uppercase tracking-widest">Syncing Identity Database...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div style={{ backgroundColor: modeColors.bgSecondary }} className="text-center py-32 rounded-[2rem] border-4 border-dashed border-slate-100">
              <div style={{ backgroundColor: modeColors.card }} className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-100">
                <FileText size={40} className="text-slate-200" />
              </div>
              <p style={{ color: modeColors.text }} className="font-black text-xl mb-2 tracking-tight uppercase tracking-widest">Vault is Secure</p>
              <p style={{ color: modeColors.textSecondary }} className="font-medium">No pending requests match your criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((req) => (
                <div key={req._id} style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="group rounded-[2rem] p-6 border hover:border-orange-200 hover:shadow-xl transition-all flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* User Profile */}
                  <div className="flex items-center gap-5 lg:w-1/4">
                    <div style={{ backgroundColor: modeColors.bgSecondary }} className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-orange-500 group-hover:text-white transition-all flex-shrink-0">
                      <User size={28} className="text-slate-400 group-hover:text-white" />
                    </div>
                    <div className="min-w-0">
                      <p style={{ color: modeColors.text }} className="font-black text-lg truncate tracking-tight">{req.user?.name || 'Anonymous User'}</p>
                      <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-black truncate group-hover:text-orange-500 transition-colors uppercase tracking-widest opacity-60">UID: {req.user?.email || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Document Status */}
                  <div className="flex flex-wrap items-center gap-4 lg:w-1/2">
                    <div style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border }} className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border">
                      <FileText size={18} className="text-orange-500" />
                      <div>
                        <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest opacity-50 leading-none mb-1">Asset Class</p>
                        <p style={{ color: modeColors.text }} className="font-black text-sm">{formatDocType(req.documentType)}</p>
                      </div>
                    </div>
                    <div style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border }} className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border">
                      <Calendar size={18} className="text-blue-500" />
                      <div>
                        <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest opacity-50 leading-none mb-1">Creation Date</p>
                        <p style={{ color: modeColors.text }} className="font-black text-sm font-mono">{new Date(req.submittedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 ${
                      req.status === 'approved' ? 'bg-green-500/10 border-green-500/20 text-green-600' :
                      req.status === 'pending' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' :
                      'bg-red-500/10 border-red-500/20 text-red-600'
                    }`}>
                      {getStatusIcon(req.status)}
                      {req.status}
                    </div>
                  </div>

                  {/* Action Cluster */}
                  <div className="flex items-center gap-2 lg:w-1/4 lg:justify-end">
                    <button 
                      onClick={() => viewKycDetails(req)}
                      style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.textSecondary }}
                      className="p-3 border rounded-2xl hover:text-orange-500 hover:border-orange-200 transition-all shadow-sm active:scale-95" 
                      title="Inspect Artifacts"
                    >
                      <Eye size={20} />
                    </button>
                    {req.status === 'pending' && (
                      <div className="h-10 w-px bg-slate-100 mx-1"></div>
                    )}
                    {req.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleApprove(req._id)}
                          className="p-3 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 active:scale-95" 
                          title="Authorize Identity"
                        >
                          <Check size={20} />
                        </button>
                        <button 
                          onClick={() => { setSelectedKyc(req); setShowRejectModal(true) }}
                          className="p-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-95" 
                          title="Flag Submission"
                        >
                          <X size={20} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modern View Modal */}
      {showViewModal && selectedKyc && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-[3rem] max-w-4xl w-full max-h-[90vh] overflow-hidden border shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
            <div style={{ borderBottomColor: modeColors.border }} className="p-8 border-b flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20 shadow-sm">
                  <ShieldCheck size={28} className="text-orange-600" />
                </div>
                <div>
                  <h3 style={{ color: modeColors.text }} className="font-black text-2xl tracking-tight">Identity Forensic Portal</h3>
                  <p style={{ color: modeColors.textSecondary }} className="font-medium text-sm">Reviewing compliance artifacts: {selectedKyc.user?.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowViewModal(false)} 
                className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"
              >
                <X size={28} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              {/* Profile Card */}
              <div style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border }} className="flex flex-wrap items-center justify-between gap-6 p-6 rounded-[2.5rem] border shadow-sm">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 text-slate-400">
                    <User size={32} />
                  </div>
                  <div>
                    <p style={{ color: modeColors.text }} className="font-black text-xl tracking-tight">{selectedKyc.user?.name || 'Anonymous User'}</p>
                    <p style={{ color: modeColors.textSecondary }} className="font-bold tracking-wide italic text-sm">{selectedKyc.user?.email}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                   <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest mb-1 italic opacity-60">System Registry ID</p>
                   <p style={{ color: modeColors.text }} className="font-mono font-bold text-xs bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">{selectedKyc._id}</p>
                </div>
              </div>

              {/* Technical Profile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div style={{ backgroundColor: modeColors.bgSecondary }} className="p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-transform">
                    <FileText size={80} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 italic">Class Code</p>
                  <p style={{ color: modeColors.text }} className="font-black text-2xl tracking-tight uppercase tracking-tighter">{formatDocType(selectedKyc.documentType)}</p>
                  <div className="h-px bg-slate-200/50 my-6"></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 italic">Official Document No.</p>
                  <p className="text-orange-600 font-mono font-black text-2xl tracking-widest">{selectedKyc.documentNumber || 'N/A'}</p>
                </div>
                <div style={{ backgroundColor: modeColors.bgSecondary }} className="p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                   <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4 italic">Verification State</p>
                   <div className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest border-2 flex items-center gap-3 shadow-lg ${
                      selectedKyc.status === 'approved' ? 'bg-green-500 text-white border-transparent' :
                      selectedKyc.status === 'pending' ? 'bg-amber-500 text-white border-transparent' :
                      'bg-red-500 text-white border-transparent'
                    }`}>
                      {getStatusIcon(selectedKyc.status)}
                      {selectedKyc.status}
                    </div>
                </div>
              </div>

              {/* Visual Assets */}
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-orange-500 rounded-full" />
                  <h4 style={{ color: modeColors.text }} className="font-black text-lg uppercase tracking-wider">Asset Repository</h4>
                </div>
                <div className="grid grid-cols-1 gap-12">
                  {[
                    { img: selectedKyc.frontImage, label: 'Document obverse (Front Face)', icon: FileText },
                    { img: selectedKyc.backImage, label: 'Document reverse (Back Face)', icon: RefreshCw },
                    { img: selectedKyc.selfieImage, label: 'Biometric Validation (Selfie)', icon: User }
                  ].filter(x => x.img).map((asset, aidx) => (
                    <div key={aidx} className="group/img relative">
                      <p style={{ color: modeColors.text }} className="text-xs font-black uppercase tracking-widest mb-4 italic flex items-center gap-3 opacity-80">
                        <asset.icon size={16} className="text-orange-500" /> {asset.label}
                      </p>
                      <div style={{ backgroundColor: modeColors.bgSecondary }} className="rounded-[3rem] overflow-hidden border border-slate-100 p-2 shadow-inner group-hover/img:shadow-2xl group-hover/img:border-orange-200 transition-all">
                        <img src={asset.img} alt={asset.label} className="w-full object-contain max-h-[600px] rounded-[2.5rem]" />
                        <a href={asset.img} target="_blank" rel="noreferrer" className="absolute top-16 right-8 p-4 bg-white/95 backdrop-blur rounded-2xl text-slate-900 shadow-2xl hover:bg-orange-500 hover:text-white transition-all transform scale-90 group-hover/img:scale-100 opacity-0 group-hover/img:opacity-100">
                          <Download size={24} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Decision Cluster */}
            <div style={{ backgroundColor: modeColors.bgSecondary }} className="p-8 border-t border-slate-200 flex gap-4">
              <button
                onClick={() => setShowViewModal(false)}
                style={{ backgroundColor: modeColors.card, color: modeColors.textSecondary }}
                className="flex-1 px-8 py-5 border-2 border-slate-200 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95 shadow-sm"
              >
                Close Portal
              </button>
              {selectedKyc.status === 'pending' && (
                <>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="flex-1 px-8 py-5 bg-white border-2 border-red-100 text-red-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-red-50 hover:border-red-300 transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                  >
                    Flag Submission
                  </button>
                  <button
                    onClick={() => handleApprove(selectedKyc._id)}
                    disabled={actionLoading}
                    className="flex-[2] px-8 py-5 bg-orange-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-orange-600 shadow-xl shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <RefreshCw size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
                    {actionLoading ? 'PROCESSING...' : 'AUTHORIZE IDENTITY'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Narrative Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-[3rem] max-w-md w-full border shadow-2xl animate-in zoom-in-95 duration-200">
            <div style={{ borderBottomColor: modeColors.border }} className="p-8 border-b">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 shadow-sm">
                  <X size={28} className="text-red-600" />
                </div>
                <div>
                  <h3 style={{ color: modeColors.text }} className="font-black text-2xl tracking-tight">Compliance Flag</h3>
                  <p style={{ color: modeColors.textSecondary }} className="text-sm font-medium opacity-70 italic tracking-tighter">Issue administrative override</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <label style={{ color: modeColors.textSecondary }} className="block text-[10px] font-black uppercase tracking-widest mb-4 italic opacity-60">Internal Rejection Narrative</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for flagging document (e.g. Blurry Image, Mismatched Data)..."
                rows={4}
                style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                className="w-full border-2 rounded-[2rem] px-6 py-5 font-bold focus:outline-none focus:border-red-500 transition-all shadow-inner resize-none placeholder-slate-400"
              />
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => { setShowRejectModal(false); setRejectReason('') }}
                  style={{ backgroundColor: modeColors.bgSecondary, color: modeColors.text }}
                  className="flex-1 py-4 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all active:scale-95 border border-slate-100"
                >
                  Recall
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="flex-[2] py-4 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-red-700 shadow-xl shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {actionLoading ? <RefreshCw size={20} className="animate-spin inline mr-2" /> : 'CONFIRM REJECTION'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminKYC
