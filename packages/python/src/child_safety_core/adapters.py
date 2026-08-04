import motor.motor_asyncio
from typing import List, Optional
from .domain import ChildProfile
from .ports import IdentityVaultPort

class MongoIdentityVaultAdapter(IdentityVaultPort):
    def __init__(self, connection_string: str, database_name: str):
        self.client = motor.motor_asyncio.AsyncIOMotorClient(connection_string)
        self.db = self.client[database_name]
        self.collection = self.db["profiles"]

    async def save_profile(self, profile: ChildProfile) -> ChildProfile:
        profile_dict = profile.model_dump()
        if profile.id:
            await self.collection.replace_one({"id": profile.id}, profile_dict, upsert=True)
        else:
            # Simple ID generation for demo
            import uuid
            profile_dict["id"] = str(uuid.uuid4())
            await self.collection.insert_one(profile_dict)
            profile.id = profile_dict["id"]
        return profile

    async def get_profile(self, profile_id: str) -> Optional[ChildProfile]:
        data = await self.collection.find_one({"id": profile_id})
        if data:
            return ChildProfile(**data)
        return None

    async def list_profiles(self) -> List[ChildProfile]:
        profiles = []
        async for data in self.collection.find():
            profiles.append(ChildProfile(**data))
        return profiles
