 import { useEffect, useMemo, useState } from 'react'
import { Mail, RefreshCw, Search, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Clock3, Eye, RotateCcw, X } from 'lucide-react'
import AdminLayout from '../components/AdminLayout'
import { API_URL } from '../config/api'
import { useTheme } from '../context/ThemeContext'

const STATUS_STYLES = {
  sent: 'bg-green-500/10 text-green-600 border border-green-500/20',
  failed: 'bg-red-500/10 text-red-600 border border-red-500/20',
  pending: 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20',
  delivered: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
  opened: 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
}

const AdminEmailLogs = () => {
  const { modeColors } = useTheme()
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState({ total: 0, sent: 0, failed: 0, pending: 0, delivered: 0 })
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [resendId, setResendId] = useState('')
  const [batchRetrying, setBatchRetrying] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [filters, setFilters] = useState({ email: '', status: '', category: '', startDate: '', endDate: '' })
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 })

  const rawToken = localStorage.getItem('adminToken')
  const adminToken = (rawToken === 'undefined' || rawToken === 'null') ? null : rawToken

  const queryString = useMemo(() => {
    //Sanket v2.0 - keep admin filters in the URL query so pagination, date range, and log searches stay in sync
    const params = new URLSearchParams({
      page: String(pagination.page),
      limit: String(pagination.limit)
    })

    if (filters.email.trim()) params.set('email', filters.email.trim())
    if (filters.status) params.set('status', filters.status)
    if (filters.category) params.set('category', filters.category)
    if (filters.startDate) params.set('startDate', filters.startDate)
    if (filters.endDate) params.set('endDate', filters.endDate)
    return params.toString()
  }, [filters, pagination.page, pagination.limit])

  const statsQueryString = useMemo(() => {
    const params = new URLSearchParams()
    if (filters.startDate) params.set('startDate', filters.startDate)
    if (filters.endDate) params.set('endDate', filters.endDate)
    return params.toString()
  }, [filters.startDate, filters.endDate])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/email/logs?${queryString}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      })
      const data = await res.json()
      if (data.success) {
        setLogs(data.logs || [])
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 1 })
      } else {
        setMessage({ type: 'error', text: data.message || 'Unable to fetch email logs' })
      }
    } catch (error) {
      console.error('Error fetching email logs:', error)
      setMessage({ type: 'error', text: 'Unable to fetch email logs' })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const suffix = statsQueryString ? `?${statsQueryString}` : ''
      const res = await fetch(`${API_URL}/email/stats${suffix}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      })
      const data = await res.json()
      if (data.success) setStats(data.stats || {})
    } catch (error) {
      console.error('Error fetching email stats:', error)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [queryString])

  useEffect(() => {
    fetchStats()
  }, [statsQueryString])

  const changePage = (nextPage) => {
    if (nextPage < 1 || nextPage > (pagination.pages || 1)) return
    setPagination(prev => ({ ...prev, page: nextPage }))
  }

  const updateFilter = (key, value) => {
    setPagination(prev => ({ ...prev, page: 1 }))
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    setFilters({ email: '', status: '', category: '', startDate: '', endDate: '' })
  }

  const exportCurrentView = () => {
    const headers = ['Recipient', 'Subject', 'Category', 'Provider', 'Status', 'Template', 'Created At']
    const rows = logs.map((log) => [
      log.recipient?.email || '',
      log.subject || '',
      log.category || '',
      log.provider || '',
      log.status || '',
      log.templateSlug || '',
      log.createdAt ? new Date(log.createdAt).toLocaleString() : ''
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `email-logs-page-${pagination.page || 1}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleViewLog = async (logId) => {
    setDetailLoading(true)
    setShowDetails(true)
    try {
      const res = await fetch(`${API_URL}/email/logs/${logId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      })
      const data = await res.json()
      if (data.success) {
        setSelectedLog(data.log)
      } else {
        setMessage({ type: 'error', text: data.message || 'Unable to load email details' })
        setShowDetails(false)
      }
    } catch (error) {
      console.error('Error fetching email log details:', error)
      setMessage({ type: 'error', text: 'Unable to load email details' })
      setShowDetails(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleResend = async (logId) => {
    //Sanket v2.0 - allow ops/admin teams to retry failed emails directly from the transaction log without leaving the page
    setResendId(logId)
    try {
      const res = await fetch(`${API_URL}/email/logs/${logId}/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        }
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Email resent successfully' })
        fetchLogs()
        fetchStats()
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to resend email' })
      }
    } catch (error) {
      console.error('Error resending email:', error)
      setMessage({ type: 'error', text: 'Failed to resend email' })
    } finally {
      setResendId('')
    }
  }

  //Sanket v2.0 - batch retry for all failed emails in one click from admin logs page
  const handleBatchRetry = async () => {
    setBatchRetrying(true)
    try {
      const res = await fetch(`${API_URL}/email/retry-failed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ limit: 20, includePending: false })
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: `Retry processed ${data.processed || 0} emails — ${data.resent || 0} resent, ${data.failed || 0} still failing` })
        fetchLogs()
        fetchStats()
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to run batch retry' })
      }
    } catch (error) {
      console.error('Error running batch retry:', error)
      setMessage({ type: 'error', text: 'Failed to run batch retry' })
    } finally {
      setBatchRetrying(false)
    }
  }

  return (
    <AdminLayout title="Email Logs" subtitle="Track all outgoing email transactions with pagination, details, and resend controls">
      <div className="space-y-6">
        {message.text && (
          <div className={`rounded-xl border px-4 py-3 flex items-center justify-between ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-700' : 'bg-red-500/10 border-red-500/20 text-red-700'}`}>
            <span className="text-sm font-semibold">{message.text}</span>
            <button onClick={() => setMessage({ type: '', text: '' })}>
              <X size={16} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Total Emails', value: stats.total || 0, icon: Mail, tone: 'text-slate-700' },
            { label: 'Sent', value: stats.sent || 0, icon: CheckCircle2, tone: 'text-green-600' },
            { label: 'Pending', value: stats.pending || 0, icon: Clock3, tone: 'text-yellow-600' },
            { label: 'Failed', value: stats.failed || 0, icon: AlertTriangle, tone: 'text-red-600' }
          ].map(card => (
            <div key={card.label} style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-xl border p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ color: modeColors.textSecondary }} className="text-sm font-medium">{card.label}</p>
                  <p style={{ color: modeColors.text }} className="text-2xl font-bold mt-2">{card.value}</p>
                </div>
                <card.icon className={card.tone} size={24} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-xl border p-4 sm:p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            <div className="relative xl:col-span-2">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filters.email}
                onChange={(e) => updateFilter('email', e.target.value)}
                placeholder="Search recipient email"
                style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                className="w-full border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
              className="border rounded-xl px-4 py-3 text-sm"
            >
              <option value="">All statuses</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="delivered">Delivered</option>
              <option value="opened">Opened</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
              style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
              className="border rounded-xl px-4 py-3 text-sm"
            >
              <option value="">All categories</option>
              <option value="otp">OTP</option>
              <option value="transactional">Transactional</option>
              <option value="notification">Notification</option>
              <option value="manual">Manual</option>
            </select>

            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => updateFilter('startDate', e.target.value)}
              style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
              className="border rounded-xl px-4 py-3 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => updateFilter('endDate', e.target.value)}
              style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
              className="border rounded-xl px-4 py-3 text-sm xl:col-span-1"
            />
            <div className="md:col-span-1 xl:col-span-4 flex flex-wrap items-center gap-2 justify-start xl:justify-end">
              <button onClick={clearFilters} className="inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-3 rounded-xl font-semibold hover:bg-slate-200 transition-colors">
                Clear Filters
              </button>
              <button
                onClick={handleBatchRetry}
                disabled={batchRetrying || (stats.failed || 0) === 0}
                className="inline-flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                <RotateCcw size={16} className={batchRetrying ? 'animate-spin' : ''} />
                Retry All Failed
              </button>
              <button onClick={exportCurrentView} className="inline-flex items-center justify-center gap-2 bg-slate-700 text-white px-4 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors">
                Export CSV
              </button>
              <button onClick={fetchLogs} className="inline-flex items-center justify-center gap-2 bg-orange-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead style={{ backgroundColor: modeColors.bgSecondary }}>
                <tr>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-500">Recipient</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-500">Subject</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-500">Category</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-500">Provider</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-500">Template</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-500">Date</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                      {loading ? 'Loading email logs...' : 'No email transactions found for the current filters.'}
                    </td>
                  </tr>
                ) : logs.map(log => (
                  <tr key={log._id} className="border-t border-slate-100 hover:bg-slate-50/70">
                    <td className="px-4 py-4">
                      <div>
                        <p style={{ color: modeColors.text }} className="font-semibold text-sm">{log.recipient?.email || 'N/A'}</p>
                        <p className="text-xs text-slate-400">{log.recipient?.name || 'Unknown user'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm" style={{ color: modeColors.text }}>{log.subject || '-'}</td>
                    <td className="px-4 py-4 text-sm capitalize" style={{ color: modeColors.textSecondary }}>{log.category || '-'}</td>
                    <td className="px-4 py-4 text-sm uppercase" style={{ color: modeColors.textSecondary }}>{log.provider || '-'}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[log.status] || 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-mono" style={{ color: modeColors.textSecondary }}>{log.templateSlug || '-'}</td>
                    <td className="px-4 py-4 text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleViewLog(log._id)} className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100" title="View details">
                          <Eye size={16} />
                        </button>
                        {log.status === 'failed' && (
                          <button
                            onClick={() => handleResend(log._id)}
                            disabled={resendId === log._id}
                            className="p-2 rounded-lg border border-slate-200 text-orange-600 hover:bg-orange-50 disabled:opacity-50"
                            title="Resend email"
                          >
                            <RotateCcw size={16} className={resendId === log._id ? 'animate-spin' : ''} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-sm text-slate-500">
              Showing page <strong>{pagination.page || 1}</strong> of <strong>{pagination.pages || 1}</strong> • {pagination.total || 0} total emails
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => changePage((pagination.page || 1) - 1)}
                disabled={(pagination.page || 1) <= 1}
                className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 inline-flex items-center gap-2"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button
                onClick={() => changePage((pagination.page || 1) + 1)}
                disabled={(pagination.page || 1) >= (pagination.pages || 1)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 inline-flex items-center gap-2"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {showDetails && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border shadow-2xl flex flex-col">
              <div style={{ borderBottomColor: modeColors.border }} className="p-5 border-b flex items-center justify-between">
                <div>
                  <h3 style={{ color: modeColors.text }} className="font-bold text-lg">Email Log Details</h3>
                  <p style={{ color: modeColors.textSecondary }} className="text-sm">Inspect the full transaction payload and resend failures when needed.</p>
                </div>
                <button onClick={() => { setShowDetails(false); setSelectedLog(null) }} className="p-2 rounded-lg hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4">
                {detailLoading || !selectedLog ? (
                  <p className="text-slate-500">Loading email details...</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        ['Recipient', selectedLog.recipient?.email || 'N/A'],
                        ['Recipient Name', selectedLog.recipient?.name || 'Unknown'],
                        ['Status', selectedLog.status],
                        ['Provider', selectedLog.provider],
                        ['Category', selectedLog.category],
                        ['Template', selectedLog.templateSlug || selectedLog.template?.slug || '-'],
                        ['Created At', new Date(selectedLog.createdAt).toLocaleString()],
                        ['Message ID', selectedLog.providerMessageId || '-']
                      ].map(([label, value]) => (
                        <div key={label} style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border }} className="rounded-xl border p-3">
                          <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
                          <p style={{ color: modeColors.text }} className="font-semibold mt-1 break-all">{value || '-'}</p>
                        </div>
                      ))}
                    </div>

                    <div style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border }} className="rounded-xl border p-4">
                      <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Subject</p>
                      <p style={{ color: modeColors.text }} className="font-semibold">{selectedLog.subject || '-'}</p>
                    </div>

                    {selectedLog.error?.message && (
                      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                        <p className="text-xs uppercase tracking-wider text-red-600 mb-2">Failure Reason</p>
                        <p className="text-sm text-red-700 whitespace-pre-wrap">{selectedLog.error.message}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border }} className="rounded-xl border p-4">
                        <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Metadata</p>
                        <pre className="text-xs text-slate-700 whitespace-pre-wrap break-words">{JSON.stringify(selectedLog.metadata || {}, null, 2)}</pre>
                      </div>

                      <div style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border }} className="rounded-xl border p-4">
                        <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">HTML Preview</p>
                        <div className="bg-white rounded-lg p-3 max-h-72 overflow-y-auto border border-slate-100" dangerouslySetInnerHTML={{ __html: selectedLog.htmlContent || '<p>No HTML content stored.</p>' }} />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      {selectedLog.status === 'failed' && (
                        <button
                          onClick={() => handleResend(selectedLog._id)}
                          disabled={resendId === selectedLog._id}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                        >
                          <RotateCcw size={16} className={resendId === selectedLog._id ? 'animate-spin' : ''} />
                          Resend Failed Email
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminEmailLogs
