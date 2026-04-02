import { API_URL } from '../config/api'
import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { 
  HeadphonesIcon,
  Search,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  Send,
  X
} from 'lucide-react'

const AdminSupport = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [tickets, setTickets] = useState([])
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 })
  const [loading, setLoading] = useState(true)
  const [replyMessage, setReplyMessage] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}')

  useEffect(() => {
    fetchTickets()
    fetchStats()
  }, [filterStatus])

  const fetchTickets = async () => {
    try {
      const statusParam = filterStatus !== 'all' ? `?status=${filterStatus.toUpperCase()}` : ''
      const res = await fetch(`${API_URL}/support/admin/all${statusParam}`)
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch (error) {
      console.error('Error fetching tickets:', error)
    }
    setLoading(false)
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/support/admin/stats`)
      const data = await res.json()
      if (data.stats) setStats(data.stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const openTicketChat = async (ticketId) => {
    try {
      const res = await fetch(`${API_URL}/support/ticket/${ticketId}`)
      const data = await res.json()
      if (data.success) {
        setSelectedTicket(data.ticket)
      }
    } catch (error) {
      console.error('Error fetching ticket:', error)
    }
  }

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return

    setSendingReply(true)
    try {
      const res = await fetch(`${API_URL}/support/reply/${selectedTicket.ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: selectedTicket.userId?._id || selectedTicket.userId,
          senderType: 'ADMIN',
          senderName: adminUser?.username || adminUser?.email || 'Support Team',
          message: replyMessage
        })
      })
      const data = await res.json()
      if (data.success) {
        setSelectedTicket(data.ticket)
        setReplyMessage('')
        fetchTickets()
      } else {
        alert(data.message || 'Failed to send reply')
      }
    } catch (error) {
      console.error('Error sending reply:', error)
      alert('Failed to send reply')
    }
    setSendingReply(false)
  }

  const updateTicketStatus = async (ticketId, status) => {
    try {
      const res = await fetch(`${API_URL}/support/admin/status/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      const data = await res.json()
      if (data.success) {
        fetchTickets()
        fetchStats()
        if (selectedTicket?.ticketId === ticketId) {
          setSelectedTicket(data.ticket)
        }
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'bg-red-500/20 text-red-500'
      case 'IN_PROGRESS': return 'bg-yellow-500/20 text-yellow-500'
      case 'WAITING_USER': return 'bg-orange-500/20 text-orange-500'
      case 'RESOLVED': return 'bg-green-500/20 text-green-500'
      case 'CLOSED': return 'bg-gray-500/20 text-gray-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500/20 text-red-500'
      case 'HIGH': return 'bg-orange-500/20 text-orange-500'
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-500'
      case 'LOW': return 'bg-blue-500/20 text-blue-500'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'OPEN': return <AlertCircle size={14} />
      case 'IN_PROGRESS': return <Clock size={14} />
      case 'WAITING_USER': return <Clock size={14} />
      case 'RESOLVED': return <CheckCircle size={14} />
      case 'CLOSED': return <CheckCircle size={14} />
      default: return null
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    const userName = ticket.userId?.firstName || ''
    const userEmail = ticket.userId?.email || ''
    const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  return (
    <AdminLayout title="Support Command" subtitle="Manage and resolve global user inquiries">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Tickets', value: stats.total, icon: HeadphonesIcon, color: 'blue' },
          { label: 'Open Priority', value: stats.open, icon: AlertCircle, color: 'red' },
          { label: 'Active Support', value: stats.inProgress, icon: Clock, color: 'yellow' },
          { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: 'green' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-${stat.color}-50 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} className={`text-${stat.color}-600`} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-lg italic">Snapshot</span>
            </div>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest italic">{stat.label}</p>
            <p className="text-slate-900 text-3xl font-black mt-1 tracking-tight">{stat.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Ticket Registry Interface */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm shadow-slate-100 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 sm:p-8 border-b border-slate-50">
          <div>
            <h2 className="text-slate-900 font-black text-2xl tracking-tight">Active Inquiries</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Global synchronization of user support state</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search Database..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner font-bold text-sm"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-3 text-slate-900 font-black text-xs uppercase tracking-widest focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer shadow-inner"
            >
              <option value="all">Global Cache</option>
              <option value="OPEN">Open Only</option>
              <option value="IN_PROGRESS">Processing</option>
              <option value="WAITING_USER">User Pending</option>
              <option value="RESOLVED">Resolved Only</option>
              <option value="CLOSED">Archived</option>
            </select>
          </div>
        </div>

        {/* Global Ticket Flow */}
        <div className="p-6 sm:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 grayscale opacity-50">
              <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
              <p className="text-slate-500 font-black text-xs uppercase tracking-widest">Querying Support Nodes...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-32 bg-slate-50/50 rounded-[2rem] border-4 border-dashed border-slate-100">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200">
                <MessageSquare size={40} className="text-slate-200" />
              </div>
              <p className="text-slate-900 font-black text-xl mb-2">Registry Silent</p>
              <p className="text-slate-500 font-medium">No matching support inquiries detected</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <div 
                  key={ticket._id} 
                  onClick={() => openTicketChat(ticket.ticketId)}
                  className="group bg-white rounded-[2rem] p-6 border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-100 transition-all cursor-pointer flex flex-col lg:flex-row lg:items-center gap-6"
                >
                  {/* Ticket Header Metadata */}
                  <div className="flex items-center gap-5 lg:w-1/4">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform flex-shrink-0">
                      <span className="text-slate-900 font-black text-xs tracking-tighter">#{ticket.ticketId.slice(-4)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-900 font-black text-lg truncate tracking-tight">{ticket.userId?.firstName || 'Anonymous'} {ticket.userId?.lastName || ''}</p>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest truncate">{ticket.userId?.email || 'unreachable-node'}</p>
                    </div>
                  </div>

                  {/* Context & State */}
                  <div className="flex flex-wrap items-center gap-4 lg:w-1/2">
                    <div className="flex-1 min-w-[200px]">
                       <p className="text-slate-900 font-black text-md truncate group-hover:text-blue-600 transition-colors uppercase tracking-tight italic">"{ticket.subject}"</p>
                       <div className="flex items-center gap-3 mt-1.5 font-bold text-[10px] uppercase tracking-widest text-slate-400">
                          <span className={`px-2 py-0.5 rounded-lg border italic ${getPriorityColor(ticket.priority).split(' ')[0]} ${getPriorityColor(ticket.priority).split(' ')[1]}`}>
                            {ticket.priority} Level
                          </span>
                          <span>•</span>
                          <span>{ticket.messages?.length || 0} Interactions</span>
                       </div>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 ${getStatusColor(ticket.status)}`}>
                      {getStatusIcon(ticket.status)}
                      {ticket.status.replace('_', ' ')}
                    </div>
                  </div>

                  {/* Actions & Temporal */}
                  <div className="flex items-center gap-4 lg:w-1/4 lg:justify-end">
                    <div className="text-right hidden sm:block">
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Received</p>
                      <p className="text-slate-900 font-bold text-xs">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="h-10 w-px bg-slate-100 mx-1"></div>
                    <button 
                      className="p-3 bg-white border-2 border-slate-50 hover:border-blue-200 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm group-hover:shadow-md" 
                    >
                      <Eye size={22} />
                    </button>
                    {ticket.status !== 'RESOLVED' && (
                       <button 
                         onClick={(e) => { e.stopPropagation(); updateTicketStatus(ticket.ticketId, 'RESOLVED'); }}
                         className="p-3 bg-white border-2 border-slate-50 hover:border-green-300 rounded-2xl text-slate-400 hover:text-green-600 transition-all shadow-sm group-hover:shadow-md hover:bg-green-50" 
                       >
                         <CheckCircle size={22} />
                       </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modern Communication Portal (Modal) */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
            {/* Thread Header */}
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                  <HeadphonesIcon size={28} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-slate-900 font-black text-2xl tracking-tight uppercase">Support Thread</h3>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
                    Ref: <span className="text-blue-600">#{selectedTicket.ticketId}</span> • User Node: {selectedTicket.userId?.firstName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <select
                  value={selectedTicket.status}
                  onChange={(e) => updateTicketStatus(selectedTicket.ticketId, e.target.value)}
                  className={`px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 focus:outline-none focus:ring-0 ${getStatusColor(selectedTicket.status)}`}
                >
                  <option value="OPEN">Open Priority</option>
                  <option value="IN_PROGRESS">Active Work</option>
                  <option value="WAITING_USER">User Lock</option>
                  <option value="RESOLVED">Verified Fix</option>
                  <option value="CLOSED">Archive</option>
                </select>
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="p-3 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl border border-slate-200 shadow-sm transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Communication Stream */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white custom-scrollbar">
               {/* Initial Context Card */}
               <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-[2rem] mb-10">
                  <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2 italic">Initial Request Vector</p>
                  <h4 className="text-slate-900 font-black text-xl mb-1">{selectedTicket.subject}</h4>
                  <p className="text-slate-500 text-sm italic">Status: {selectedTicket.status} • Priority: {selectedTicket.priority}</p>
               </div>

              {selectedTicket.messages?.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col ${msg.sender === 'ADMIN' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[85%] rounded-[2rem] p-6 shadow-sm border ${
                    msg.sender === 'ADMIN' 
                      ? 'bg-slate-900 text-white border-slate-800 rounded-tr-none' 
                      : 'bg-slate-50 text-slate-900 border-slate-100 rounded-tl-none'
                  }`}>
                    <div className="flex items-center gap-3 mb-2 opacity-60">
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {msg.sender === 'ADMIN' ? 'Command/Support' : msg.senderName || 'Origin Node'}
                      </span>
                      <span className="text-[10px] font-bold">
                        {new Date(msg.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                    <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Modulation */}
            {selectedTicket.status !== 'CLOSED' && (
              <div className="p-8 border-t border-slate-50 bg-slate-50/30">
                <div className="flex gap-4 relative">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Dispatch support response..."
                    rows={1}
                    className="flex-1 bg-white border-2 border-slate-100 rounded-[2rem] px-8 py-5 text-slate-9 group placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all shadow-inner font-bold resize-none overflow-hidden"
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendReply())}
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyMessage.trim()}
                    className="bg-blue-600 text-white w-20 h-20 rounded-[2rem] flex items-center justify-center hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale flex-shrink-0"
                  >
                    {sendingReply ? (
                      <RefreshCw size={28} className="animate-spin" />
                    ) : (
                      <Send size={28} className="-rotate-45" />
                    )}
                  </button>
                </div>
                <div className="flex justify-between mt-4 px-4">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Markdown compatible stream</p>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Press Enter to Dispatch</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminSupport
