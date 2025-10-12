from sqlalchemy import Column, Integer, String, MetaData
from sqlalchemy.orm import declarative_base

db_metadata = MetaData()
Base = declarative_base(metadata=db_metadata)



