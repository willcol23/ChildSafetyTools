package com.eliminition.data

import com.eliminition.data.remote.SafetyApiService
import com.eliminition.domain.IdentityVaultPort
import com.eliminition.models.ChildProfile
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SyncRepository @Inject constructor(
    private val localVault: IdentityVaultPort,
    private val remoteApi: SafetyApiService
) {
    suspend fun listProfiles(): List<ChildProfile> {
        // Try to fetch from remote first, then update local
        return try {
            val remoteProfiles = remoteApi.listProfiles()
            remoteProfiles.forEach { localVault.saveProfile(it) }
            remoteProfiles
        } catch (e: Exception) {
            // Fallback to local
            localVault.listProfiles()
        }
    }

    suspend fun saveProfile(profile: ChildProfile): ChildProfile {
        // Save locally first
        val savedLocal = localVault.saveProfile(profile)
        
        return try {
            val savedRemote = remoteApi.createProfile(savedLocal)
            // Update local with remote ID if needed
            localVault.saveProfile(savedRemote)
            savedRemote
        } catch (e: Exception) {
            // Keep local version, sync later
            savedLocal
        }
    }
}
