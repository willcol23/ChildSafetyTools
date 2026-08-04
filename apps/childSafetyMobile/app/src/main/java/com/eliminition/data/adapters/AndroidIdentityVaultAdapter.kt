package com.eliminition.data.adapters

import com.eliminition.data.local.ChildProfileDao
import com.eliminition.data.local.ChildProfileEntity
import com.eliminition.domain.IdentityVaultPort
import com.eliminition.models.ChildProfile
import javax.inject.Inject

class AndroidIdentityVaultAdapter @Inject constructor(
    private val dao: ChildProfileDao
) : IdentityVaultPort {

    override suspend fun saveProfile(profile: ChildProfile): ChildProfile {
        val entity = ChildProfileEntity(
            id = profile.id ?: java.util.UUID.randomUUID().toString(),
            name = profile.name,
            dob = profile.dob,
            description = profile.description,
            metadataJson = null // Simplified for now
        )
        dao.insert(entity)
        return profile.copy(id = entity.id)
    }

    override suspend fun getProfile(profileId: String): ChildProfile? {
        return dao.getById(profileId)?.let {
            ChildProfile(
                id = it.id,
                name = it.name,
                dob = it.dob,
                description = it.description
            )
        }
    }

    override suspend fun listProfiles(): List<ChildProfile> {
        return dao.getAll().map {
            ChildProfile(
                id = it.id,
                name = it.name,
                dob = it.dob,
                description = it.description
            )
        }
    }

    override suspend fun deleteProfile(profileId: String) {
        dao.delete(profileId)
    }
}
