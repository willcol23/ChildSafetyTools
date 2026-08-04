from .domain import ChildProfile
from .ports import AttachmentStoragePort, EncryptionPort, IdentityVaultPort


class VaultService:
    def __init__(
        self,
        vault: IdentityVaultPort,
        storage: AttachmentStoragePort,
        encryption: EncryptionPort,
    ):
        self.vault = vault
        self.storage = storage
        self.encryption = encryption

    async def secure_save_profile(
        self, profile: ChildProfile, photo_data: bytes | None = None
    ) -> ChildProfile:
        # Encrypt sensitive fields
        profile.name = await self.encryption.encrypt(profile.name)

        if photo_data:
            photo_url = await self.storage.upload(
                f"photo_{profile.id}", photo_data, "image/jpeg"
            )
            # Update profile with attachment info (simplified)
            # profile.attachments.append(...)

        return await self.vault.save_profile(profile)

    async def get_decrypted_profile(self, profile_id: str) -> ChildProfile | None:
        profile = await self.vault.get_profile(profile_id)
        if profile:
            profile.name = await self.encryption.decrypt(profile.name)
        return profile
