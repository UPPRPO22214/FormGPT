from typing import Optional

from pydantic import BaseModel, Field


class MessageSchema(BaseModel):
    role: str
    content: str

    class Config:
        from_attributes = True
