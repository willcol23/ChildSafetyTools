import os
from fastapi import APIRouter, Depends
from typing import List
from child_safety_core.domain import ChildProfile
from child_safety_core.adapters import MongoIdentityVaultAdapter
from child_safety_core.vault_service import VaultService

router = APIRouter(prefix="/v1/vault", tags=["vault"])

# In a real app, these would be managed by a DI container or dependency provider
def get_vault_service():
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    db_name = os.getenv("MONGODB_DB", "child_safety")
    
    # Mock storage and encryption for now
    class MockStorage:
        async def upload(self, name, data, content_type): return f"https://mock.storage/{name}"
        async def download(self, id): return b""
    
    class MockEncryption:
        async def encrypt(self, data): return f"enc_{data}"
        async def decrypt(self, data): return data.replace("enc_", "")

    vault_adapter = MongoIdentityVaultAdapter(mongo_uri, db_name)
    return VaultService(vault_adapter, MockStorage(), MockEncryption())

@router.get("/profiles", response_model=List[ChildProfile])
async def list_profiles(service: VaultService = Depends(get_vault_service)):
    return await service.vault.list_profiles()

@router.post("/profiles", response_model=ChildProfile)
async def create_profile(profile: ChildProfile, service: VaultService = Depends(get_vault_service)):
    return await service.secure_save_profile(profile)

@router.get("/profiles/{profileId}", response_model=ChildProfile)
async def get_profile(profileId: str, service: VaultService = Depends(get_vault_service)):
    return await service.get_decrypted_profile(profileId)
