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
    <AdminLayout title="Prop Firm Management" subtitle="Manage trading challenges and funded account infrastructure">
      {/* Header Configuration */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${challengeModeEnabled ? 'bg-green-500/10 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
              <Trophy size={28} />
            </div>
            <div>
              <h3 className="text-slate-900 font-bold text-xl leading-tight">Prop Trading Protocol</h3>
              <p className="text-slate-500 text-sm mt-0.5">
                {challengeModeEnabled 
                  ? 'Protocol Active: Users can purchase challenges' 
                  : 'Protocol Inactive: Challenges are currently disabled'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-3 bg-slate-50 text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all active:scale-95"
              title="Settings"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={toggleChallengeMode}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 border ${
                challengeModeEnabled 
                  ? 'bg-green-500 text-white border-green-600 shadow-sm' 
                  : 'bg-slate-800 text-white border-slate-900 shadow-sm'
              }`}
            >
              {challengeModeEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              {challengeModeEnabled ? 'Status: Online' : 'Status: Offline'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { title: 'Goal Types', value: stats.totalChallenges || challenges.length, subtitle: 'Challenge benchmarks', icon: Target, color: 'blue' },
          { title: 'Total Accounts', value: stats.totalAccounts || 0, subtitle: 'Active participants', icon: Users, color: 'indigo' },
          { title: 'Passed Accounts', value: stats.passedAccounts || 0, subtitle: 'Qualified traders', icon: CheckCircle, color: 'green' },
          { title: 'Failed Accounts', value: stats.failedAccounts || 0, subtitle: 'Drawdown limit breaches', icon: XCircle, color: 'red' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-10 h-10 bg-${stat.color}-500/10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105`}>
                <stat.icon size={20} className={`text-${stat.color}-600`} />
              </div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{stat.title}</p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-slate-900 text-3xl font-bold tracking-tight">{stat.value}</p>
              <p className="text-slate-400 text-xs font-medium">{stat.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          {[
            { id: 'challenges', label: 'Challenges', icon: Target },
            { id: 'participants', label: 'Participants', icon: Users }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'challenges' && (
          <button 
            onClick={openAddChallenge}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
          >
            <Plus size={18} />
            Create Challenge
          </button>
        )}
      </div>

      {/* Challenges Tab */}
      {activeTab === 'challenges' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {challenges.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trophy size={32} className="text-slate-300" />
              </div>
              <h3 className="text-slate-900 font-bold text-xl mb-1">No challenges found</h3>
              <p className="text-slate-500 text-sm">Get started by creating your first trading challenge pool.</p>
            </div>
          ) : (
            challenges.map((challenge, idx) => (
              <div 
                key={challenge._id} 
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${challenge.isActive ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                      {challenge.isActive ? 'Active' : 'Draft'}
                    </span>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => openEditChallenge(challenge)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => deleteChallenge(challenge._id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-slate-900 font-bold text-lg mb-1 group-hover:text-blue-600 transition-colors uppercase">{challenge.name}</h3>
                  <p className="text-slate-500 text-xs font-medium line-clamp-2 mb-6">
                    {challenge.description || 'Professional trading challenge benchmark for capital allocation.'}
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Account Size</p>
                      <p className="text-lg font-bold text-slate-900">${(challenge.fundSize || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Challenge Fee</p>
                      <p className="text-lg font-bold text-blue-600">${(challenge.challengeFee || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Profit Target</span>
                      <span className="font-bold text-green-600">+{challenge.profitTarget || 8}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Max Drawdown</span>
                      <span className="font-bold text-red-600">-{challenge.maxDrawdown || 10}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Duration</span>
                      <span className="text-slate-900 font-bold">{challenge.durationDays || 30} Days</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between rounded-b-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {challenge.stepsCount === 0 ? 'Instant Funding' : `${challenge.stepsCount}-Step Evolution`}
                  </span>
                  <ArrowUpRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Participants Tab */}
      {activeTab === 'participants' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Active Participants</h2>
              <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">Real-time status of all accounts in the Prop system</p>
            </div>
            <div className="relative group">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 border border-slate-200 bg-slate-50 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="text-left text-[10px] font-bold uppercase tracking-widest py-4 px-6 text-slate-400">User / Account</th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-widest py-4 px-6 text-slate-400">Benchmark</th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-widest py-4 px-6 text-slate-400">Equity</th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-widest py-4 px-6 text-slate-400">Performance</th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-widest py-4 px-6 text-slate-400">Status</th>
                  <th className="text-right text-[10px] font-bold uppercase tracking-widest py-4 px-6 text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {participants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <Users size={48} className="text-slate-200 mx-auto mb-2" />
                      <p className="text-slate-400 text-xs font-medium">No active participants found</p>
                    </td>
                  </tr>
                ) : (
                  participants.map((p) => {
                    const pnl = (p.currentBalance || 0) - (p.initialBalance || 0)
                    return (
                      <tr key={p._id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-sm">
                              {p.userId?.firstName?.[0] || 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm leading-tight">{p.userId?.firstName || p.userId?.email || 'Unknown'}</p>
                              <p className="text-[10px] text-slate-400 font-medium tracking-tight">ID: {p.userId?._id?.slice(-8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                            {p.challengeId?.name || 'Pool'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-bold text-slate-900 text-sm">${(p.currentBalance || 0).toLocaleString()}</p>
                        </td>
                        <td className="py-4 px-6">
                          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold ${pnl >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toLocaleString()}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getStatusColor(p.status)}`}>
                            {getStatusIcon(p.status)}
                            {p.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button className="p-2 text-slate-400 hover:text-blue-600 transition-all rounded-lg hover:bg-white shadow-sm">
                            <Eye size={16} />
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

      {/* Challenge Management Modal */}
      {showChallengeModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] border border-slate-200 shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  {editingChallenge ? <Edit size={24} className="text-white" /> : <Plus size={24} className="text-white" />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingChallenge ? 'Edit Challenge' : 'Create New Challenge'}
                  </h2>
                  <p className="text-xs font-medium text-slate-500">Configure trading parameters and capital thresholds</p>
                </div>
              </div>
              <button onClick={() => setShowChallengeModal(false)} className="p-2 hover:bg-slate-50 rounded-lg transition-all text-slate-400">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-8 flex-1">
              {/* Identity and Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Challenge Name</label>
                  <input
                    type="text"
                    value={challengeForm.name}
                    onChange={(e) => setChallengeForm({...challengeForm, name: e.target.value})}
                    placeholder="e.g., Diamond Challenge"
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Description</label>
                  <input
                    type="text"
                    value={challengeForm.description}
                    onChange={(e) => setChallengeForm({...challengeForm, description: e.target.value})}
                    placeholder="Brief objective overview..."
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Core Financials */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-1 h-3 bg-blue-500 rounded-full" />
                  Capital Allocation & Fees
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Evaluation Steps</label>
                    <select
                      value={challengeForm.stepsCount}
                      onChange={(e) => setChallengeForm({...challengeForm, stepsCount: parseInt(e.target.value)})}
                      className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                    >
                      <option value={0}>Instant Funding (0-Phase)</option>
                      <option value={1}>1-Phase Challenge</option>
                      <option value={2}>2-Phase Challenge</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Fund Size ($)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input
                        type="number"
                        value={challengeForm.fundSize}
                        onChange={(e) => setChallengeForm({...challengeForm, fundSize: parseFloat(e.target.value) || 0})}
                        className="w-full border border-slate-200 bg-white rounded-xl pl-8 pr-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Challenge Fee ($)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 font-bold">$</span>
                      <input
                        type="number"
                        value={challengeForm.challengeFee}
                        onChange={(e) => setChallengeForm({...challengeForm, challengeFee: parseFloat(e.target.value) || 0})}
                        className="w-full border border-slate-200 bg-white rounded-xl pl-8 pr-4 py-3 text-sm font-bold text-blue-600 focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawdown and Targets */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-1 h-3 bg-red-500 rounded-full" />
                  Risk Management & Targets
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Daily DD %</label>
                    <input
                      type="number"
                      value={challengeForm.rules.maxDailyDrawdownPercent}
                      onChange={(e) => updateFormRules('maxDailyDrawdownPercent', parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-sm font-bold text-red-600 focus:outline-none focus:border-red-500 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Overall DD %</label>
                    <input
                      type="number"
                      value={challengeForm.rules.maxOverallDrawdownPercent}
                      onChange={(e) => updateFormRules('maxOverallDrawdownPercent', parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-sm font-bold text-red-600 focus:outline-none focus:border-red-500 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Phase 1 Target %</label>
                    <input
                      type="number"
                      value={challengeForm.rules.profitTargetPhase1Percent}
                      onChange={(e) => updateFormRules('profitTargetPhase1Percent', parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-sm font-bold text-green-600 focus:outline-none focus:border-green-500 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Phase 2 Target %</label>
                    <input
                      type="number"
                      disabled={challengeForm.stepsCount < 2}
                      value={challengeForm.rules.profitTargetPhase2Percent}
                      onChange={(e) => updateFormRules('profitTargetPhase2Percent', parseFloat(e.target.value) || 0)}
                      className={`w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-sm font-bold text-green-600 focus:outline-none focus:border-green-500 shadow-sm ${challengeForm.stepsCount < 2 ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
                    />
                  </div>
                </div>
              </div>

              {/* Trading Rules */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-1 h-3 bg-amber-500 rounded-full" />
                  Trading Constraints
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Leverage</label>
                    <input
                      type="number"
                      value={challengeForm.rules.maxLeverage}
                      onChange={(e) => updateFormRules('maxLeverage', parseInt(e.target.value) || 100)}
                      className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Lot Size (Min)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={challengeForm.rules.minLotSize}
                      onChange={(e) => updateFormRules('minLotSize', parseFloat(e.target.value) || 0.01)}
                      className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Hold Time (Sec)</label>
                    <input
                      type="number"
                      value={challengeForm.rules.minTradeHoldTimeSeconds}
                      onChange={(e) => updateFormRules('minTradeHoldTimeSeconds', parseInt(e.target.value) || 0)}
                      className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Expiry (Days)</label>
                    <input
                      type="number"
                      value={challengeForm.rules.challengeExpiryDays}
                      onChange={(e) => updateFormRules('challengeExpiryDays', parseInt(e.target.value) || 30)}
                      className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Stop Loss Mandatory', key: 'stopLossMandatory' },
                  { label: 'Take Profit Mandatory', key: 'takeProfitMandatory' },
                  { label: 'Weekend Holding', key: 'allowWeekendHolding' },
                  { label: 'News Trading', key: 'allowNewsTrading' }
                ].map((toggle) => (
                  <label key={toggle.key} className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={challengeForm.rules[toggle.key]}
                        onChange={(e) => updateFormRules(toggle.key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 transition-all shadow-inner" />
                      <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-all peer-checked:translate-x-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{toggle.label}</span>
                  </label>
                ))}
              </div>

              {/* Activation */}
              <label className="flex items-center gap-4 bg-green-50/50 p-6 rounded-2xl border border-green-100 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={challengeForm.isActive}
                    onChange={(e) => setChallengeForm({...challengeForm, isActive: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:bg-green-500 transition-all shadow-inner" />
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-6" />
                </div>
                <div>
                  <span className="block text-sm font-bold text-slate-900 uppercase tracking-tight">Active for Users</span>
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Publicly visible in the challenge pool</span>
                </div>
              </label>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button
                onClick={() => setShowChallengeModal(false)}
                className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveChallenge}
                className="flex-[2] py-3.5 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-blue-600 shadow-lg shadow-slate-200 transition-all active:scale-95"
              >
                {editingChallenge ? 'Save Changes' : 'Initialize Challenge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminPropFirm
