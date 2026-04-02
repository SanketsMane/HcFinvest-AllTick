import { API_URL } from '../config/api'
import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { 
  Trophy,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Users,
  Target,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  ToggleLeft,
  ToggleRight,
  Settings,
  X,
  ArrowUpRight,
  Activity,
  Layers
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const AdminPropFirm = () => {
  const { modeColors } = useTheme()
  // ... (keeping all state logic)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('challenges')
  const [challengeModeEnabled, setChallengeModeEnabled] = useState(false)
  const [challenges, setChallenges] = useState([])
  const [participants, setParticipants] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showChallengeModal, setShowChallengeModal] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState(null)
  const [settings, setSettings] = useState({
    displayName: 'Prop Trading Challenge',
    description: 'Trade with our capital. Pass the challenge and get funded.',
    termsAndConditions: ''
  })
  
  const defaultChallengeForm = {
    name: '',
    description: '',
    stepsCount: 2,
    fundSize: 10000,
    challengeFee: 99,
    rules: {
      maxDailyDrawdownPercent: 5,
      maxOverallDrawdownPercent: 10,
      profitTargetPhase1Percent: 8,
      profitTargetPhase2Percent: 5,
      minLotSize: 0.01,
      maxLotSize: 100,
      minTradesRequired: 1,
      maxTradesPerDay: null,
      maxTotalTrades: null,
      maxConcurrentTrades: null,
      stopLossMandatory: true,
      takeProfitMandatory: false,
      minTradeHoldTimeSeconds: 0,
      maxLeverage: 100,
      allowWeekendHolding: false,
      allowNewsTrading: true,
      tradingDaysRequired: null,
      challengeExpiryDays: 30,
      allowedSegments: ['FOREX', 'CRYPTO', 'STOCKS', 'COMMODITIES', 'INDICES']
    },
    fundedSettings: {
      profitSplitPercent: 80,
      withdrawalFrequencyDays: 14
    },
    isActive: true
  }
  
  const [challengeForm, setChallengeForm] = useState(defaultChallengeForm)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const settingsRes = await fetch(`${API_URL}/prop/admin/settings`)
      const settingsData = await settingsRes.json()
      if (settingsData.success) {
        setChallengeModeEnabled(settingsData.settings.challengeModeEnabled)
        setSettings({
          displayName: settingsData.settings.displayName || 'Prop Trading Challenge',
          description: settingsData.settings.description || '',
          termsAndConditions: settingsData.settings.termsAndConditions || ''
        })
      }

      const challengesRes = await fetch(`${API_URL}/prop/admin/challenges`)
      const challengesData = await challengesRes.json()
      if (challengesData.success) {
        setChallenges(challengesData.challenges || [])
      }

      const accountsRes = await fetch(`${API_URL}/prop/admin/accounts?limit=50`)
      const accountsData = await accountsRes.json()
      if (accountsData.success) {
        setParticipants(accountsData.accounts || [])
      }

      const dashRes = await fetch(`${API_URL}/prop/admin/dashboard`)
      const dashData = await dashRes.json()
      if (dashData.success) {
        setStats(dashData.stats || {})
      }
    } catch (error) {
      console.error('Error fetching prop data:', error)
    }
    setLoading(false)
  }

  const toggleChallengeMode = async () => {
    try {
      const newValue = !challengeModeEnabled
      const res = await fetch(`${API_URL}/prop/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeModeEnabled: newValue })
      })
      const data = await res.json()
      if (data.success) {
        setChallengeModeEnabled(newValue)
      }
    } catch (error) {
      console.error('Error toggling challenge mode:', error)
    }
  }

  const saveSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/prop/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeModeEnabled, ...settings })
      })
      const data = await res.json()
      if (data.success) {
        setShowSettingsModal(false)
        fetchData()
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  const openAddChallenge = () => {
    setEditingChallenge(null)
    setChallengeForm(defaultChallengeForm)
    setShowChallengeModal(true)
  }

  const openEditChallenge = (challenge) => {
    setEditingChallenge(challenge)
    setChallengeForm({
      name: challenge.name || '',
      description: challenge.description || '',
      stepsCount: challenge.stepsCount || 2,
      fundSize: challenge.fundSize || 10000,
      challengeFee: challenge.challengeFee || 99,
      rules: { ...defaultChallengeForm.rules, ...challenge.rules },
      fundedSettings: { ...defaultChallengeForm.fundedSettings, ...challenge.fundedSettings },
      isActive: challenge.isActive !== false
    })
    setShowChallengeModal(true)
  }

  const saveChallenge = async () => {
    if (!challengeForm.name) return
    try {
      const url = editingChallenge 
        ? `${API_URL}/prop/admin/challenges/${editingChallenge._id}`
        : `${API_URL}/prop/admin/challenges`
      const res = await fetch(url, {
        method: editingChallenge ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(challengeForm)
      })
      const data = await res.json()
      if (data.success) {
        setShowChallengeModal(false)
        fetchData()
      }
    } catch (error) {
      console.error('Error saving challenge:', error)
    }
  }

  const deleteChallenge = async (challengeId) => {
    if (!confirm('Are you sure you want to delete this challenge?')) return
    try {
      const res = await fetch(`${API_URL}/prop/admin/challenges/${challengeId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) fetchData()
    } catch (error) {
      console.error('Error deleting challenge:', error)
    }
  }

  const updateFormRules = (field, value) => {
    setChallengeForm({ ...challengeForm, rules: { ...challengeForm.rules, [field]: value } })
  }

  const updateFormFunded = (field, value) => {
    setChallengeForm({ ...challengeForm, fundedSettings: { ...challengeForm.fundedSettings, [field]: value } })
  }

  const getStatusColor = (status) => {
    const s = status?.toUpperCase()
    switch (s) {
      case 'ACTIVE': return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      case 'PASSED': return 'bg-green-500/10 text-green-600 border-green-500/20'
      case 'FUNDED': return 'bg-purple-500/10 text-purple-600 border-purple-500/20'
      case 'FAILED': return 'bg-red-500/10 text-red-600 border-red-500/20'
      case 'EXPIRED': return 'bg-orange-500/10 text-orange-600 border-orange-500/20'
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  const getStatusIcon = (status) => {
    const s = status?.toUpperCase()
    switch (s) {
      case 'ACTIVE': return <Clock size={12} />
      case 'PASSED': 
      case 'FUNDED': return <CheckCircle size={12} />
      case 'FAILED': 
      case 'EXPIRED': return <XCircle size={12} />
      default: return null
    }
  }

  return (
    <AdminLayout title="Prop Firm Ecosystem" subtitle="Orchestrate trading challenges and funded capital infrastructure">
      {/* Infrastructure Control Center */}
      <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-[2.5rem] p-8 border-4 shadow-sm mb-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Layers size={140} className="text-slate-900 group-hover:rotate-12 transition-transform duration-700" />
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-8">
            <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-500 ${challengeModeEnabled ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/20 rotate-3' : 'bg-gradient-to-br from-slate-400 to-slate-600 shadow-slate-500/20'}`}>
              <Trophy size={48} className="text-white group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-2 h-2 rounded-full ${challengeModeEnabled ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
                <h3 style={{ color: modeColors.text }} className="font-black text-3xl tracking-tight leading-none">Prop Protocol V2</h3>
              </div>
              <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">
                {challengeModeEnabled 
                  ? 'Active Authorization: Users permitted to join the pool' 
                  : 'Protocol Locked: Capital entry points suspended'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button
              onClick={() => setShowSettingsModal(true)}
              style={{ backgroundColor: modeColors.bgSecondary, color: modeColors.textSecondary }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center border-2 border-transparent hover:border-slate-200 transition-all hover:text-blue-600 active:scale-95 shadow-inner"
              title="Protocol Settings"
            >
              <Settings size={28} />
            </button>
            <button
              onClick={toggleChallengeMode}
              className={`flex items-center gap-4 px-10 py-5 rounded-[1.50rem] font-black text-[12px] uppercase tracking-widest transition-all active:scale-95 border-b-4 ${
                challengeModeEnabled 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-xl shadow-green-500/30 border-green-800' 
                  : 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-xl shadow-slate-500/30 border-slate-900'
              }`}
            >
              {challengeModeEnabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              {challengeModeEnabled ? 'Protocol Online' : 'Protocol Offline'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Portfolio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { title: 'Pool Types', value: stats.totalChallenges || challenges.length, subtitle: 'Configured capital benchmarks', icon: Target, color: 'blue' },
          { title: 'Fleet Mass', value: stats.totalAccounts || 0, subtitle: 'Current active participants', icon: Users, color: 'indigo' },
          { title: 'Target Hit', value: stats.passedAccounts || 0, subtitle: 'Qualified terminal accounts', icon: Trophy, color: 'green' },
          { title: 'Liquidated', value: stats.failedAccounts || 0, subtitle: 'Accounts below drawdown limit', icon: Activity, color: 'red' }
        ].map((stat, idx) => (
          <div key={idx} style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-[2rem] p-6 border shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-${stat.color}-500/10 rounded-2xl flex items-center justify-center border border-${stat.color}-500/20 group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} className={`text-${stat.color}-600`} />
              </div>
              <div style={{ backgroundColor: modeColors.bgSecondary }} className="px-2 py-1 rounded-lg">
                <span style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest opacity-60">Fleet Stats</span>
              </div>
            </div>
            <p style={{ color: modeColors.textSecondary }} className="text-xs font-black uppercase tracking-widest italic opacity-70 mb-1">{stat.title}</p>
            <p style={{ color: modeColors.text }} className="text-4xl font-black tracking-tight">{stat.value}</p>
            <p style={{ color: modeColors.textMuted }} className="text-[10px] font-bold mt-3 flex items-center gap-1 opacity-60">
               {stat.subtitle}
            </p>
          </div>
        ))}
      </div>

      {/* Advanced Navigation Ecosystem */}
      <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
        <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="flex p-2 rounded-[1.5rem] border-2 shadow-sm">
          {[
            { id: 'challenges', label: 'Capital Pools', icon: Target },
            { id: 'participants', label: 'Fleet Registry', icon: Users }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-8 py-4 rounded-[1.2rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'challenges' && (
          <button 
            onClick={openAddChallenge}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[1.2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/30 hover:opacity-90 active:scale-95 transition-all border-b-4 border-blue-800"
          >
            <Plus size={18} />
            Initialize Pool
          </button>
        )}
      </div>

      {/* Challenges Tab */}
      {activeTab === 'challenges' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {challenges.length === 0 ? (
            <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="col-span-full rounded-[3rem] border-4 border-dashed p-20 text-center">
              <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <Trophy size={48} className="text-slate-300" />
              </div>
              <h3 style={{ color: modeColors.text }} className="text-2xl font-black mb-2 tracking-tight">Vortex Empty</h3>
              <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest opacity-60">No active capital benchmarks found in the registry</p>
            </div>
          ) : (
            challenges.map((challenge, idx) => (
              <div 
                key={challenge._id} 
                className="rounded-[2.5rem] border-4 shadow-sm hover:shadow-2xl transition-all duration-500 group overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4"
                style={{ 
                  backgroundColor: modeColors.card, 
                  borderColor: modeColors.border,
                  animationDelay: `${idx * 100}ms` 
                }}
              >
                <div className="p-8 pb-0">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] border-2 ${challenge.isActive ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                      {challenge.isActive ? 'Protocol Active' : 'Registry Standby'}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openEditChallenge(challenge)}
                        style={{ backgroundColor: modeColors.bgSecondary }}
                        className="p-3 rounded-xl text-slate-400 hover:text-blue-600 transition-colors border border-transparent hover:border-slate-200"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => deleteChallenge(challenge._id)}
                        style={{ backgroundColor: modeColors.bgSecondary }}
                        className="p-3 rounded-xl text-slate-400 hover:text-red-600 transition-colors border border-transparent hover:border-slate-200"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <h3 style={{ color: modeColors.text }} className="text-2xl font-black tracking-tight mb-2 group-hover:text-blue-600 transition-colors uppercase italic">{challenge.name}</h3>
                  <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-8 leading-relaxed line-clamp-2">
                    {challenge.description || 'No operational description provided for this capital benchmark.'}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div style={{ backgroundColor: modeColors.bgSecondary }} className="p-5 rounded-[1.5rem] border-2 border-transparent group-hover:border-slate-200 transition-all">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Provision Size</p>
                      <p style={{ color: modeColors.text }} className="text-2xl font-black tracking-tighter">${(challenge.fundSize || 0).toLocaleString()}</p>
                    </div>
                    <div style={{ backgroundColor: modeColors.bgSecondary }} className="p-5 rounded-[1.5rem] border-2 border-transparent group-hover:border-slate-200 transition-all">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Entry Quantum</p>
                      <p className="text-2xl font-black tracking-tighter text-blue-600">${(challenge.challengeFee || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        <span style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest">Yield Target</span>
                      </div>
                      <span className="text-xs font-black text-green-600">+{challenge.profitTarget || 8}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        <span style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest">Max Drawdown</span>
                      </div>
                      <span className="text-xs font-black text-red-600">-{challenge.maxDrawdown || 10}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        <span style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest">Temporal Limit</span>
                      </div>
                      <span style={{ color: modeColors.text }} className="text-xs font-black uppercase">{challenge.durationDays || 30} Operational Days</span>
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: modeColors.bgSecondary }} className="mt-auto p-6 flex items-center justify-between border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
                      <Activity size={14} className="text-blue-600" />
                    </div>
                    <span style={{ color: modeColors.textSecondary }} className="text-[9px] font-black uppercase tracking-widest opacity-60">
                      {challenge.stepsCount === 0 ? 'Instant Provisioning' : `${challenge.stepsCount}-Phase Verification`}
                    </span>
                  </div>
                  <ArrowUpRight size={18} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Participants Tab */}
      {activeTab === 'participants' && (
        <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-[2.5rem] border-4 overflow-hidden shadow-sm">
          <div style={{ borderBottomColor: modeColors.border }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-8 border-b-2">
            <div>
              <h2 style={{ color: modeColors.text }} className="text-2xl font-black tracking-tight mb-1">Fleet Registry</h2>
              <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Operational status of all active capital participants</p>
            </div>
            <div className="relative group">
              <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                placeholder="SEARCH REGISTRY..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                className="w-full sm:w-80 border-2 rounded-2xl pl-14 pr-6 py-4 font-black text-[10px] tracking-widest uppercase focus:outline-none focus:border-blue-500 transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="block lg:hidden p-6 space-y-4">
            {participants.length === 0 ? (
              <div className="text-center py-20">
                <Users size={48} className="text-slate-200 mx-auto mb-4" />
                <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest opacity-60">No participants registered</p>
              </div>
            ) : (
              participants.map((p) => (
                <div key={p._id} style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border }} className="rounded-[2rem] p-6 border-2 hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p style={{ color: modeColors.text }} className="font-black text-sm uppercase italic leading-none mb-1">{p.userId?.firstName || p.userId?.email || 'Unknown'}</p>
                      <p style={{ color: modeColors.textSecondary }} className="text-[9px] font-black uppercase tracking-widest opacity-60">{p.challengeId?.name || 'Standard Pool'}</p>
                    </div>
                    <span className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border-2 ${getStatusColor(p.status)}`}>
                      {getStatusIcon(p.status)}
                      {p.status}
                    </span>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                      <span style={{ color: modeColors.textSecondary }}>Equity Mass</span>
                      <span style={{ color: modeColors.text }}>${(p.currentBalance || 0).toLocaleString()}</span>
                    </div>
                    <div style={{ backgroundColor: modeColors.border }} className="w-full rounded-full h-2.5 overflow-hidden border border-white/10 shadow-inner">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${p.status === 'FAILED' ? 'bg-red-500' : p.status === 'PASSED' ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}
                        style={{ width: `${Math.min(((p.currentBalance - p.initialBalance) / p.initialBalance * 100) + 50, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-white/40 p-3 rounded-xl border border-white/60">
                    <span style={{ color: modeColors.textSecondary }} className="text-[9px] font-black uppercase tracking-widest">Growth Vector</span>
                    <span className={`text-[11px] font-black font-mono ${(p.currentBalance - p.initialBalance) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {(p.currentBalance - p.initialBalance) >= 0 ? '+' : ''}${Math.abs((p.currentBalance || 0) - (p.initialBalance || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: modeColors.bgSecondary }}>
                  <th style={{ color: modeColors.textSecondary }} className="text-left text-[10px] font-black uppercase tracking-[0.2em] py-6 px-8 opacity-60 italic">Operator</th>
                  <th style={{ color: modeColors.textSecondary }} className="text-left text-[10px] font-black uppercase tracking-[0.2em] py-6 px-8 opacity-60 italic">Benchmark</th>
                  <th style={{ color: modeColors.textSecondary }} className="text-left text-[10px] font-black uppercase tracking-[0.2em] py-6 px-8 opacity-60 italic">Mass</th>
                  <th style={{ color: modeColors.textSecondary }} className="text-left text-[10px] font-black uppercase tracking-[0.2em] py-6 px-8 opacity-60 italic">Growth</th>
                  <th style={{ color: modeColors.textSecondary }} className="text-left text-[10px] font-black uppercase tracking-[0.2em] py-6 px-8 opacity-60 italic">Status</th>
                  <th style={{ color: modeColors.textSecondary }} className="text-left text-[10px] font-black uppercase tracking-[0.2em] py-6 px-8 opacity-60 italic">Entry Date</th>
                  <th style={{ color: modeColors.textSecondary }} className="text-right text-[10px] font-black uppercase tracking-[0.2em] py-6 px-8 opacity-60 italic">Terminal</th>
                </tr>
              </thead>
              <tbody>
                {participants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-32 text-center">
                      <div className="flex flex-col items-center">
                        <Users size={64} className="text-slate-100 mb-4" />
                        <p style={{ color: modeColors.textSecondary }} className="text-[11px] font-black uppercase tracking-widest opacity-40">Registry Database Empty</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  participants.map((p) => {
                    const pnl = (p.currentBalance || 0) - (p.initialBalance || 0)
                    return (
                      <tr key={p._id} style={{ borderBottomColor: modeColors.border }} className="border-b transition-colors hover:bg-slate-50/80 group">
                        <td className="py-6 px-8">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center font-black text-slate-400 group-hover:from-blue-500 group-hover:to-indigo-600 group-hover:text-white transition-all">
                              {p.userId?.firstName?.[0] || 'U'}
                            </div>
                            <div>
                              <p style={{ color: modeColors.text }} className="font-black text-[13px] uppercase italic tracking-tight">{p.userId?.firstName || p.userId?.email || 'Unknown'}</p>
                              <p style={{ color: modeColors.textSecondary }} className="text-[9px] font-black uppercase tracking-[0.1em] opacity-40">{p.userId?._id?.slice(-8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-8">
                          <span style={{ color: modeColors.textMuted }} className="text-[10px] font-black uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">{p.challengeId?.name || 'Pool'}</span>
                        </td>
                        <td className="py-6 px-8">
                          <p style={{ color: modeColors.text }} className="font-mono font-black text-[14px] tracking-tighter">${(p.currentBalance || 0).toLocaleString()}</p>
                        </td>
                        <td className="py-6 px-8">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl font-black font-mono text-[11px] ${pnl >= 0 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                            {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toLocaleString()}
                          </div>
                        </td>
                        <td className="py-6 px-8">
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border-2 shadow-sm ${getStatusColor(p.status)}`}>
                            {getStatusIcon(p.status)}
                            {p.status}
                          </span>
                        </td>
                        <td style={{ color: modeColors.textSecondary }} className="py-6 px-8 text-[11px] font-black uppercase italic group-hover:text-slate-900 transition-colors">
                          {new Date(p.createdAt).toLocaleDateString(undefined, { year: '2024', month: 'short', day: 'numeric' }).toUpperCase()}
                        </td>
                        <td className="py-6 px-8 text-right">
                          <button style={{ backgroundColor: modeColors.bgSecondary }} className="p-3 rounded-xl text-slate-400 hover:text-blue-600 transition-all border border-transparent hover:border-slate-200 active:scale-95 shadow-sm">
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Protocol Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div 
            style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} 
            className="rounded-[3rem] w-full max-w-lg border-4 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300"
          >
            <div className="p-10 border-b border-slate-100 flex items-center justify-between" style={{ backgroundColor: modeColors.card }}>
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-blue-500/20">
                  <Settings size={32} className="text-white" />
                </div>
                <div>
                  <h2 style={{ color: modeColors.text }} className="text-2xl font-black tracking-tight">Protocol Config</h2>
                  <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest opacity-60 italic">Core Prop Ecosystem Settings</p>
                </div>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all active:scale-90 shadow-sm">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            
            <div className="p-10 space-y-8">
              <div className="space-y-3">
                <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Display Identity</label>
                <input
                  type="text"
                  value={settings.displayName}
                  onChange={(e) => setSettings({...settings, displayName: e.target.value})}
                  placeholder="PROP TRADING CHALLENGE..."
                  style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                  className="w-full border-2 rounded-2xl px-6 py-4 font-black text-[10px] tracking-widest uppercase focus:outline-none focus:border-blue-500 transition-all shadow-inner hover:bg-white"
                />
              </div>

              <div className="space-y-3">
                <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Ecosystem Manifest</label>
                <textarea
                  value={settings.description}
                  onChange={(e) => setSettings({...settings, description: e.target.value})}
                  placeholder="DESCRIBE THE POOL INFRASTRUCTURE..."
                  rows={3}
                  style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                  className="w-full border-2 rounded-2xl px-6 py-4 font-black text-[10px] tracking-widest uppercase focus:outline-none focus:border-blue-500 transition-all shadow-inner hover:bg-white resize-none"
                />
              </div>

              <div className="space-y-3">
                <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Legal Protocol (T&C)</label>
                <textarea
                  value={settings.termsAndConditions}
                  onChange={(e) => setSettings({...settings, termsAndConditions: e.target.value})}
                  placeholder="SPECIFY TERMS AND OPERATIONAL CONDITIONS..."
                  rows={4}
                  style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                  className="w-full border-2 rounded-2xl px-6 py-4 font-black text-[10px] tracking-widest uppercase focus:outline-none focus:border-blue-500 transition-all shadow-inner hover:bg-white resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  style={{ backgroundColor: modeColors.bgSecondary, color: modeColors.textMuted }}
                  className="flex-1 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest border-2 border-transparent hover:border-slate-200 transition-all active:scale-95 shadow-sm"
                >
                  Discard
                </button>
                <button
                  onClick={saveSettings}
                  className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-blue-500/40 hover:opacity-90 transition-all active:scale-95 border-b-4 border-blue-800"
                >
                  Commit Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prototype Configuration Modal */}
      {showChallengeModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div 
            style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} 
            className="rounded-[3rem] w-full max-w-5xl max-h-[90vh] border-4 shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
          >
            <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10" style={{ backgroundColor: modeColors.card }}>
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-blue-500/20">
                  <Plus size={32} className="text-white" />
                </div>
                <div>
                  <h2 style={{ color: modeColors.text }} className="text-2xl font-black tracking-tight">
                    {editingChallenge ? 'Benchmark Modification' : 'Initialize Benchmark'}
                  </h2>
                  <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest opacity-60 italic">Architecting Capital Allocation Parameters</p>
                </div>
              </div>
              <button onClick={() => setShowChallengeModal(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all active:scale-90 shadow-sm">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            
            <div className="p-10 overflow-y-auto space-y-10 flex-1 custom-scrollbar">
              {/* Core Identity Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Pool Descriptor</label>
                  <input
                    type="text"
                    value={challengeForm.name}
                    onChange={(e) => setChallengeForm({...challengeForm, name: e.target.value})}
                    placeholder="PROTOCOL NAME (E.G. TITAN CORE)..."
                    style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                    className="w-full border-2 rounded-2xl px-6 py-4 font-black text-[10px] tracking-widest uppercase focus:outline-none focus:border-blue-500 transition-all shadow-inner hover:bg-white"
                  />
                </div>
                <div className="space-y-3">
                  <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Operational Brief</label>
                  <input
                    type="text"
                    value={challengeForm.description}
                    onChange={(e) => setChallengeForm({...challengeForm, description: e.target.value})}
                    placeholder="SHORT STRATEGY OVERVIEW..."
                    style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                    className="w-full border-2 rounded-2xl px-6 py-4 font-black text-[10px] tracking-widest uppercase focus:outline-none focus:border-blue-500 transition-all shadow-inner hover:bg-white"
                  />
                </div>
              </div>

              {/* Matrix Parameters Section */}
              <div style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border }} className="rounded-[2.5rem] p-8 border-2 shadow-inner relative overflow-hidden">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                  <h4 style={{ color: modeColors.text }} className="font-black text-[10px] uppercase tracking-[0.3em] opacity-40 italic">Allocation & Entry Matrix</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-3">
                    <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Provisioning Logic</label>
                    <select
                      value={challengeForm.stepsCount}
                      onChange={(e) => setChallengeForm({...challengeForm, stepsCount: parseInt(e.target.value)})}
                      style={{ backgroundColor: modeColors.card, borderColor: modeColors.border, color: modeColors.text }}
                      className="w-full border-2 rounded-2xl px-6 py-4 font-black text-[10px] tracking-widest uppercase focus:outline-none focus:border-blue-500 transition-all hover:bg-slate-50 cursor-pointer"
                    >
                      <option value={0}>Instant Provision (0-Phase)</option>
                      <option value={1}>Linear Verify (1-Phase)</option>
                      <option value={2}>Quantum Verify (2-Phase)</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Mass Allocation ($)</label>
                    <div className="relative group">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400 group-focus-within:text-blue-500 transition-colors">$</span>
                      <input
                        type="number"
                        value={challengeForm.fundSize}
                        onChange={(e) => setChallengeForm({...challengeForm, fundSize: parseFloat(e.target.value) || 0})}
                        style={{ backgroundColor: modeColors.card, borderColor: modeColors.border, color: modeColors.text }}
                        className="w-full border-2 rounded-2xl pl-12 pr-6 py-4 font-black text-sm tracking-tighter focus:outline-none focus:border-blue-500 transition-all hover:bg-slate-50"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Entry Quantum ($)</label>
                    <div className="relative group">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-blue-600">$</span>
                      <input
                        type="number"
                        value={challengeForm.challengeFee}
                        onChange={(e) => setChallengeForm({...challengeForm, challengeFee: parseFloat(e.target.value) || 0})}
                        style={{ backgroundColor: modeColors.card, borderColor: modeColors.border, color: modeColors.text }}
                        className="w-full border-2 rounded-2xl pl-12 pr-6 py-4 font-black text-sm tracking-tighter text-blue-600 focus:outline-none focus:border-blue-500 transition-all hover:bg-slate-50 shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Constraints */}
              <div style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border }} className="rounded-[2.5rem] p-8 border-2 shadow-inner">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-1.5 h-6 bg-red-500 rounded-full" />
                  <h4 style={{ color: modeColors.text }} className="font-black text-[10px] uppercase tracking-[0.3em] opacity-40 italic">Performance Constraints</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div className="space-y-3">
                    <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Daily DD %</label>
                    <input
                      type="number"
                      value={challengeForm.rules.maxDailyDrawdownPercent}
                      onChange={(e) => updateFormRules('maxDailyDrawdownPercent', parseFloat(e.target.value) || 0)}
                      style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }}
                      className="w-full border-2 rounded-2xl px-6 py-4 font-black text-sm tracking-tighter text-red-500 focus:outline-none focus:border-red-500 transition-all hover:bg-slate-50 shadow-sm"
                    />
                  </div>
                  <div className="space-y-3">
                    <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Overall DD %</label>
                    <input
                      type="number"
                      value={challengeForm.rules.maxOverallDrawdownPercent}
                      onChange={(e) => updateFormRules('maxOverallDrawdownPercent', parseFloat(e.target.value) || 0)}
                      style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }}
                      className="w-full border-2 rounded-2xl px-6 py-4 font-black text-sm tracking-tighter text-red-500 focus:outline-none focus:border-red-500 transition-all hover:bg-slate-50 shadow-sm"
                    />
                  </div>
                  <div className="space-y-3">
                    <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Phase 1 Target %</label>
                    <input
                      type="number"
                      value={challengeForm.rules.profitTargetPhase1Percent}
                      onChange={(e) => updateFormRules('profitTargetPhase1Percent', parseFloat(e.target.value) || 0)}
                      style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }}
                      className="w-full border-2 rounded-2xl px-6 py-4 font-black text-sm tracking-tighter text-green-600 focus:outline-none focus:border-green-500 transition-all hover:bg-slate-50 shadow-sm"
                    />
                  </div>
                  <div className="space-y-3">
                    <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Phase 2 Target %</label>
                    <input
                      type="number"
                      disabled={challengeForm.stepsCount < 2}
                      value={challengeForm.rules.profitTargetPhase2Percent}
                      onChange={(e) => updateFormRules('profitTargetPhase2Percent', parseFloat(e.target.value) || 0)}
                      style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }}
                      className={`w-full border-2 rounded-2xl px-6 py-4 font-black text-sm tracking-tighter text-green-600 focus:outline-none focus:border-green-500 transition-all hover:bg-slate-50 shadow-sm ${challengeForm.stepsCount < 2 ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
                    />
                  </div>
                </div>
              </div>

              {/* Terminal Execution Limits */}
              <div style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border }} className="rounded-[2.5rem] p-8 border-2 shadow-inner">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                  <h4 style={{ color: modeColors.text }} className="font-black text-[10px] uppercase tracking-[0.3em] opacity-40 italic">Terminal Execution Limits</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div className="space-y-3">
                    <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Min Lot Size</label>
                    <input
                      type="number"
                      step="0.01"
                      value={challengeForm.rules.minLotSize}
                      onChange={(e) => updateFormRules('minLotSize', parseFloat(e.target.value) || 0.01)}
                      style={{ backgroundColor: modeColors.card, borderColor: modeColors.border, color: modeColors.text }}
                      className="w-full border-2 rounded-2xl px-6 py-4 font-black text-sm tracking-tighter focus:outline-none focus:border-blue-500 transition-all hover:bg-slate-50 shadow-sm"
                    />
                  </div>
                  <div className="space-y-3">
                    <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Max Lot Size</label>
                    <input
                      type="number"
                      value={challengeForm.rules.maxLotSize}
                      onChange={(e) => updateFormRules('maxLotSize', parseFloat(e.target.value) || 100)}
                      style={{ backgroundColor: modeColors.card, borderColor: modeColors.border, color: modeColors.text }}
                      className="w-full border-2 rounded-2xl px-6 py-4 font-black text-sm tracking-tighter focus:outline-none focus:border-blue-500 transition-all hover:bg-slate-50 shadow-sm"
                    />
                  </div>
                  <div className="space-y-3">
                    <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Min Pos Count</label>
                    <input
                      type="number"
                      value={challengeForm.rules.minTradesRequired || ''}
                      onChange={(e) => updateFormRules('minTradesRequired', parseInt(e.target.value) || null)}
                      placeholder="NO LIMIT"
                      style={{ backgroundColor: modeColors.card, borderColor: modeColors.border, color: modeColors.text }}
                      className="w-full border-2 rounded-2xl px-6 py-4 font-black text-sm tracking-tighter focus:outline-none focus:border-blue-500 transition-all hover:bg-slate-50 shadow-sm"
                    />
                  </div>
                  <div className="space-y-3">
                    <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Concurrent Cap</label>
                    <input
                      type="number"
                      value={challengeForm.rules.maxConcurrentTrades || ''}
                      onChange={(e) => updateFormRules('maxConcurrentTrades', parseInt(e.target.value) || null)}
                      placeholder="NO LIMIT"
                      style={{ backgroundColor: modeColors.card, borderColor: modeColors.border, color: modeColors.text }}
                      className="w-full border-2 rounded-2xl px-6 py-4 font-black text-sm tracking-tighter focus:outline-none focus:border-blue-500 transition-all hover:bg-slate-50 shadow-sm"
                    />
                  </div>
                </div>
              </div>
              {/* Risk & Temporal Parameters */}
              <div style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border }} className="rounded-[2.5rem] p-8 border-2 shadow-inner">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                  <h4 style={{ color: modeColors.text }} className="font-black text-[10px] uppercase tracking-[0.3em] opacity-40 italic">Risk & Temporal Parameters</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div className="space-y-3">
                    <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Max Leverage</label>
                    <input
                      type="number"
                      value={challengeForm.rules.maxLeverage}
                      onChange={(e) => updateFormRules('maxLeverage', parseInt(e.target.value) || 100)}
                      style={{ backgroundColor: modeColors.card, borderColor: modeColors.border, color: modeColors.text }}
                      className="w-full border-2 rounded-2xl px-6 py-4 font-black text-sm tracking-tighter focus:outline-none focus:border-blue-500 transition-all hover:bg-slate-50 shadow-sm"
                    />
                  </div>
                  <div className="space-y-3">
                    <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Hold Floor (SEC)</label>
                    <input
                      type="number"
                      value={challengeForm.rules.minTradeHoldTimeSeconds}
                      onChange={(e) => updateFormRules('minTradeHoldTimeSeconds', parseInt(e.target.value) || 0)}
                      style={{ backgroundColor: modeColors.card, borderColor: modeColors.border, color: modeColors.text }}
                      className="w-full border-2 rounded-2xl px-6 py-4 font-black text-sm tracking-tighter focus:outline-none focus:border-blue-500 transition-all hover:bg-slate-50 shadow-sm"
                    />
                  </div>
                  <div className="space-y-3">
                    <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Temporal Limit (DAYS)</label>
                    <input
                      type="number"
                      value={challengeForm.rules.challengeExpiryDays}
                      onChange={(e) => updateFormRules('challengeExpiryDays', parseInt(e.target.value) || 30)}
                      style={{ backgroundColor: modeColors.card, borderColor: modeColors.border, color: modeColors.text }}
                      className="w-full border-2 rounded-2xl px-6 py-4 font-black text-sm tracking-tighter focus:outline-none focus:border-blue-500 transition-all hover:bg-slate-50 shadow-sm"
                    />
                  </div>
                  <div className="space-y-3">
                    <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Profit Split %</label>
                    <input
                      type="number"
                      value={challengeForm.fundedSettings.profitSplitPercent}
                      onChange={(e) => updateFormFunded('profitSplitPercent', parseInt(e.target.value) || 80)}
                      style={{ backgroundColor: modeColors.card, borderColor: modeColors.border, color: modeColors.text }}
                      className="w-full border-2 rounded-2xl px-6 py-4 font-black text-sm tracking-tighter focus:outline-none focus:border-blue-500 transition-all hover:bg-slate-50 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Protocol Logic Toggles */}
              <div style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border }} className="rounded-[2.5rem] p-8 border-2 shadow-inner">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-1.5 h-6 bg-slate-400 rounded-full" />
                  <h4 style={{ color: modeColors.text }} className="font-black text-[10px] uppercase tracking-[0.3em] opacity-40 italic">Protocol Logic Toggles</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'SL MANDATORY', key: 'stopLossMandatory' },
                    { label: 'TP MANDATORY', key: 'takeProfitMandatory' },
                    { label: 'WEEKEND HOLD', key: 'allowWeekendHolding' },
                    { label: 'NEWS TRADING', key: 'allowNewsTrading' }
                  ].map((toggle) => (
                    <label key={toggle.key} className="relative flex items-center group cursor-pointer hover:bg-white p-4 rounded-2xl transition-all border-2 border-transparent hover:border-slate-100 shadow-sm">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={challengeForm.rules[toggle.key]}
                          onChange={(e) => updateFormRules(toggle.key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 transition-all shadow-inner" />
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-6 shadow-md" />
                      </div>
                      <span style={{ color: modeColors.text }} className="ml-4 text-[10px] font-black uppercase tracking-widest opacity-80">{toggle.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Activation Status */}
              <div className="flex items-center gap-6 px-4">
                 <label className="relative flex items-center group cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={challengeForm.isActive}
                      onChange={(e) => setChallengeForm({...challengeForm, isActive: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-16 h-8 bg-slate-200 rounded-full peer peer-checked:bg-green-500 transition-all shadow-inner" />
                    <div className="absolute left-1.5 top-1.5 w-5 h-5 bg-white rounded-full transition-all peer-checked:translate-x-8 shadow-md" />
                  </div>
                  <div className="ml-4">
                    <span style={{ color: modeColors.text }} className="block text-[11px] font-black uppercase tracking-widest">Protocol Online</span>
                    <span style={{ color: modeColors.textSecondary }} className="text-[9px] font-black uppercase tracking-widest opacity-40 italic">Active in Public Registry</span>
                  </div>
                </label>
              </div>

              {/* Tactical Actions */}
              <div className="flex gap-4 pt-10 mt-10 border-t-2 border-slate-100">
                <button
                  onClick={() => setShowChallengeModal(false)}
                  style={{ backgroundColor: modeColors.bgSecondary, color: modeColors.textMuted }}
                  className="flex-1 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest border-2 border-transparent hover:border-slate-200 transition-all active:scale-95 shadow-sm"
                >
                  Abort Operation
                </button>
                <button
                  onClick={saveChallenge}
                  className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-blue-500/40 hover:opacity-90 transition-all active:scale-95 border-b-4 border-blue-800"
                >
                  {editingChallenge ? 'Finalize Modification' : 'Deploy Benchmark'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminPropFirm
