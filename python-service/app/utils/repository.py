from abc import ABC, abstractmethod

from sqlalchemy import insert, select



class AbstractRepository(ABC):
    @abstractmethod
    async def add_one(self,data:dict):
        raise NotImplementedError

    @abstractmethod
    async def find_all(self):
        raise NotImplementedError
