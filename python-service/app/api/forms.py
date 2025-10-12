from db.db import Base
from sqlalchemy.orm import mapped_column, Mapped


class Form(Base):
    __tablename__ = "forms"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str]
    description: Mapped[str]
