package com.eliminition.data.remote

import com.eliminition.models.ChildProfile
import com.eliminition.models.HeatmapOverlay
import com.eliminition.models.LocationEvent
import com.eliminition.models.SecureMessage
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

    @GET("v1/vault/profiles/{profileId}")
    suspend fun getProfile(@Path("profileId") profileId: String): ChildProfile

    @GET("v1/heatmaps/overlay")
    suspend fun getHeatmapOverlay(
        @Query("city") city: String,
        @Query("state") state: String,
        @Query("radius_km") radiusKm: Double = 8.0,
        @Query("crime_type") crimeType: String = "all"
    ): HeatmapOverlay

    @POST("v1/tracker/events")
    suspend fun reportLocationEvent(@Body event: LocationEvent): Unit

    @POST("v1/communication/messages")
    suspend fun sendSecureMessage(@Body message: SecureMessage): SecureMessage
}
