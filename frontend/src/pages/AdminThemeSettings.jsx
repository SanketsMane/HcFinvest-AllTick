import { API_URL } from '../config/api'
import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { 
  Palette, 
  Check, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Eye,
  Save,
  X
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const AdminThemeSettings = () => {
  const { modeColors } = useTheme()
  const [themes, setThemes] = useState([])
  const [presets, setPresets] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTheme, setActiveTheme] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [newThemeName, setNewThemeName] = useState('')
  const [editColors, setEditColors] = useState({})

  useEffect(() => {
    fetchThemes()
    fetchPresets()
  }, [])

  const fetchThemes = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/theme/all`)
      const data = await res.json()
      if (data.success) {
        setThemes(data.themes || [])
        const active = data.themes?.find(t => t.isActive)
        setActiveTheme(active)
      }
    } catch (error) {
      console.error('Error fetching themes:', error)
    }
    setLoading(false)
  }

  const fetchPresets = async () => {
    try {
      const res = await fetch(`${API_URL}/theme/presets`)
      const data = await res.json()
      if (data.success) {
        setPresets(data.presets || [])
      }
    } catch (error) {
      console.error('Error fetching presets:', error)
    }
  }

  const applyPreset = async (presetName) => {
    try {
      const res = await fetch(`${API_URL}/theme/apply-preset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetName })
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        fetchThemes()
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error applying preset' })
    }
  }

  const activateTheme = async (themeId) => {
    try {
      const res = await fetch(`${API_URL}/theme/${themeId}/activate`, {
        method: 'PUT'
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        fetchThemes()
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error activating theme' })
    }
  }

  const deleteTheme = async (themeId) => {
    if (!confirm('Are you sure you want to delete this theme?')) return
    try {
      const res = await fetch(`${API_URL}/theme/${themeId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        fetchThemes()
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error deleting theme' })
    }
  }

  const createTheme = async () => {
    if (!newThemeName.trim()) {
      setMessage({ type: 'error', text: 'Theme name is required' })
      return
    }
    try {
      const res = await fetch(`${API_URL}/theme/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newThemeName, isActive: false })
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        setShowCreateModal(false)
        setNewThemeName('')
        fetchThemes()
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error creating theme' })
    }
  }

  const openEditModal = (theme) => {
    setSelectedTheme(theme)
    setEditColors(theme.colors || {})
    setShowEditModal(true)
  }

  const updateTheme = async () => {
    try {
      const res = await fetch(`${API_URL}/theme/${selectedTheme._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colors: editColors })
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Theme updated successfully' })
        setShowEditModal(false)
        fetchThemes()
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating theme' })
    }
  }

  const colorGroups = [
    {
      title: 'Primary Colors',
      colors: ['primary', 'primaryHover', 'secondary', 'secondaryHover', 'accent', 'accentHover']
    },
    {
      title: 'Background Colors',
      colors: ['bgPrimary', 'bgSecondary', 'bgCard', 'bgHover']
    },
    {
      title: 'Text Colors',
      colors: ['textPrimary', 'textSecondary', 'textMuted']
    },
    {
      title: 'Border Colors',
      colors: ['border', 'borderLight']
    },
    {
      title: 'Status Colors',
      colors: ['success', 'error', 'warning', 'info']
    },
    {
      title: 'Trading Colors',
      colors: ['buyColor', 'sellColor', 'profitColor', 'lossColor']
    },
    {
      title: 'Sidebar Colors',
      colors: ['sidebarBg', 'sidebarText', 'sidebarActive']
    },
    {
      title: 'Button Colors',
      colors: ['buttonPrimary', 'buttonSecondary', 'buttonDanger']
    }
  ]

  const formatColorName = (name) => {
    return name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
  }

  return (
    <AdminLayout title="Theme Settings" subtitle="Customize user dashboard appearance">
      {/* Message */}
      {message.text && (
        <div style={{ backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderColor: message.type === 'success' ? '#22C55E' : '#EF4444' }} className={`mb-6 p-4 rounded-xl border flex items-center justify-between ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          <div className="flex items-center gap-2">
            <Check size={18} />
            <p className="font-medium">{message.text}</p>
          </div>
          <button onClick={() => setMessage({ type: '', text: '' })} className="p-1 hover:bg-black/5 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Preset Themes */}
      <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-xl border p-5 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <Palette size={24} className="text-purple-500" />
            </div>
            <div>
              <h2 style={{ color: modeColors.text }} className="font-bold text-lg">Quick Theme Presets</h2>
              <p style={{ color: modeColors.textSecondary }} className="text-sm">Click to apply a preset theme instantly</p>
            </div>
          </div>
          <button onClick={fetchThemes} style={{ color: modeColors.textSecondary }} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <RefreshCw size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset.name)}
              style={{ 
                backgroundColor: activeTheme?.name === preset.name ? 'rgba(34, 197, 94, 0.05)' : modeColors.bgSecondary,
                borderColor: activeTheme?.name === preset.name ? '#22C55E' : modeColors.border 
              }}
              className="p-3 rounded-xl border transition-all hover:scale-105 hover:shadow-md"
            >
              <div 
                className="w-full h-8 rounded-lg mb-2 flex overflow-hidden"
                style={{ backgroundColor: preset.colors.bgPrimary }}
              >
                <div className="w-1/3 h-full" style={{ backgroundColor: preset.colors.primary }} />
                <div className="w-1/3 h-full" style={{ backgroundColor: preset.colors.accent }} />
                <div className="w-1/3 h-full" style={{ backgroundColor: preset.colors.secondary }} />
              </div>
              <p style={{ color: modeColors.text }} className="text-xs font-semibold truncate">{preset.name}</p>
              {activeTheme?.name === preset.name && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Check size={12} className="text-green-500" />
                  <span className="text-green-500 text-[10px]">Active</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Themes */}
      <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-xl border overflow-hidden shadow-sm">
        <div style={{ borderBottomColor: modeColors.border }} className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 style={{ color: modeColors.text }} className="font-bold text-lg">Custom Themes</h2>
            <p style={{ color: modeColors.textSecondary }} className="text-sm">{themes.length} themes configured</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
          >
            <Plus size={18} />
            Create Theme
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw size={40} className="text-gray-400 mx-auto mb-4 animate-spin" />
            <p style={{ color: modeColors.textSecondary }}>Loading themes...</p>
          </div>
        ) : themes.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Palette size={48} className="mx-auto mb-4 text-gray-300" />
            <p style={{ color: modeColors.textSecondary }} className="font-medium">No custom themes yet.</p>
            <p className="text-sm mt-1 text-gray-400">Apply a preset or create a new theme from scratch.</p>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {themes.map((theme) => (
              <div 
                key={theme._id} 
                style={{ 
                  backgroundColor: theme.isActive ? 'rgba(34, 197, 94, 0.05)' : modeColors.bgSecondary, 
                  borderColor: theme.isActive ? '#22C55E' : modeColors.border 
                }}
                className="p-4 rounded-xl border transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 style={{ color: modeColors.text }} className="font-bold">{theme.name}</h3>
                    {theme.isActive && (
                      <span className="px-2.5 py-0.5 bg-green-500/10 text-green-600 text-xs font-bold rounded-full border border-green-500/20">Active</span>
                    )}
                  </div>
                </div>

                {/* Color Preview */}
                <div 
                  className="w-full h-14 rounded-lg mb-4 flex overflow-hidden border shadow-inner"
                  style={{ backgroundColor: theme.colors?.bgPrimary || '#ffffff', borderColor: modeColors.border }}
                >
                  <div className="w-1/4 h-full" style={{ backgroundColor: theme.colors?.primary || '#3B82F6' }} />
                  <div className="w-1/4 h-full" style={{ backgroundColor: theme.colors?.accent || '#F59E0B' }} />
                  <div className="w-1/4 h-full" style={{ backgroundColor: theme.colors?.secondary || '#10B981' }} />
                  <div className="w-1/4 h-full" style={{ backgroundColor: theme.colors?.error || '#EF4444' }} />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {!theme.isActive && (
                    <button
                      onClick={() => activateTheme(theme._id)}
                      className="flex-1 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <Check size={14} />
                      Activate
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(theme)}
                    style={{ backgroundColor: modeColors.card, color: modeColors.text, borderColor: modeColors.border }}
                    className="flex-1 py-2.5 border rounded-lg hover:bg-slate-50 text-sm font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <Eye size={14} />
                    Edit
                  </button>
                  {!theme.isActive && (
                    <button
                      onClick={() => deleteTheme(theme._id)}
                      className="py-2.5 px-3 bg-red-50 text-red-500 border border-red-100 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Theme Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-2xl border w-full max-w-md p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 style={{ color: modeColors.text }} className="font-bold text-xl">Create New Theme</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ color: modeColors.textSecondary }} className="hover:text-blue-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="mb-6">
              <label style={{ color: modeColors.textSecondary }} className="block text-sm mb-2 font-medium">Theme Name</label>
              <input
                type="text"
                value={newThemeName}
                onChange={(e) => setNewThemeName(e.target.value)}
                placeholder="e.g., My Custom Theme"
                style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ backgroundColor: modeColors.bgSecondary, color: modeColors.text }}
                className="flex-1 py-3 rounded-xl font-medium hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createTheme}
                className="flex-1 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
              >
                Create Theme
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Theme Modal */}
      {showEditModal && selectedTheme && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-2xl border w-full max-w-4xl p-8 my-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 style={{ color: modeColors.text }} className="font-bold text-2xl flex items-center gap-3">
                <Palette className="text-blue-500" />
                Edit Theme: {selectedTheme.name}
              </h3>
              <button onClick={() => setShowEditModal(false)} style={{ color: modeColors.textSecondary }} className="hover:text-blue-500 transition-colors">
                <X size={28} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
              {colorGroups.map((group) => (
                <div key={group.title} style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border }} className="rounded-2xl p-6 border shadow-sm">
                  <h4 style={{ color: modeColors.text }} className="font-bold mb-5 flex items-center justify-between">
                    {group.title}
                    <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-500 rounded-full">{group.colors.length} colors</span>
                  </h4>
                  <div className="space-y-4">
                    {group.colors.map((colorKey) => (
                      <div key={colorKey} className="flex items-center justify-between group">
                        <span style={{ color: modeColors.textSecondary }} className="text-sm font-medium">{formatColorName(colorKey)}</span>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <input
                              type="color"
                              value={editColors[colorKey] || '#000000'}
                              onChange={(e) => setEditColors({ ...editColors, [colorKey]: e.target.value })}
                              className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 overflow-hidden shadow-sm"
                            />
                          </div>
                          <input
                            type="text"
                            value={editColors[colorKey] || ''}
                            onChange={(e) => setEditColors({ ...editColors, [colorKey]: e.target.value })}
                            style={{ backgroundColor: modeColors.card, borderColor: modeColors.border, color: modeColors.text }}
                            className="w-28 border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTopColor: modeColors.border }} className="flex gap-4 mt-8 pt-6 border-t">
              <button
                onClick={() => setShowEditModal(false)}
                style={{ backgroundColor: modeColors.bgSecondary, color: modeColors.text }}
                className="flex-1 py-3 rounded-xl font-medium hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updateTheme}
                className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 active:scale-[0.98] transition-all"
              >
                <Save size={20} />
                Save Theme Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminThemeSettings
