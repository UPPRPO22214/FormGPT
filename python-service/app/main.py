from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from api.routers import all_routers


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

for router in all_routers:
    app.include_router(router)

if __name__ == "__main__":
    #TODO: setip reload for docker compose
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, workers=4)
