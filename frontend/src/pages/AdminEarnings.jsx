import { API_URL } from '../config/api'
import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { 
  DollarSign,
  TrendingUp,
  Calendar,
  Users,
  BarChart3,
  RefreshCw,
  ChevronDown,
  Download
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const AdminEarnings = () => {
  const { modeColors } = useTheme()
  const [summary, setSummary] = useState(null)
  const [dailyEarnings, setDailyEarnings] = useState([])
  const [userEarnings, setUserEarnings] = useState([])
  const [symbolEarnings, setSymbolEarnings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState('30')

  useEffect(() => {
    fetchAllData()
  }, [dateRange])

  const fetchAllData = async () => {
    setLoading(true)
    await Promise.all([
      fetchSummary(),
      fetchDailyEarnings(),
      fetchUserEarnings(),
      fetchSymbolEarnings()
    ])
    setLoading(false)
  }

  const fetchSummary = async () => {
    try {
      const res = await fetch(`${API_URL}/earnings/summary`)
      const data = await res.json()
      if (data.success) {
        setSummary(data.earnings)
      }
    } catch (error) {
      console.error('Error fetching summary:', error)
    }
  }

  const fetchDailyEarnings = async () => {
    try {
      const res = await fetch(`${API_URL}/earnings/daily?days=${dateRange}`)
      const data = await res.json()
      if (data.success) {
        setDailyEarnings(data.earnings || [])
      }
    } catch (error) {
      console.error('Error fetching daily earnings:', error)
    }
  }

  const fetchUserEarnings = async () => {
    try {
      const res = await fetch(`${API_URL}/earnings/by-user?days=${dateRange}`)
      const data = await res.json()
      if (data.success) {
        setUserEarnings(data.earnings || [])
      }
    } catch (error) {
      console.error('Error fetching user earnings:', error)
    }
  }

  const fetchSymbolEarnings = async () => {
    try {
      const res = await fetch(`${API_URL}/earnings/by-symbol?days=${dateRange}`)
      const data = await res.json()
      if (data.success) {
        setSymbolEarnings(data.earnings || [])
      }
    } catch (error) {
      console.error('Error fetching symbol earnings:', error)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value || 0)
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
    <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-[2rem] p-6 border shadow-sm group hover:shadow-xl transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-${color}-500/10 rounded-2xl flex items-center justify-center border border-${color}-500/20 shadow-sm group-hover:scale-110 transition-transform`}>
          <Icon size={24} className={`text-${color}-600`} />
        </div>
        <div style={{ backgroundColor: modeColors.bgSecondary }} className="px-2 py-1 rounded-lg">
          <span style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest opacity-60">Live Metrics</span>
        </div>
      </div>
      <p style={{ color: modeColors.textSecondary }} className="text-xs font-black uppercase tracking-widest italic opacity-70 mb-1">{title}</p>
      <p style={{ color: modeColors.text }} className="text-3xl font-black tracking-tight">{formatCurrency(value)}</p>
      {subtitle && (
        <p className={`text-[10px] font-bold mt-2 flex items-center gap-1 text-${color}-500`}>
          <TrendingUp size={10} /> {subtitle}
        </p>
      )}
    </div>
  )

  return (
    <AdminLayout title="Capital Dynamics" subtitle="Orchestrate commission, spread, and yield analytics">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-8 bg-green-500 rounded-full" />
          <div>
            <h2 style={{ color: modeColors.text }} className="font-black text-2xl tracking-tight">Earnings Portfolio</h2>
            <p style={{ color: modeColors.textSecondary }} className="text-sm font-medium opacity-60">Real-time revenue settlement protocols</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Calendar size={18} style={{ color: modeColors.textSecondary }} className="absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
              className="appearance-none border-2 rounded-2xl pl-12 pr-10 py-3 font-bold text-sm focus:outline-none focus:border-blue-500 transition-all shadow-inner"
            >
              <option value="7">Horizon: 7 Days</option>
              <option value="30">Horizon: 30 Days</option>
              <option value="90">Horizon: Quarter</option>
              <option value="365">Horizon: Annual</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
          </div>
          
          <button 
            onClick={fetchAllData}
            style={{ backgroundColor: modeColors.bgSecondary, color: modeColors.text }}
            className="flex items-center justify-center p-3 border-2 border-slate-100 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
            title="Deep Sync"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 grayscale opacity-50">
          <RefreshCw size={48} className="animate-spin text-slate-300 mb-4" />
          <p style={{ color: modeColors.textSecondary }} className="font-black text-[10px] uppercase tracking-widest">Querying Settlement Oracle...</p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Summary Cards Portfolio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <StatCard 
              title="Daily Yield" 
              value={summary?.today?.total} 
              subtitle={`${summary?.today?.trades || 0} settlements`}
              icon={DollarSign}
              color="green"
            />
            <StatCard 
              title="Weekly Reach" 
              value={summary?.thisWeek?.total} 
              subtitle={`${summary?.thisWeek?.trades || 0} settlements`}
              icon={Calendar}
              color="blue"
            />
            <StatCard 
              title="Monthly Horizon" 
              value={summary?.thisMonth?.total} 
              subtitle={`${summary?.thisMonth?.trades || 0} settlements`}
              icon={TrendingUp}
              color="purple"
            />
            <StatCard 
              title="Annual Volume" 
              value={summary?.thisYear?.total} 
              subtitle={`${summary?.thisYear?.trades || 0} settlements`}
              icon={BarChart3}
              color="orange"
            />
            <StatCard 
              title="Macro Total" 
              value={summary?.allTime?.total} 
              subtitle={`${summary?.allTime?.trades || 0} settlements`}
              icon={DollarSign}
              color="green"
            />
          </div>

          {/* Breakdown Cards Portfolio */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {[
              { 
                title: 'Fee Infrastructure', 
                icon: DollarSign, 
                color: 'green',
                data: [
                  { label: 'Settled Today', value: summary?.today?.commission },
                  { label: 'Weekly Velocity', value: summary?.thisWeek?.commission },
                  { label: 'Monthly Horizon', value: summary?.thisMonth?.commission },
                  { label: 'Macro Cumulative', value: summary?.allTime?.commission, highlight: true }
                ]
              },
              { 
                title: 'Swap Architecture', 
                icon: RefreshCw, 
                color: 'blue',
                data: [
                  { label: 'Overnight Today', value: summary?.today?.swap },
                  { label: 'Weekly Rollover', value: summary?.thisWeek?.swap },
                  { label: 'Monthly Carry', value: summary?.thisMonth?.swap },
                  { label: 'Macro Carry', value: summary?.allTime?.swap, highlight: true }
                ]
              },
              { 
                title: 'Volume Intelligence', 
                icon: BarChart3, 
                color: 'purple',
                isVolume: true,
                data: [
                  { label: 'Lots Today', value: summary?.today?.volume },
                  { label: 'Weekly Flow', value: summary?.thisWeek?.volume },
                  { label: 'Monthly Fluidity', value: summary?.thisMonth?.volume },
                  { label: 'Macro Liquidity', value: summary?.allTime?.volume, highlight: true }
                ]
              }
            ].map((card, idx) => (
              <div key={idx} style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-[2.5rem] border p-8 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 bg-${card.color}-500/10 rounded-2xl flex items-center justify-center border border-${card.color}-500/20 group-hover:rotate-12 transition-transform`}>
                    <card.icon size={24} className={`text-${card.color}-600`} />
                  </div>
                  <h3 style={{ color: modeColors.text }} className="font-black text-xl tracking-tight">{card.title}</h3>
                </div>
                
                <div className="space-y-4">
                  {card.data.map((item, i) => (
                    <div key={i} className={`flex justify-between items-center ${item.highlight ? 'pt-4 border-t' : ''}`} style={{ borderTopColor: item.highlight ? modeColors.border : 'transparent' }}>
                      <span style={{ color: modeColors.textSecondary }} className={`text-xs font-black uppercase tracking-widest opacity-60 ${item.highlight ? 'opacity-100 italic' : ''}`}>{item.label}</span>
                      <span 
                        style={{ color: item.highlight ? (card.color === 'green' ? '#10B981' : card.color === 'blue' ? '#3B82F6' : '#8B5CF6') : modeColors.text }} 
                        className={`font-mono font-black ${item.highlight ? 'text-lg' : 'text-sm'}`}
                      >
                        {card.isVolume ? (item.value || 0).toFixed(2) : formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Ecosystem */}
          <div className="flex gap-4 mb-8 overflow-x-auto pb-4 custom-scrollbar">
            {[
              { id: 'daily', label: 'Temporal Breakdown', icon: Calendar },
              { id: 'users', label: 'Agent Attribution', icon: Users },
              { id: 'symbols', label: 'Asset Intelligence', icon: BarChart3 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{ 
                  backgroundColor: activeTab === tab.id ? '#3B82F6' : modeColors.card,
                  color: activeTab === tab.id ? '#FFFFFF' : modeColors.text,
                  borderColor: activeTab === tab.id ? '#3B82F6' : modeColors.border,
                }}
                className={`px-6 py-4 rounded-2xl whitespace-nowrap flex items-center gap-3 border shadow-sm transition-all active:scale-[0.98] font-black text-[10px] uppercase tracking-widest ${
                  activeTab === tab.id ? 'shadow-lg shadow-blue-500/20' : 'hover:border-blue-200'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Data Visualization Tables */}
          <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-[2.5rem] border overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'daily' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: modeColors.bgSecondary }} className="border-b border-slate-100">
                      <th style={{ color: modeColors.textSecondary }} className="text-left py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Settlement Date</th>
                      <th style={{ color: modeColors.textSecondary }} className="text-right py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Commission</th>
                      <th style={{ color: modeColors.textSecondary }} className="text-right py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Swap Yield</th>
                      <th style={{ color: modeColors.textSecondary }} className="text-right py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">System Total</th>
                      <th style={{ color: modeColors.textSecondary }} className="text-right py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Trades</th>
                      <th style={{ color: modeColors.textSecondary }} className="text-right py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Liquid Vol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {dailyEarnings.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-24 grayscale opacity-30">
                          <BarChart3 size={48} className="mx-auto mb-4" />
                          <p className="font-black text-[10px] uppercase tracking-widest">No Temporal Data Found</p>
                        </td>
                      </tr>
                    ) : (
                      dailyEarnings.map((day, idx) => (
                        <tr key={idx} className="group hover:bg-slate-50/50 transition-all">
                          <td style={{ color: modeColors.text }} className="py-6 px-8 font-black text-sm">{day.date}</td>
                          <td style={{ color: modeColors.textSecondary }} className="py-6 px-8 text-right font-mono text-xs">{formatCurrency(day.commission)}</td>
                          <td style={{ color: modeColors.textSecondary }} className="py-6 px-8 text-right font-mono text-xs">{formatCurrency(day.swap)}</td>
                          <td className="py-6 px-8 text-right text-green-600 font-mono text-lg font-black tracking-tight">{formatCurrency(day.total)}</td>
                          <td style={{ color: modeColors.textSecondary }} className="py-6 px-8 text-right text-xs font-bold opacity-60">{day.trades}</td>
                          <td style={{ color: modeColors.textSecondary }} className="py-6 px-8 text-right text-xs font-mono">{day.volume?.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: modeColors.bgSecondary }} className="border-b border-slate-100">
                      <th style={{ color: modeColors.textSecondary }} className="text-left py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Agent Identity</th>
                      <th style={{ color: modeColors.textSecondary }} className="text-right py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Commission</th>
                      <th style={{ color: modeColors.textSecondary }} className="text-right py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Swap Yield</th>
                      <th style={{ color: modeColors.textSecondary }} className="text-right py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">System Total</th>
                      <th style={{ color: modeColors.textSecondary }} className="text-right py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Trades</th>
                      <th style={{ color: modeColors.textSecondary }} className="text-right py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Liquid Vol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {userEarnings.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-24 grayscale opacity-30">
                          <Users size={48} className="mx-auto mb-4" />
                          <p className="font-black text-[10px] uppercase tracking-widest">No Agent Analytics Found</p>
                        </td>
                      </tr>
                    ) : (
                      userEarnings.map((user, idx) => (
                        <tr key={idx} className="group hover:bg-slate-50/50 transition-all">
                          <td className="py-6 px-8">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                                <span className="text-blue-600 font-black text-sm">{user.userName?.charAt(0) || '?'}</span>
                              </div>
                              <div>
                                <p style={{ color: modeColors.text }} className="font-black text-sm tracking-tight">{user.userName || 'Unknown'}</p>
                                <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-bold opacity-60">{user.userEmail}</p>
                              </div>
                            </div>
                          </td>
                          <td style={{ color: modeColors.textSecondary }} className="py-6 px-8 text-right font-mono text-xs">{formatCurrency(user.commission)}</td>
                          <td style={{ color: modeColors.textSecondary }} className="py-6 px-8 text-right font-mono text-xs">{formatCurrency(user.swap)}</td>
                          <td className="py-6 px-8 text-right text-green-600 font-mono text-lg font-black tracking-tight">{formatCurrency(user.total)}</td>
                          <td style={{ color: modeColors.textSecondary }} className="py-6 px-8 text-right text-xs font-bold opacity-60">{user.trades}</td>
                          <td style={{ color: modeColors.textSecondary }} className="py-6 px-8 text-right text-xs font-mono">{user.volume?.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'symbols' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: modeColors.bgSecondary }} className="border-b border-slate-100">
                      <th style={{ color: modeColors.textSecondary }} className="text-left py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Asset Class</th>
                      <th style={{ color: modeColors.textSecondary }} className="text-right py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Commission</th>
                      <th style={{ color: modeColors.textSecondary }} className="text-right py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Swap Yield</th>
                      <th style={{ color: modeColors.textSecondary }} className="text-right py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">System Total</th>
                      <th style={{ color: modeColors.textSecondary }} className="text-right py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Trades</th>
                      <th style={{ color: modeColors.textSecondary }} className="text-right py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Liquid Vol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {symbolEarnings.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-24 grayscale opacity-30">
                          <BarChart3 size={48} className="mx-auto mb-4" />
                          <p className="font-black text-[10px] uppercase tracking-widest">No Asset Intelligence Found</p>
                        </td>
                      </tr>
                    ) : (
                      symbolEarnings.map((sym, idx) => (
                        <tr key={idx} className="group hover:bg-slate-50/50 transition-all">
                          <td className="py-6 px-8">
                            <span style={{ color: modeColors.text, backgroundColor: modeColors.bgSecondary }} className="px-3 py-1.5 rounded-xl font-black text-xs border border-slate-100 shadow-inner group-hover:bg-white transition-all">{sym.symbol}</span>
                          </td>
                          <td style={{ color: modeColors.textSecondary }} className="py-6 px-8 text-right font-mono text-xs">{formatCurrency(sym.commission)}</td>
                          <td style={{ color: modeColors.textSecondary }} className="py-6 px-8 text-right font-mono text-xs">{formatCurrency(sym.swap)}</td>
                          <td className="py-6 px-8 text-right text-green-600 font-mono text-lg font-black tracking-tight">{formatCurrency(sym.total)}</td>
                          <td style={{ color: modeColors.textSecondary }} className="py-6 px-8 text-right text-xs font-bold opacity-60">{sym.trades}</td>
                          <td style={{ color: modeColors.textSecondary }} className="py-6 px-8 text-right text-xs font-mono">{sym.volume?.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminEarnings
