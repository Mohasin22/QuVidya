# Q-Learn Quantum Circuit Simulator

Q-Learn is an AI-assisted quantum computing education platform. The current module is a browser-based quantum circuit composer with a React editor, OpenQASM view, Qiskit Aer simulation, educational result visualizations, and advisory circuit analysis.

## Architecture

```text
src/
  components/
    layout/       # Application shell, navigation, toolbar
    gates/        # Gate metadata, palette, draggable gate buttons
    circuit/      # Qubit wires, columns, operations, controlled gates
    editor/       # Circuit toolbar and read-only OpenQASM editor
    results/      # Histogram, state vector, Bloch Sphere, AI panel
  hooks/          # React adapters for circuit state
  services/      # Shared API client, QASM, simulation, explanation, analysis
  store/          # Zustand circuitStore and simulation state
  types/          # Circuit, simulation, explanation, analysis contracts
  styles/         # Tailwind and global styles
backend/
  app/
    main.py       # FastAPI application and CORS
    routes/       # Simulation, explanation, and analysis endpoints
    services/     # Qiskit Aer and educational analysis services
    models/       # Pydantic API models
```

The Zustand `circuitStore` is the single source of truth for circuit structure. The circuit editor, QASM generator, simulation request, result views, and AI tools consume that state. Analysis and explanation are advisory and never mutate the circuit.

## Requirements

- Node.js 20 or newer
- npm
- Python 3.9 or newer

## Installation

Install frontend dependencies from the project root:

```bash
npm install
```

Set up the backend in its own virtual environment:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cd ..
```

## Frontend setup

Start Vite from the project root:

```bash
npm run dev
```

The frontend normally runs at [http://localhost:5173](http://localhost:5173).

The API defaults to `http://127.0.0.1:8000`. To use another backend URL, create a root `.env.local` file:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Available frontend checks:

```bash
npm run build
npm run lint
npm run preview
```

## Backend setup

Start FastAPI from the `backend` directory with the virtual environment active:

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

The API normally runs at [http://127.0.0.1:8000](http://127.0.0.1:8000). Interactive API documentation is available at `/docs`.

Backend syntax validation:

```bash
python -m compileall -q app
```

## Run the simulator

Use two terminals:

```bash
# Terminal 1
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

```bash
# Terminal 2
npm run dev
```

Open the Vite URL, select a gate, and click or drag it into the circuit. Run the circuit from the toolbar to send the current circuit JSON to FastAPI. The results panel then updates with counts, probabilities, state amplitudes, and Bloch Sphere data where applicable.

## Supported gates

The palette, QASM generator, and backend simulator support:

- Basic: H, X, Y, Z, Identity
- Phase: S, S dagger, T, T dagger, Phase
- Rotation: Rx, Ry, Rz
- Multi-qubit: CNOT, CZ, SWAP
- Operations: Measurement, Barrier

Parameterized gates use the `theta` parameter in the circuit operation data. Statevector generation is available for circuits without measurement operations and is bounded to practical circuit sizes on the backend. Multi-qubit states are not shown as a single-qubit Bloch Sphere.

## API endpoints

### `GET /health`

Returns backend health:

```json
{"status":"ok"}
```

### `POST /simulate`

Accepts the frontend circuit model and runs Qiskit Aer. Optional query parameter: `shots` (default `1024`). Returns counts, probabilities, shot count, execution status, and an optional state vector.

```json
{
  "qubits": 2,
  "classicalBits": 2,
  "operations": [
    {"id":"h0","gateType":"hadamard","targetQubits":[0],"column":0},
    {"id":"cx0","gateType":"controlled-not","targetQubits":[1],"controlQubit":0,"column":1}
  ]
}
```

### `POST /explain-circuit`

Accepts `circuit`, `gatesUsed`, optional `simulationResults`, and optional `learnerLevel`. Returns structured educational explanations. It is the future server-side boundary for an LLM; no AI credentials are sent by the frontend.

### `POST /analyze-circuit`

Accepts `circuit` and optional `learnerLevel`. Returns read-only findings for invalid combinations, missing measurements, unnecessary or redundant operations, and beginner mistakes. Each finding contains `issue`, `explanation`, `suggestedImprovement`, `category`, and `severity`.

## Circuit state operations

`circuitStore` supports adding/removing qubits, adding/removing/moving operations, clearing and resetting the circuit, and undo/redo history. Invalid placements, same-column collisions, duplicate operation IDs, invalid controls, and out-of-range qubits are rejected before simulation.
