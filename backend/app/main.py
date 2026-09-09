from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.simulation import router as simulation_router
from app.routes.explanation import router as explanation_router
from app.routes.analysis import router as analysis_router

app = FastAPI(
    title="Q-Learn Quantum Simulator API",
    version="0.1.0",
    description="Backend foundation for Q-Learn circuit simulation.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(simulation_router)
app.include_router(explanation_router)
app.include_router(analysis_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
