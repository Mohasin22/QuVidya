import { useState } from 'react'
import { OrbitControls, Text } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Vector3 } from 'three'
import type { SimulationResult, StateVectorAmplitude } from '../../types/simulation'

type QSphereProps = {
  result: SimulationResult
  qubits: number
}

type QSpherePoint = {
  position: Vector3
  amplitude: number
  phase: number
  label: string
}

export function QSphere({ result, qubits }: QSphereProps) {
  const [showLabels, setShowLabels] = useState(true)
  const [showPhase, setShowPhase] = useState(true)
  
  const stateVector = result.stateVector
  const points = stateVector ? calculateQSpherePoints(stateVector, qubits) : []
  const canDisplay = points.length > 0 && qubits <= 4

  if (!canDisplay) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-xl border border-[#e5ebe6] bg-[#f8f9f7] p-6 text-center">
        <p className="text-[11px] font-medium text-[#87938d]">
          {qubits > 4 
            ? 'Q-Sphere visualization available for up to 4 qubits' 
            : 'Run a circuit simulation to see Q-Sphere visualization'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-[12px] font-bold text-[#17211f]">Q-Sphere</h3>
          <p className="text-[10px] text-[#87938d]">Quantum state visualization</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLabels(!showLabels)}
            className="rounded-lg px-2 py-1 text-[9px] font-medium transition hover:bg-[#eef3ef]"
            style={{ backgroundColor: showLabels ? '#e5f2e9' : 'transparent' }}
          >
            Labels
          </button>
          <button
            onClick={() => setShowPhase(!showPhase)}
            className="rounded-lg px-2 py-1 text-[9px] font-medium transition hover:bg-[#eef3ef]"
            style={{ backgroundColor: showPhase ? '#e5f2e9' : 'transparent' }}
          >
            Phase
          </button>
        </div>
      </div>

      <div className="flex-1 rounded-lg bg-[#f7faf7]">
        <Canvas camera={{ position: [3, 2.5, 3], fov: 45 }} dpr={[1, 2]}>
          <color attach="background" args={['#f7faf7']} />
          <ambientLight intensity={1.2} />
          <QSphereScene points={points} showLabels={showLabels} showPhase={showPhase} />
          <OrbitControls enablePan={false} minDistance={2.5} maxDistance={6} />
        </Canvas>
      </div>

      {showPhase && (
        <div className="mt-3 flex items-center justify-center gap-4">
          <PhaseLegend />
        </div>
      )}
    </div>
  )
}

function QSphereScene({ points, showLabels, showPhase }: { points: QSpherePoint[]; showLabels: boolean; showPhase: boolean }) {
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
      <Text position={[1.45, 0, 0]} fontSize={0.12} color="#9b6a14">X</Text>
      <Text position={[0, 1.45, 0]} fontSize={0.12} color="#596f91">Z</Text>
      <Text position={[0, 0, 1.45]} fontSize={0.12} color="#765a94">Y</Text>

      {/* State points */}
      {points.map((point, index) => (
        <StatePoint key={index} point={point} showLabels={showLabels} showPhase={showPhase} />
      ))}
    </>
  )
}

function StatePoint({ point, showLabels, showPhase }: { point: QSpherePoint; showLabels: boolean; showPhase: boolean }) {
  const position = new Vector3(point.position.x, point.position.z, point.position.y)
  const size = 0.08 + (point.amplitude * 0.12) // Size based on amplitude
  const phaseColor = getPhaseColor(point.phase)

  return (
    <>
      {/* State marker */}
      <mesh position={position}>
        <sphereGeometry args={[size, 16, 12]} />
        <meshBasicMaterial 
          color={showPhase ? phaseColor : '#1c6b52'} 
          transparent 
          opacity={0.9}
        />
      </mesh>

      {/* Connection line from origin */}
      <line>
        <bufferGeometry attach="geometry" onUpdate={(geometry) => 
          geometry.setFromPoints([new Vector3(0, 0, 0), position])
        } />
        <lineBasicMaterial attach="material" color={showPhase ? phaseColor : '#1c6b52'} opacity={0.3} />
      </line>

      {/* State label */}
      {showLabels && (
        <Text 
          position={position.clone().multiplyScalar(1.3)} 
          fontSize={0.1} 
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
        onUpdate={(geometry) => geometry.setFromPoints(points.map(([x, y, z]) => new Vector3(x, y, z)))} 
      />
      <lineBasicMaterial attach="material" color={color} />
    </line>
  )
}

function PhaseLegend() {
  return (
    <div className="flex items-center gap-2 text-[9px] text-[#6d7975]">
      <span>Phase:</span>
      <div className="flex items-center gap-1">
        <div className="size-3 rounded-full bg-[#ff6b6b]" />
        <span>0°</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="size-3 rounded-full bg-[#4ecdc4]" />
        <span>90°</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="size-3 rounded-full bg-[#45b7d1]" />
        <span>180°</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="size-3 rounded-full bg-[#96ceb4]" />
        <span>270°</span>
      </div>
    </div>
  )
}

function calculateQSpherePoints(stateVector: StateVectorAmplitude[], qubits: number): QSpherePoint[] {
  const points: QSpherePoint[] = []
  
  for (const state of stateVector) {
    const amplitude = Math.sqrt(state.real ** 2 + state.imaginary ** 2)
    if (amplitude < 0.001) continue // Skip negligible states
    
    const phase = Math.atan2(state.imaginary, state.real)
    
    // Calculate spherical coordinates from amplitude and phase
    // For single qubit: use Bloch sphere coordinates
    // For multi-qubit: use simplified projection
    let x, y, z
    
    if (qubits === 1) {
      // Bloch sphere coordinates
      x = 2 * (state.real * (stateVector[1]?.real || 0) + state.imaginary * (stateVector[1]?.imaginary || 0))
      y = 2 * (state.real * (stateVector[1]?.imaginary || 0) - state.imaginary * (stateVector[1]?.real || 0))
      z = state.real ** 2 + state.imaginary ** 2 - ((stateVector[1]?.real || 0) ** 2 + (stateVector[1]?.imaginary || 0) ** 2)
    } else {
      // Simplified projection for multi-qubit states
      // Use state index to determine position on sphere
      const stateIndex = parseInt(state.basisState.replace(/[|⟩]/g, ''), 2)
      const theta = (stateIndex / (2 ** qubits)) * Math.PI
      const phi = phase
      
      x = amplitude * Math.sin(theta) * Math.cos(phi)
      y = amplitude * Math.sin(theta) * Math.sin(phi)
      z = amplitude * Math.cos(theta)
    }
    
    points.push({
      position: new Vector3(x, y, z),
      amplitude,
      phase,
      label: state.basisState
    })
  }
  
  return points
}

function getPhaseColor(phase: number): string {
  // Map phase to color (simplified color wheel)
  const normalizedPhase = ((phase + Math.PI) / (2 * Math.PI)) // Normalize to 0-1
  const hue = normalizedPhase * 360
  
  // Use HSL to RGB conversion for smooth color transitions
  const saturation = 70
  const lightness = 55
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}