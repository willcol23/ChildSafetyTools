from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from .api import routes_heatmap, routes_vault, routes_tracker, routes_communication
except ImportError:
    from api import routes_heatmap, routes_vault, routes_tracker, routes_communication

app = FastAPI(title="Child Safety API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_heatmap.router)
app.include_router(routes_vault.router)
app.include_router(routes_tracker.router)
app.include_router(routes_communication.router)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
