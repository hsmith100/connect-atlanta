import { useState, useRef, useCallback } from 'react'
import { AlertCircle, Plus, Save } from 'lucide-react'
import { createHeroCard, updateHeroCard, deleteHeroCard, presignHeroCardImage } from '../../lib/api'
import type { HeroCard } from '@shared/types/heroCards'
import { HeroCardVisual } from '../HeroCardVisual'
import { HeroCardFormModal, HeroCardFormValues, EMPTY_HERO_CARD_FORM } from './HeroCardFormModal'

interface HeroCardsTabProps {
  adminKey: string
  heroCards: HeroCard[]
  setHeroCards: React.Dispatch<React.SetStateAction<HeroCard[]>>
}

export function HeroCardsTab({ adminKey, heroCards, setHeroCards }: HeroCardsTabProps) {
  const [deleting, setDeleting] = useState<Record<string, boolean>>({})
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<HeroCardFormValues>(EMPTY_HERO_CARD_FORM)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [error, setError] = useState('')
  const dragIndexRef = useRef<number | null>(null)

  function resetForm() {
    setEditingId(null)
    setForm(EMPTY_HERO_CARD_FORM)
    setImageFile(null)
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    setShowForm(false)
  }

  const handleDragStart = useCallback((index: number) => { dragIndexRef.current = index }, [])
  const handleDrop = useCallback((dropIndex: number) => {
    const dragIndex = dragIndexRef.current
    if (dragIndex === null || dragIndex === dropIndex) return
    setHeroCards((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(dropIndex, 0, moved)
      return next
    })
    dragIndexRef.current = null
  }, [setHeroCards])

  async function handleSaveOrder() {
    setSavingOrder(true)
    setStatusMsg('')
    setError('')
    try {
      await Promise.all(
        heroCards.map((card, i) => updateHeroCard(adminKey, card.id, { sortOrder: i * 10 }))
      )
      setHeroCards((prev) => prev.map((card, i) => ({ ...card, sortOrder: i * 10 })))
      setStatusMsg('Order saved.')
    } catch {
      setError('Failed to save order.')
    } finally {
      setSavingOrder(false)
    }
  }

  function handleStartEdit(card: HeroCard) {
    setEditingId(card.id)
    setForm({
      title: card.title,
      description: card.description,
      ctaText: card.ctaText,
      linkUrl: card.linkUrl,
      icon: card.icon ?? '',
      visible: card.visible,
    })
    setImageFile(null)
    setImagePreview(card.imageUrl ?? null)
    setShowForm(true)
    setError('')
    setStatusMsg('')
  }

  async function handleSave() {
    if (!form.title || !form.description || !form.ctaText || !form.linkUrl) {
      setError('Title, description, CTA text, and link URL are required.')
      return
    }
    setSaving(true)
    setError('')
    setStatusMsg('')
    try {
      const cardId = editingId ?? crypto.randomUUID()
      let imageUrl: string | undefined

      if (imageFile) {
        const { uploadUrl, imageUrl: url } = await presignHeroCardImage(adminKey, cardId, imageFile.name, imageFile.type || 'image/jpeg')
        const res = await fetch(uploadUrl, { method: 'PUT', body: imageFile, headers: { 'Content-Type': imageFile.type || 'image/jpeg' } })
        if (!res.ok) throw new Error(`S3 upload failed: ${res.status}`)
        imageUrl = url
      }

      const icon = form.icon || null

      if (editingId) {
        await updateHeroCard(adminKey, editingId, {
          title: form.title,
          description: form.description,
          ctaText: form.ctaText,
          linkUrl: form.linkUrl,
          icon,
          visible: form.visible,
          ...(imageUrl ? { imageUrl } : {}),
        })
        setHeroCards((prev) => prev.map((c) => c.id === editingId ? {
          ...c,
          title: form.title,
          description: form.description,
          ctaText: form.ctaText,
          linkUrl: form.linkUrl,
          icon,
          visible: form.visible,
          ...(imageUrl ? { imageUrl } : {}),
        } : c))
        setStatusMsg(`Card "${form.title}" updated.`)
      } else {
        const sortOrder = heroCards.length * 10
        await createHeroCard(adminKey, {
          id: cardId,
          title: form.title,
          description: form.description,
          ctaText: form.ctaText,
          linkUrl: form.linkUrl,
          icon: icon ?? undefined,
          imageUrl,
          sortOrder,
          visible: form.visible,
        })
        setHeroCards((prev) => [...prev, {
          id: cardId,
          entity: 'CARD',
          title: form.title,
          description: form.description,
          ctaText: form.ctaText,
          linkUrl: form.linkUrl,
          icon,
          imageUrl: imageUrl ?? null,
          sortOrder,
          visible: form.visible,
        }])
        setStatusMsg(`Card "${form.title}" created.`)
      }
      resetForm()
    } catch (err) {
      console.error('Save card error:', err)
      setError(editingId ? 'Failed to update card.' : 'Failed to create card.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(card: HeroCard) {
    if (!confirm(`Delete "${card.title}"? This cannot be undone.`)) return
    setDeleting((prev) => ({ ...prev, [card.id]: true }))
    setStatusMsg('')
    setError('')
    try {
      await deleteHeroCard(adminKey, card.id)
      setHeroCards((prev) => prev.filter((c) => c.id !== card.id))
      setStatusMsg(`"${card.title}" deleted.`)
    } catch (err) {
      console.error('Delete card error:', err)
      setError(`Failed to delete "${card.title}".`)
      setDeleting((prev) => ({ ...prev, [card.id]: false }))
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-gray-800 flex items-center gap-3">
        <span className="text-sm text-gray-400 mr-auto">{heroCards.length} card{heroCards.length !== 1 ? 's' : ''}</span>
        <button
          onClick={handleSaveOrder}
          disabled={savingOrder || heroCards.length === 0}
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          {savingOrder ? 'Saving…' : 'Save order'}
        </button>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> Add Card
        </button>
      </div>

      {/* Status bar */}
      {(statusMsg || error) && (
        <div className={`px-6 py-2 text-sm flex items-center gap-2 ${error ? 'bg-red-900/40 text-red-300' : 'bg-green-900/40 text-green-300'}`}>
          {error && <AlertCircle size={14} />}
          <span>{error || statusMsg}</span>
          <button onClick={() => { setError(''); setStatusMsg('') }} className="ml-auto text-xs opacity-60 hover:opacity-100">×</button>
        </div>
      )}

      {/* Add / Edit modal */}
      <HeroCardFormModal
        isOpen={showForm}
        editingId={editingId}
        form={form}
        onChange={(updates) => setForm((p) => ({ ...p, ...updates }))}
        imageFile={imageFile}
        imagePreview={imagePreview}
        onImageChange={(file) => {
          if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
          setImageFile(file)
          setImagePreview(URL.createObjectURL(file))
        }}
        error={error}
        saving={saving}
        onSave={handleSave}
        onClose={resetForm}
      />

      {/* Cards — rendered exactly as they appear on the home page */}
      {heroCards.length === 0 ? (
        <div className="p-6 text-center py-20 text-gray-500">
          <p className="text-lg">No hero cards yet.</p>
          <p className="text-sm mt-1">Click "Add Card" to create one.</p>
        </div>
      ) : (
        <div className="p-6 flex flex-wrap gap-4">
          {heroCards.map((card, index) => (
            <div
              key={card.id}
              className="w-72 shrink-0 cursor-grab active:cursor-grabbing"
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(index)}
            >
              <HeroCardVisual
                card={card}
                onEdit={() => handleStartEdit(card)}
                onDelete={() => handleDelete(card)}
                deleting={deleting[card.id]}
              />
              <p className="text-xs text-gray-500 mt-1.5 text-center truncate">{card.linkUrl}</p>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
