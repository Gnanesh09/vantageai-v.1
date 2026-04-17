from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import ingest, analyze, insights, trends, directives, brands

app = FastAPI(
    title="VantageAI Core Server",
    description="Predictive Consumer Intelligence Operating System — Agentic AI Backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(brands.router,     prefix="/brands",     tags=["Brands"])
app.include_router(ingest.router,     prefix="/ingest",     tags=["Ingestion"])
app.include_router(analyze.router,    prefix="/analyze",    tags=["Analysis"])
app.include_router(insights.router,   prefix="/insights",   tags=["Insights"])
app.include_router(trends.router,     prefix="/trends",     tags=["Trends"])
app.include_router(directives.router, prefix="/directives", tags=["Directives"])

@app.get("/")
def root():
    return {"status": "VantageAI Core Server running ✅", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}