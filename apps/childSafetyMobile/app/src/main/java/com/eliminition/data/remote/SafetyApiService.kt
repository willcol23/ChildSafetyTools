package com.eliminition.data.remote

import com.eliminition.models.ChildProfile
import com.eliminition.models.HeatmapOverlay
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface SafetyApiService {
    @GET("v1/vault/profiles")
    suspend fun listProfiles(): List<ChildProfile>

    @POST("v1/vault/profiles")
    suspend fun createProfile(@Body profile: ChildProfile): ChildProfile

    @GET("v1/vault/profiles/{id}")
    suspend fun getProfile(@Path("id") id: String): ChildProfile

    @GET("v1/heatmaps/overlay")
    suspend fun getHeatmapOverlay(
        @Query("city") city: String,
        @Query("state") state: String,
        @Query("radius_km") radiusKm: Double = 8.0,
        @Query("crime_type") crimeType: String = "all"
    ): HeatmapOverlay
}
