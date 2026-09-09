import { OrbitControls, Text } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useCircuitStore } from '../../store/circuitStore'
import type { SimulationState, StateVectorAmplitude } from '../../types/simulation'

type BlochSphereProps = { simulation: SimulationState }
type BlochVector = { x: number; y: number; z: number }

export function BlochSphere({ simulation }: BlochSphereProps) {
  const circuit = useCircuitStore((state) => state.circuit)
  const vector = simulation.result?.stateVector ? getBlochVector(simulation.result.stateVector) : undefined
  const canRepresentState = circuit.qubits === 1 && Boolean(vector)

  // Only show Bloch sphere for single-qubit circuits with valid state vector
  if (!canRepresentState) {
    return null
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[#e5ebe6] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold">Bloch sphere</p>
        <span className="font-mono text-[9px] text-[#9aa49f]">single qubit</span>
      </div>
      {vector && (
        <>
          <div className="mt-3 h-56 rounded-lg bg-[#f7faf7]">
            <Canvas camera={{ position: [2.8, 2.5, 2.4], fov: 42 }} dpr={[1, 2]}>
              <color attach="background" args={['#f7faf7']} />
              <ambientLight intensity={1.4} />
              <BlochScene vector={vector} />
              <OrbitControls enablePan={false} minDistance={2.2} maxDistance={5} />
            </Canvas>
          </div>
          <div className="mt-2 flex justify-between font-mono text-[9px] text-[#87938d]">
            <span>x: {vector.x.toFixed(3)}</span>
            <span>y: {vector.y.toFixed(3)}</span>
            <span>z: {vector.z.toFixed(3)}</span>
          </div>
        </>
      )}
    </section>
  )
}

function BlochScene({ vector }: { vector: BlochVector }) {
  const endpoint = new Vector3(vector.x, vector.z, vector.y)
  const length = endpoint.length()
  return (
    <>
      <mesh>
        <sphereGeometry args={[1, 32, 20]} />
        <meshBasicMaterial color="#d6e9dc" transparent opacity={0.28} wireframe />
      </mesh>
      <Line points={[[-1.25, 0, 0], [1.25, 0, 0]]} color="#c18a2e" />
      <Line points={[[0, -1.25, 0], [0, 1.25, 0]]} color="#6b8eb1" />
      <Line points={[[0, 0, -1.25], [0, 0, 1.25]]} color="#8a6fa8" />
      <Text position={[1.4, 0, 0]} fontSize={0.13} color="#9b6a14">X</Text>
      <Text position={[0, 1.4, 0]} fontSize={0.13} color="#596f91">Z</Text>
      <Text position={[0, 0, 1.4]} fontSize={0.13} color="#765a94">Y</Text>
      <Text position={[0, 1.18, 0]} fontSize={0.14} color="#1c6b52">|0⟩</Text>
      <Text position={[0, -1.18, 0]} fontSize={0.14} color="#1c6b52">|1⟩</Text>
      {length > 0.001 && <arrowHelper args={[endpoint.clone().normalize(), new Vector3(0, 0, 0), length, '#1c6b52', 0.12, 0.07]} />}
    </>
  )
}

function Line({ points, color }: { points: [number, number, number][]; color: string }) {
  return (
    <line>
      <bufferGeometry attach="geometry" onUpdate={(geometry) => geometry.setFromPoints(points.map(([x, y, z]) => new Vector3(x, y, z)))} />
      <lineBasicMaterial attach="material" color={color} />
    </line>
  )
}

function getBlochVector(stateVector: StateVectorAmplitude[]): BlochVector | undefined {
  if (stateVector.length !== 2) return undefined
  const zero = stateVector[0]
  const one = stateVector[1]
  const x = 2 * (zero.real * one.real + zero.imaginary * one.imaginary)
  const y = 2 * (zero.real * one.imaginary - zero.imaginary * one.real)
  const z = zero.real ** 2 + zero.imaginary ** 2 - one.real ** 2 - one.imaginary ** 2
  const length = Math.sqrt(x ** 2 + y ** 2 + z ** 2)
  if (!Number.isFinite(length)) return undefined
  return { x, y, z }
}
