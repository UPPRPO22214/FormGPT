from typing import Optional

from dotenv import load_dotenv
from urllib.parse import quote_plus

from pydantic import Field
from pydantic.v1 import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    DB_HOST: str = Field("", env="DB_HOST")
    DB_PORT: int = Field(0, env="DB_PORT")
    DB_NAME: str = Field("", env="DB_NAME")
    DB_USER: str = Field("", env="DB_USER")
    DB_PASSWORD: str = Field("", env="DB_PASSWORD")
    GIGACHAT_CREDENTIALS: Optional[str] = Field(None, env="GIGACHAT_CREDENTIALS")


settings = Settings()


def get_db_url():
    return (f"postgresql+asyncpg://{settings.DB_USER}:{settings.DB_PASSWORD}@"
            f"{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")
