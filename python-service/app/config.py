import os
from typing import Optional

from dotenv import load_dotenv
from urllib.parse import quote_plus

from pydantic import Field
from pydantic.v1 import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    GIGACHAT_CREDENTIALS: Optional[str] = Field(None, env="GIGACHAT_CREDENTIALS")

settings = Settings()