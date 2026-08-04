from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import routes_heatmap

app = FastAPI(title="Crime Heatmap API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_heatmap.router)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
