from sqlalchemy import text

from models import db_metadata
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from config import get_db_url

db_engine = create_async_engine(url=get_db_url(), echo=True)
async_session_maker = async_sessionmaker(db_engine, expire_on_commit=False)

__all__ = ["create_tables", "close_connections", "delete_tables"]


async def create_tables() -> None:
    async with db_engine.begin() as connection:
        await connection.execution_options(isolation_level="AUTOCOMMIT").execute(
            text(f"CREATE DATABASE IF NOT EXISTS {'formgpt_db'}")
        )
        await connection.run_sync(db_metadata.create_all)


async def close_connections():
    await db_engine.dispose()


async def delete_tables() -> None:
    async with db_engine.begin() as connection:
        await connection.run_sync(db_metadata.drop_all)
