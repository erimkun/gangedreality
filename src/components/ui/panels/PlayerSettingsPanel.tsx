/**
 * Player Settings Panel - Player spawn and movement configuration
 */

import { useSceneStore } from '../../../store/useSceneStore'
import { SectionHeader } from './shared'

export default function PlayerSettingsPanel() {
  const { player, updatePlayer, camera, updateCamera } = useSceneStore()

  const handleSetFromCamera = () => {
    // This will be handled by a custom event from the 3D scene
    window.dispatchEvent(new CustomEvent('set-player-start-from-camera'))
  }

  const handleSetOrbitCamera = () => {
    // Set orbit camera start position from current camera
    window.dispatchEvent(new CustomEvent('set-orbit-camera-from-current'))
  }

  return (
    <div className="space-y-4">
      {/* Orbit View Section */}
      <SectionHeader
        title="Orbit View Başlangıç Ayarları"
        icon="🎯"
        gradient="from-cyan-600/20 to-blue-600/20"
      />
      <p className="text-xs text-gray-400 -mt-2">
        Viewer açıldığında kameranın başlayacağı konum
      </p>

      {/* Quick Set Orbit Camera Button */}
      <button
        onClick={handleSetOrbitCamera}
        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
      >
        <span>🎯</span>
        Orbit Kamerasını Ayarla
      </button>
      <p className="text-[10px] text-gray-500 text-center -mt-2">
        Mevcut kamera pozisyonunu ve hedefini kaydet
      </p>

      {/* Orbit Camera Position */}
      <PositionInputGroup
        label="📷 Kamera Pozisyonu"
        values={camera?.position || [0, 0, 0]}
        onChange={(newPos) => updateCamera({ position: newPos })}
      />

      {/* Orbit Camera Target */}
      <PositionInputGroup
        label="🎯 Hedef (Target)"
        values={camera?.target || [0, 0, 0]}
        onChange={(newTarget) => updateCamera({ target: newTarget })}
      />

      <div className="border-t border-gray-600 pt-4 mt-4" />

      {/* Player Mode Header */}
      <SectionHeader
        title="Oyuncu Başlangıç Ayarları"
        icon="🚶"
        gradient="from-blue-600/20 to-purple-600/20"
      />
      <p className="text-xs text-gray-400 -mt-2">
        Player modunda oyuncunun başlayacağı konum ve yön
      </p>

      {/* Quick Set Button */}
      <button
        onClick={handleSetFromCamera}
        className="w-full bg-primary hover:bg-primary/80 text-editor-bg font-bold py-3 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
      >
        <span>📷</span>
        Kamera Konumunu Kullan
      </button>
      <p className="text-[10px] text-gray-500 text-center -mt-2">
        Mevcut kamera pozisyonunu başlangıç noktası olarak ayarlar
      </p>

      {/* Start Position */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400 font-medium flex items-center gap-2">
          📍 Başlangıç Pozisyonu
        </label>
        <div className="grid grid-cols-3 gap-2">
          <AxisInput
            axis="X"
            color="red"
            value={player.startPosition[0]}
            onChange={(v) => updatePlayer({
              startPosition: [v, player.startPosition[1], player.startPosition[2]]
            })}
          />
          <AxisInput
            axis="Y"
            color="green"
            value={player.startPosition[1]}
            onChange={(v) => updatePlayer({
              startPosition: [player.startPosition[0], v, player.startPosition[2]]
            })}
          />
          <AxisInput
            axis="Z"
            color="blue"
            value={player.startPosition[2]}
            onChange={(v) => updatePlayer({
              startPosition: [player.startPosition[0], player.startPosition[1], v]
            })}
          />
        </div>
      </div>

      {/* Start Rotation */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400 font-medium flex items-center gap-2">
          🔄 Başlangıç Rotasyonu (derece)
        </label>
        <div className="grid grid-cols-3 gap-2">
          <AxisInput
            axis="X (Pitch)"
            color="red"
            value={Math.round((player.startRotation[0] || 0) * 180 / Math.PI)}
            onChange={(v) => updatePlayer({
              startRotation: [v * Math.PI / 180, player.startRotation[1], player.startRotation[2]]
            })}
            step={5}
          />
          <AxisInput
            axis="Y (Yaw)"
            color="green"
            value={Math.round((player.startRotation[1] || 0) * 180 / Math.PI)}
            onChange={(v) => updatePlayer({
              startRotation: [player.startRotation[0], v * Math.PI / 180, player.startRotation[2]]
            })}
            step={5}
          />
          <AxisInput
            axis="Z (Roll)"
            color="blue"
            value={Math.round((player.startRotation[2] || 0) * 180 / Math.PI)}
            onChange={(v) => updatePlayer({
              startRotation: [player.startRotation[0], player.startRotation[1], v * Math.PI / 180]
            })}
            step={5}
          />
        </div>
      </div>


      {/* Preview Indicator */}
      <div className="bg-editor-bg rounded-lg p-3 mt-4">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
          Sahne üzerinde mavi küre başlangıç noktasını gösterir
        </div>
      </div>
    </div>
  )
}

// ============================================
// Sub-components
// ============================================

interface PositionInputGroupProps {
  label: string
  values: [number, number, number]
  onChange: (values: [number, number, number]) => void
}

function PositionInputGroup({ label, values, onChange }: PositionInputGroupProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs text-gray-400 font-medium flex items-center gap-2">
        {label}
      </label>
      <div className="grid grid-cols-3 gap-2">
        {['X', 'Y', 'Z'].map((axis, i) => (
          <div key={axis}>
            <label className={`text-[10px] ${i === 0 ? 'text-red-400' : i === 1 ? 'text-green-400' : 'text-blue-400'
              } block mb-1`}>{axis}</label>
            <input
              type="number"
              step="0.5"
              value={values[i].toFixed(2)}
              onChange={(e) => {
                const newValues = [...values] as [number, number, number]
                newValues[i] = parseFloat(e.target.value) || 0
                onChange(newValues)
              }}
              className={`w-full bg-editor-input border border-gray-600 rounded px-2 py-1.5 text-white text-sm focus:border-${i === 0 ? 'red' : i === 1 ? 'green' : 'blue'
                }-400 focus:outline-none`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

interface AxisInputProps {
  axis: string
  color: 'red' | 'green' | 'blue'
  value: number
  onChange: (value: number) => void
  step?: number
}

function AxisInput({ axis, color, value, onChange, step = 0.1 }: AxisInputProps) {
  const colorClass = {
    red: 'text-red-400 focus:border-red-400',
    green: 'text-green-400 focus:border-green-400',
    blue: 'text-blue-400 focus:border-blue-400'
  }

  return (
    <div>
      <label className={`text-[10px] ${colorClass[color].split(' ')[0]} block mb-1`}>{axis}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className={`w-full bg-editor-input border border-gray-600 rounded px-2 py-1.5 text-white text-sm ${colorClass[color].split(' ')[1]} focus:outline-none`}
      />
    </div>
  )
}
