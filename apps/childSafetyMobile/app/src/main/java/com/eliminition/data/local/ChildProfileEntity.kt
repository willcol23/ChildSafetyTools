package com.eliminition.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "child_profiles")
data class ChildProfileEntity(
    @PrimaryKey val id: String,
    val name: String,
    val dob: String,
    val description: String?,
    val metadataJson: String?
)
