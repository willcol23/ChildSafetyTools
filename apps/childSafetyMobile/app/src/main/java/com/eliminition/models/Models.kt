package com.eliminition.models

data class Location(
    val lat: Double,
    val lng: Double
)

data class HeatmapCell(
    val lat: Double,
    val lng: Double,
    val intensity: Double,
    val count: Int,
    val crime_types: List<String> = emptyList()
)

data class HeatmapOverlay(
    val location: Location,
    val radius_km: Double,
    val cell_count: Int,
    val cells: List<HeatmapCell>
)

data class Attachment(
    val id: String,
    val name: String,
    val content_type: String,
    val url: String? = null
)

data class ChildProfile(
    val id: String? = null,
    val name: String,
    val dob: String,
    val description: String? = null,
    val attachments: List<Attachment> = emptyList(),
    val metadata: Map<String, Any?> = emptyMap()
)
