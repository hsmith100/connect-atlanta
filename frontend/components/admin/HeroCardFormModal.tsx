import { Upload, Loader2, ImageIcon } from 'lucide-react'

export interface HeroCardFormValues {
  title: string
  description: string
  ctaText: string
  linkUrl: string
  icon: string
  visible: boolean
}

export const EMPTY_HERO_CARD_FORM: HeroCardFormValues = {
  title: '',
  description: '',
  ctaText: '',
  linkUrl: '',
  icon: '',
  visible: true,
}

const ICON_OPTIONS = ['None', 'Headphones', 'Users', 'Camera', 'Music', 'Star', 'Mic', 'Heart', 'Zap']

const inputCls = 'w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-brand-primary'

interface HeroCardFormModalProps {
  isOpen: boolean
  editingId: string | null
  form: HeroCardFormValues
  onChange: (updates: Partial<HeroCardFormValues>) => void
  imageFile: File | null
  imagePreview: string | null
  onImageChange: (file: File) => void
  error: string
  saving: boolean
  onSave: () => void
  onClose: () => void
}

export function HeroCardFormModal({
  isOpen,
  editingId,
  form,
  onChange,
  imageFile,
  imagePreview,
  onImageChange,
  error,
  saving,
  onSave,
  onClose,
}: HeroCardFormModalProps) {
  if (!isOpen) return null

  const canSave = !saving && !!form.title && !!form.description && !!form.ctaText && !!form.linkUrl

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-5 space-y-4 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-white font-semibold">{editingId ? 'Edit Card' : 'New Card'}</h3>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Beats on the Beltline"
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Description *</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Atlanta's premier free outdoor electronic music experience…"
            className={inputCls + ' resize-none'}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">CTA Button Text *</label>
          <input
            type="text"
            value={form.ctaText}
            onChange={(e) => onChange({ ctaText: e.target.value })}
            placeholder="Attend Next Event"
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Link URL * (internal /gallery or external https://…)</label>
          <input
            type="text"
            value={form.linkUrl}
            onChange={(e) => onChange({ linkUrl: e.target.value })}
            placeholder="/join or https://..."
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Icon</label>
          <select
            value={form.icon}
            onChange={(e) => onChange({ icon: e.target.value })}
            className={inputCls}
          >
            {ICON_OPTIONS.map((opt) => (
              <option key={opt} value={opt === 'None' ? '' : opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Background Image</label>
          <div className="flex gap-3 items-start">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg bg-gray-800 border border-gray-700 shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0">
                <ImageIcon size={24} className="text-gray-600" />
              </div>
            )}
            <label className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-3 py-2 text-sm font-semibold cursor-pointer transition-colors self-center">
              <Upload size={14} />
              {imageFile ? 'Replace image' : 'Choose image'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onImageChange(file)
                  e.target.value = ''
                }}
              />
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="card-visible"
            checked={form.visible}
            onChange={(e) => onChange({ visible: e.target.checked })}
            className="w-4 h-4 accent-brand-primary"
          />
          <label htmlFor="card-visible" className="text-sm text-gray-300">Visible on home page</label>
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onSave}
            disabled={!canSave}
            className="flex-1 flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {saving
              ? <><Loader2 size={14} className="animate-spin" /> {editingId ? 'Saving…' : 'Creating…'}</>
              : editingId ? 'Save Changes' : 'Create Card'}
          </button>
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
