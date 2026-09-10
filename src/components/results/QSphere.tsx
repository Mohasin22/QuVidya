import { useState } from 'react'
import { OrbitControls, Text } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Maximize2, RotateCcw } from 'lucide-react'
import { Vector3 } from 'three'
import type { SimulationResult, StateVectorAmplitude } from '../../types/simulation'

type QSphereProps = {
  result: SimulationResult
  qubits: number
  enlarged?: boolean
  fullPageMode?: boolean
  onEnlarge?: () => void
}

type QSpherePoint = {
  position: Vector3
  amplitude: number
  phase: number
  label: string
}

export function QSphere({
  result,
  qubits,
  enlarged = false,
  fullPageMode = false,
  onEnlarge,
}: QSphereProps) {
  const [showLabels, setShowLabels] = useState(true)
  const [showPhase, setShowPhase] = useState(true)
  const [cameraKey, setCameraKey] = useState(0)

  const stateVector = result.stateVector
  const points = stateVector ? calculateQSpherePoints(stateVector, qubits) : []
  const canDisplay = points.length > 0 && qubits <= 4

  if (!canDisplay) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-xl border border-[#e5ebe6] bg-[#f8f9f7] p-6 text-center">
        <p className="text-[11px] font-medium text-[#87938d]">
          {qubits > 4
            ? 'Q-Sphere visualization is optimized for up to 4 qubits'
            : 'Run a circuit simulation to see Q-Sphere visualization'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`font-extrabold text-[#17211f] ${enlarged ? 'text-[14px]' : 'text-[12px]'}`}>
              Q-Sphere
            </h3>
            {enlarged && (
              <span className="rounded-md bg-[#edf5ef] px-2 py-0.5 font-mono text-[10px] font-bold text-[#1c6b52]">
                {points.length} active {points.length === 1 ? 'state point' : 'state points'}
              </span>
            )}
          </div>
          <p className="text-[10px] text-[#87938d]">Quantum state multi-qubit sphere visualization</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLabels(!showLabels)}
            className={`rounded-lg px-2.5 py-1 text-[9px] font-bold transition ${
              showLabels
                ? 'border border-[#cfe2d5] bg-[#e5f2e9] text-[#1c6b52]'
                : 'border border-[#dbe2dd] bg-[#f8faf8] text-[#718078] hover:bg-[#eef3ef]'
            }`}
          >
            Labels
          </button>
          <button
            type="button"
            onClick={() => setShowPhase(!showPhase)}
            className={`rounded-lg px-2.5 py-1 text-[9px] font-bold transition ${
              showPhase
                ? 'border border-[#cfe2d5] bg-[#e5f2e9] text-[#1c6b52]'
                : 'border border-[#dbe2dd] bg-[#f8faf8] text-[#718078] hover:bg-[#eef3ef]'
            }`}
          >
            Phase
          </button>

          {enlarged && (
            <button
              type="button"
              onClick={() => setCameraKey((k) => k + 1)}
              className="flex items-center gap-1 rounded-lg border border-[#dbe2dd] bg-[#f8faf8] px-2.5 py-1 text-[9px] font-bold text-[#55655d] transition hover:bg-[#eef3ef] hover:text-[#17211f]"
              title="Reset 3D camera orientation"
            >
              <RotateCcw size={10} />
              <span>Reset View</span>
            </button>
          )}

          {onEnlarge && (
            <button
              type="button"
              onClick={onEnlarge}
              className="flex size-7 items-center justify-center rounded-lg border border-[#cfe2d5] bg-[#f1f9f3] text-[#1c6b52] transition hover:bg-[#e2f1e6] hover:text-[#124d3a] shadow-xs"
              title="Enlarge Q-Sphere for analysis"
              aria-label="Enlarge Q-Sphere"
            >
              <Maximize2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* 3D Canvas Area */}
      <div
        className="relative w-full rounded-xl border border-[#e5ebe6] bg-[#f7faf7] overflow-hidden"
        style={{
          height: enlarged ? (fullPageMode ? 460 : 360) : 240,
        }}
      >
        <Canvas
          key={cameraKey}
          camera={{ position: [2.5, 2.0, 2.5], fov: 42 }}
          dpr={[1, 2]}
        >
          <color attach="background" args={['#f7faf7']} />
          <ambientLight intensity={1.3} />
          <pointLight position={[10, 10, 10]} intensity={0.5} />
          <QSphereScene points={points} showLabels={showLabels} showPhase={showPhase} />
          <OrbitControls enablePan={true} minDistance={2} maxDistance={8} />
        </Canvas>

        {/* Floating Axis & Controls info badge */}
        <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap items-center gap-2 text-[9px] text-[#6d7975] bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-[#dbe2dd]">
          <span className="font-semibold">Axes:</span>
          <span className="font-bold text-[#9b6a14]">X</span>
          <span className="font-bold text-[#765a94]">Y</span>
          <span className="font-bold text-[#596f91]">Z</span>
          <span className="text-[#a4b1ab]">•</span>
          <span>Rotate: Drag • Zoom: Scroll</span>
        </div>
      </div>

      {/* Phase Legend */}
      {showPhase && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          <PhaseLegend />
        </div>
      )}

      {/* Enlarged Mode Detailed State Inspector Table */}
      {enlarged && (
        <div className="mt-6 border-t border-[#e5ebe6] pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-[12px] font-bold text-[#17211f]">
              Q-Sphere State Points & Phase Coordinates
            </h4>
            <span className="text-[10px] text-[#718078] font-medium">
              Spherical projection of superposed eigenstates
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#e5ebe6] bg-white">
            <table className="w-full text-left text-[11px]">
              <thead className="border-b border-[#e5ebe6] bg-[#f8faf8] font-semibold text-[#55655d]">
                <tr>
                  <th className="px-3.5 py-2.5 font-mono">Basis State</th>
                  <th className="px-3.5 py-2.5">Probability (|α|²)</th>
                  <th className="px-3.5 py-2.5">Amplitude (|α|)</th>
                  <th className="px-3.5 py-2.5">Phase (φ)</th>
                  <th className="px-3.5 py-2.5">Phase Color</th>
                  <th className="px-3.5 py-2.5 font-mono">Sphere (x, y, z)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf2ee]">
                {points.map((p) => {
                  const phaseDeg = Math.round(
                    ((p.phase >= 0 ? p.phase : p.phase + 2 * Math.PI) * 180) / Math.PI
                  )
                  const phaseRad = (p.phase / Math.PI).toFixed(2)
                  const phaseColor = getPhaseColor(p.phase)
                  const prob = p.amplitude ** 2

                  return (
                    <tr key={p.label} className="hover:bg-[#f8faf8]">
                      <td className="px-3.5 py-2 font-mono font-bold text-[#17211f]">
                        {p.label}
                      </td>
                      <td className="px-3.5 py-2 font-mono font-bold text-[#1c6b52]">
                        {(prob * 100).toFixed(2)}%
                      </td>
                      <td className="px-3.5 py-2 font-mono text-[#55655d]">
                        {p.amplitude.toFixed(4)}
                      </td>
                      <td className="px-3.5 py-2 font-mono text-[#765a94] font-medium">
                        {phaseDeg}° ({phaseRad}π)
                      </td>
                      <td className="px-3.5 py-2">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="size-3 rounded-full shadow-2xs border border-white"
                            style={{ backgroundColor: phaseColor }}
                          />
                          <span className="font-mono text-[9px] text-[#718078]">{phaseColor}</span>
                        </div>
                      </td>
                      <td className="px-3.5 py-2 font-mono text-[10px] text-[#596f91]">
                        ({p.position.x.toFixed(2)}, {p.position.y.toFixed(2)}, {p.position.z.toFixed(2)})
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function QSphereScene({
  points,
  showLabels,
  showPhase,
}: {
  points: QSpherePoint[]
  showLabels: boolean
  showPhase: boolean
}) {
  return (
    <>
      {/* Q-Sphere wireframe */}
      <mesh>
        <sphereGeometry args={[1, 32, 24]} />
        <meshBasicMaterial color="#d6e9dc" transparent opacity={0.15} wireframe />
      </mesh>

      {/* Axis lines */}
      <Line points={[[-1.3, 0, 0], [1.3, 0, 0]]} color="#c18a2e" />
      <Line points={[[0, -1.3, 0], [0, 1.3, 0]]} color="#6b8eb1" />
      <Line points={[[0, 0, -1.3], [0, 0, 1.3]]} color="#8a6fa8" />

      {/* Axis labels */}
      <Text position={[1.45, 0, 0]} fontSize={0.12} color="#9b6a14">
        X
      </Text>
      <Text position={[0, 1.45, 0]} fontSize={0.12} color="#596f91">
        Z
      </Text>
      <Text position={[0, 0, 1.45]} fontSize={0.12} color="#765a94">
        Y
      </Text>

      {/* State points */}
      {points.map((point, index) => (
        <StatePoint key={index} point={point} showLabels={showLabels} showPhase={showPhase} />
      ))}
    </>
  )
}

function StatePoint({
  point,
  showLabels,
  showPhase,
}: {
  point: QSpherePoint
  showLabels: boolean
  showPhase: boolean
}) {
  const position = new Vector3(point.position.x, point.position.z, point.position.y)
  const size = 0.08 + point.amplitude * 0.12 // Size based on amplitude
  const phaseColor = getPhaseColor(point.phase)

  return (
    <>
      {/* State marker */}
      <mesh position={position}>
        <sphereGeometry args={[size, 16, 12]} />
        <meshBasicMaterial color={showPhase ? phaseColor : '#1c6b52'} transparent opacity={0.9} />
      </mesh>

      {/* Connection line from origin */}
      <line>
        <bufferGeometry
          attach="geometry"
          onUpdate={(geometry) =>
            geometry.setFromPoints([new Vector3(0, 0, 0), position])
          }
        />
        <lineBasicMaterial
          attach="material"
          color={showPhase ? phaseColor : '#1c6b52'}
          opacity={0.35}
        />
      </line>

      {/* State label */}
      {showLabels && (
        <Text
          position={position.clone().multiplyScalar(1.3)}
          fontSize={0.11}
          color="#1c6b52"
          anchorX="center"
          anchorY="middle"
        >
          {point.label}
        </Text>
      )}
    </>
  )
}

function Line({ points, color }: { points: [number, number, number][]; color: string }) {
  return (
    <line>
      <bufferGeometry
        attach="geometry"
        onUpdate={(geometry) =>
          geometry.setFromPoints(points.map(([x, y, z]) => new Vector3(x, y, z)))
        }
      />
      <lineBasicMaterial attach="material" color={color} />
    </line>
  )
}

function PhaseLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#e5ebe6] bg-white px-3 py-1.5 text-[9px] text-[#6d7975] shadow-2xs">
      <span className="font-semibold text-[#55655d]">Phase Angle:</span>
      <div className="flex items-center gap-1.5">
        <div className="size-2.5 rounded-full bg-[#ff6b6b]" />
        <span>0° (0 rad)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="size-2.5 rounded-full bg-[#4ecdc4]" />
        <span>90° (π/2)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="size-2.5 rounded-full bg-[#45b7d1]" />
        <span>180° (π)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="size-2.5 rounded-full bg-[#96ceb4]" />
        <span>270° (3π/2)</span>
      </div>
    </div>
  )
}

function calculateQSpherePoints(
  stateVector: StateVectorAmplitude[],
  qubits: number
): QSpherePoint[] {
  const points: QSpherePoint[] = []

  for (const state of stateVector) {
    const amplitude = Math.sqrt(state.real ** 2 + state.imaginary ** 2)
    if (amplitude < 0.001) continue // Skip negligible states

    const phase = Math.atan2(state.imaginary, state.real)

    // Calculate spherical coordinates from amplitude and phase
    let x: number
    let y: number
    let z: number

    if (qubits === 1) {
      // Bloch sphere coordinates
      x =
        2 *
        (state.real * (stateVector[1]?.real || 0) +
          state.imaginary * (stateVector[1]?.imaginary || 0))
      y =
        2 *
        (state.real * (stateVector[1]?.imaginary || 0) -
          state.imaginary * (stateVector[1]?.real || 0))
      z =
        state.real ** 2 +
        state.imaginary ** 2 -
        ((stateVector[1]?.real || 0) ** 2 + (stateVector[1]?.imaginary || 0) ** 2)
    } else {
      // Simplified projection for multi-qubit states
      // Use state index to determine latitude on sphere
      const stateIndex = parseInt(state.basisState.replace(/[|⟩]/g, ''), 2)
      const theta = (stateIndex / 2 ** qubits) * Math.PI
      const phi = phase

      x = amplitude * Math.sin(theta) * Math.cos(phi)
      y = amplitude * Math.sin(theta) * Math.sin(phi)
      z = amplitude * Math.cos(theta)
    }

    points.push({
      position: new Vector3(x, y, z),
      amplitude,
      phase,
      label: state.basisState,
    })
  }

  return points
}

function getPhaseColor(phase: number): string {
  // Map phase to color (smooth color wheel)
  const normalizedPhase = (phase + Math.PI) / (2 * Math.PI) // Normalize to 0-1
  const hue = Math.round(normalizedPhase * 360)
  const saturation = 75
  const lightness = 52

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}