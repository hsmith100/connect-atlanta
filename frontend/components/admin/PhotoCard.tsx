import { Eye, EyeOff, GripVertical } from 'lucide-react'
import type { Photo } from '@shared/types/photos'

interface PhotoCardProps {
  photo: Photo
  selected: boolean
  onSelect: (id: string) => void
  onToggleVisible: (id: string, visible: boolean) => void
  onDragStart: (index: number) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDrop: (index: number) => void
  index: number
}

export function PhotoCard({ photo, selected, onSelect, onToggleVisible, onDragStart, onDragOver, onDrop, index }: PhotoCardProps) {
  return (
    <div
      draggable
      data-photo-id={photo.id}
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(e, index) }}
      onDrop={() => onDrop(index)}
      className={`relative rounded-xl overflow-hidden bg-gray-800 border-2 transition-colors ${selected ? 'border-brand-primary' : 'border-transparent'}`}
    >
      <div className="aspect-square">
        <img
          src={photo.thumbnailUrl}
          alt=""
          className={`w-full h-full object-cover transition-opacity ${photo.visible ? 'opacity-100' : 'opacity-40'}`}
          loading="lazy"
        />
      </div>
      <div className="absolute top-1 left-1 cursor-grab text-white/60 bg-black/40 rounded p-0.5">
        <GripVertical size={16} />
      </div>
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onSelect(photo.id)}
        className="absolute top-1 right-1 w-5 h-5 cursor-pointer accent-brand-primary"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={() => onToggleVisible(photo.id, !photo.visible)}
        className="absolute bottom-1 right-1 bg-black/60 rounded-full p-1 text-white hover:text-brand-primary transition-colors"
        title={photo.visible ? 'Hide photo' : 'Show photo'}
      >
        {photo.visible ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
    </div>
  )
}
