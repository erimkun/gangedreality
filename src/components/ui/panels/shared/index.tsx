/**
 * Shared UI Components for Editor Panels
 * Reusable components like inputs, toggles, etc.
 */

import { useState, useRef, useEffect, useCallback } from 'react'

// ============================================
// Draggable Number Input Component
// ============================================
// Supports drag-to-change, Ctrl = precise mode, Shift = fast mode

interface DraggableNumberInputProps {
  label: string
  value: number
  onChange?: (value: number) => void
  color: 'red' | 'green' | 'blue'
  step?: number
  precision?: number
}

export function DraggableNumberInput({ 
  label, 
  value, 
  onChange,
  color,
  step = 0.1,
  precision = 2
}: DraggableNumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dragRef = useRef<{ startX: number; startValue: number; isDragging: boolean }>({
    startX: 0,
    startValue: 0,
    isDragging: false
  })
  const [localValue, setLocalValue] = useState(value.toFixed(precision))
  const [isDragging, setIsDragging] = useState(false)
  
  const colorClasses = {
    red: 'border-red-500 hover:border-red-400',
    green: 'border-green-500 hover:border-green-400',
    blue: 'border-blue-500 hover:border-blue-400'
  }
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return // Only left click
    
    // Store start position but don't activate drag yet
    const startX = e.clientX
    const startValue = value
    let hasDragged = false
    const DRAG_THRESHOLD = 3 // Minimum pixels to move before drag activates
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX
      
      // Only start dragging if moved beyond threshold
      if (!hasDragged && Math.abs(delta) >= DRAG_THRESHOLD) {
        hasDragged = true
        dragRef.current = {
          startX: startX,
          startValue: startValue,
          isDragging: true
        }
        setIsDragging(true)
        document.body.style.cursor = 'ew-resize'
        // Prevent text selection
        e.preventDefault()
      }
      
      if (hasDragged && dragRef.current.isDragging) {
        // Ctrl = precise mode (10x slower), Shift = fast mode (10x faster)
        let sensitivity = step
        if (moveEvent.ctrlKey) sensitivity = step / 10
        if (moveEvent.shiftKey) sensitivity = step * 10
        
        const newValue = startValue + (delta * sensitivity)
        setLocalValue(newValue.toFixed(precision))
        onChange?.(newValue)
      }
    }
    
    const handleMouseUp = () => {
      dragRef.current.isDragging = false
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      
      // If no drag happened, allow normal click behavior (focus input for typing)
      if (!hasDragged && inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [value, onChange, step, precision])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value)
  }
  
  const handleInputBlur = () => {
    const parsed = parseFloat(localValue)
    if (!isNaN(parsed)) {
      onChange?.(parsed)
    } else {
      setLocalValue(value.toFixed(precision))
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur()
      inputRef.current?.blur()
    } else if (e.key === 'Escape') {
      setLocalValue(value.toFixed(precision))
      inputRef.current?.blur()
    }
  }
  
  // Sync with external value changes
  useEffect(() => {
    if (!isDragging) {
      const parsedLocal = parseFloat(localValue)
      if (isNaN(parsedLocal) || Math.abs(value - parsedLocal) > 0.001) {
        setLocalValue(value.toFixed(precision))
      }
    }
  }, [value, isDragging, precision, localValue])
  
  return (
    <div>
      <label 
        className="text-xs text-gray-500 block mb-1 cursor-ew-resize select-none"
        onMouseDown={handleMouseDown}
        title="Sürükle: değer değiştir | Ctrl+Sürükle: hassas | Shift+Sürükle: hızlı"
      >
        {label} ⟷
      </label>
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        className={`w-full bg-editor-panel border-l-2 ${colorClasses[color]} rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-editor-highlight cursor-ew-resize transition-colors ${isDragging ? 'ring-2 ring-blue-400' : ''}`}
        onMouseDown={handleMouseDown}
      />
    </div>
  )
}

// ============================================
// Editable Vector Input Component
// ============================================

interface EditableVectorInputProps {
  label: string
  values: [number, number, number]
  onChange: (values: [number, number, number]) => void
}

export function EditableVectorInput({ 
  label, 
  values, 
  onChange 
}: EditableVectorInputProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-400">{label}</label>
      <div className="grid grid-cols-3 gap-1">
        {['X', 'Y', 'Z'].map((axis, i) => (
          <div key={axis} className="relative">
            <span className={`absolute left-1 top-1/2 -translate-y-1/2 text-xs font-bold ${
              i === 0 ? 'text-red-400' : i === 1 ? 'text-green-400' : 'text-blue-400'
            }`}>{axis}</span>
            <input
              type="number"
              value={values[i]}
              onChange={(e) => {
                const newValues = [...values] as [number, number, number]
                newValues[i] = parseFloat(e.target.value) || 0
                onChange(newValues)
              }}
              step={0.5}
              className="w-full bg-editor-panel border border-gray-600 rounded pl-5 pr-1 py-1 text-white text-xs focus:ring-1 focus:ring-editor-highlight"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// Panel Tab Component
// ============================================

interface PanelTabProps {
  label: string
  icon: string
  active: boolean
  onClick: () => void
}

export function PanelTab({ label, icon, active, onClick }: PanelTabProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-center transition-colors ${
        active 
          ? 'bg-editor-accent text-white border-b-2 border-editor-highlight' 
          : 'text-gray-400 hover:text-white hover:bg-editor-bg'
      }`}
      title={label}
    >
      <span className="text-lg">{icon}</span>
    </button>
  )
}

// ============================================
// Slider with Number Input Component
// ============================================

interface SliderNumberInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  unit?: string
}

export function SliderNumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.1,
  unit = ''
}: SliderNumberInputProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <label className="text-xs text-gray-400">{label}</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            min={min}
            max={max}
            step={step}
            className="w-16 bg-editor-panel border border-gray-600 rounded px-1 py-0.5 text-xs text-primary text-right focus:ring-1 focus:ring-editor-highlight"
          />
          {unit && <span className="text-xs text-gray-500">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  )
}

// ============================================
// Color Input Component
// ============================================

interface ColorInputProps {
  label: string
  value: string
  onChange: (value: string) => void
}

export function ColorInput({ label, value, onChange }: ColorInputProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-400">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-gray-600"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-editor-panel border border-gray-600 rounded px-2 py-1 text-white text-xs focus:ring-1 focus:ring-editor-highlight"
        />
      </div>
    </div>
  )
}

// ============================================
// Section Header Component
// ============================================

interface SectionHeaderProps {
  title: string
  icon?: string
  gradient?: string
}

export function SectionHeader({ title, icon, gradient = 'from-blue-600/20 to-purple-600/20' }: SectionHeaderProps) {
  return (
    <div className={`bg-gradient-to-r ${gradient} rounded-lg p-3 border border-blue-500/30`}>
      <h3 className="text-white font-medium text-sm flex items-center gap-2">
        {icon && <span>{icon}</span>}
        {title}
      </h3>
    </div>
  )
}

// ============================================
// Empty State Component
// ============================================

interface EmptyStateProps {
  icon: string
  title: string
  description?: string
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="text-center py-8 text-gray-400">
      <p className="text-4xl mb-4">{icon}</p>
      <p>{title}</p>
      {description && <p className="text-xs mt-2 text-gray-500">{description}</p>}
    </div>
  )
}

// ============================================
// Slider Input Component
// ============================================

interface SliderInputProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  color?: string
  unit?: string
}

export function SliderInput({ label, value, min, max, step, onChange, color = 'blue', unit = '' }: SliderInputProps) {
  const colorClasses: Record<string, string> = {
    blue: 'accent-blue-500',
    pink: 'accent-pink-500',
    green: 'accent-green-500',
    yellow: 'accent-yellow-500',
    purple: 'accent-purple-500',
    orange: 'accent-orange-500',
    cyan: 'accent-cyan-500'
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-400">{label}</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value.toFixed(step < 1 ? 2 : 0)}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className="w-16 bg-editor-bg border border-gray-600 rounded px-1.5 py-0.5 text-white text-xs text-right focus:border-blue-400 focus:outline-none"
          />
          {unit && <span className="text-[10px] text-gray-500">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full ${colorClasses[color] || colorClasses.blue}`}
      />
    </div>
  )
}

// ============================================
// Toggle Switch Component
// ============================================

interface ToggleSwitchProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
}

export function ToggleSwitch({ enabled, onChange }: ToggleSwitchProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? 'bg-blue-500' : 'bg-gray-600'}`}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'
          }`}
      />
    </button>
  )
}

// ============================================
// Collapsible Section Component
// ============================================

interface CollapsibleSectionProps {
  title: string
  icon: string
  enabled?: boolean
  onToggle?: (enabled: boolean) => void
  borderColor?: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export function CollapsibleSection({
  title,
  icon,
  enabled,
  onToggle,
  borderColor = 'blue',
  children,
  defaultOpen = false
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const borderClasses: Record<string, string> = {
    blue: 'border-blue-500/30',
    pink: 'border-pink-500/30',
    green: 'border-green-500/30',
    yellow: 'border-yellow-500/30',
    purple: 'border-purple-500/30',
    orange: 'border-orange-500/30',
    cyan: 'border-cyan-500/30'
  }

  const textClasses: Record<string, string> = {
    blue: 'text-blue-400',
    pink: 'text-pink-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
    cyan: 'text-cyan-400'
  }

  return (
    <div className={`bg-editor-bg rounded-lg border ${borderClasses[borderColor]}`}>
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <h4 className={`${textClasses[borderColor]} font-medium text-sm`}>{title}</h4>
        </div>
        <div className="flex items-center gap-2">
          {onToggle !== undefined && enabled !== undefined && (
            <div onClick={(e) => e.stopPropagation()}>
              <ToggleSwitch enabled={enabled} onChange={onToggle} />
            </div>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="px-3 pb-3 space-y-3 border-t border-gray-700/50">
          {children}
        </div>
      )}
    </div>
  )
}
