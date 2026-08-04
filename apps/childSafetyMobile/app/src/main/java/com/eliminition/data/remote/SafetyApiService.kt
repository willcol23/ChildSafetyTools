package com.eliminition.data.remote

import com.eliminition.models.ChildProfile
import com.eliminition.models.HeatmapOverlay
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

data class LocationEventPayload(
    val profileId: String,
    val location: LocationPayload,
    val timestamp: String,
    val activity_type: String? = null,
    val battery_level: Double? = null,
)

data class LocationPayload(
    val lat: Double,
    val lng: Double,
)

data class SecureMessagePayload(
    val id: String? = null,
    val senderId: String,
    val recipientId: String,
    val body: String,
    val timestamp: Long? = null,
    val isEncrypted: Boolean = true,
)

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
    suspend fun reportLocationEvent(@Body event: LocationEventPayload): Unit

    @POST("v1/communication/messages")
    suspend fun sendSecureMessage(@Body message: SecureMessagePayload): SecureMessagePayload
}
