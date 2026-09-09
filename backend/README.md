# Q-Learn Backend

FastAPI backend for the Q-Learn Quantum Circuit Simulator. The `/simulate` endpoint converts the frontend circuit model into a Qiskit circuit and executes it with Qiskit Aer.

## Run independently

From the `backend` directory:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API is available at `http://127.0.0.1:8000`.

```bash
curl -X POST http://127.0.0.1:8000/simulate \
  -H "Content-Type: application/json" \
  -d '{"qubits":4,"classicalBits":4,"operations":[]}'
```

The optional `shots` query parameter defaults to `1024`:

```bash
curl -X POST 'http://127.0.0.1:8000/simulate?shots=2048' \
  -H "Content-Type: application/json" \
  -d '{"qubits":2,"classicalBits":2,"operations":[]}'
```

Supported operations are H, X, Y, Z, S, T, Rx, Ry, Rz, CNOT, CZ, SWAP, and measurement.

## Circuit explanations

The `POST /explain-circuit` endpoint accepts the circuit, gates used, optional simulation results, and learner level. It currently returns a deterministic teaching explanation and is structured so the service can later call an LLM from the backend without exposing credentials to the frontend.

```bash
curl -X POST http://127.0.0.1:8000/explain-circuit \
  -H "Content-Type: application/json" \
  -d '{"circuit":{"qubits":2,"classicalBits":2,"operations":[]},"gatesUsed":["hadamard"],"learnerLevel":"beginner"}'
```

## Circuit analysis

The read-only `POST /analyze-circuit` endpoint checks for invalid gate combinations, missing measurements, unnecessary operations, redundant self-inverse gates, and common beginner mistakes. It returns educational suggestions and never changes the submitted circuit.
