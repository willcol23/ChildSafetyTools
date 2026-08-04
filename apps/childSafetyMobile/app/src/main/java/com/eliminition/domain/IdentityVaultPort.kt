package com.eliminition.domain

import com.eliminition.models.ChildProfile

interface IdentityVaultPort {
    suspend fun saveProfile(profile: ChildProfile): ChildProfile
    suspend fun getProfile(profileId: String): ChildProfile?
    suspend fun listProfiles(): List<ChildProfile>
    suspend fun deleteProfile(profileId: String)
}
