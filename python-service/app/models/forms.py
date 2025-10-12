from sqlalchemy.orm import mapped_column, Mapped, relationship
from db.db import Base

class Form(Base):
    __tablename__ = "forms"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str]
    user_id: Mapped[int]
    questions: Mapped[int] = relationship("Question", back_populates="form")

    