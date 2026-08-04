package com.eliminition.data.remote

import com.eliminition.models.ChildProfile
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface SafetyApiService {
    @GET("v1/vault/profiles")
    suspend fun listProfiles(): List<ChildProfile>

    @POST("v1/vault/profiles")
    suspend fun createProfile(@Body profile: ChildProfile): ChildProfile

    @GET("v1/vault/profiles/{id}")
    suspend fun getProfile(@Path("id") id: String): ChildProfile
}
