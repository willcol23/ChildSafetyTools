package com.eliminition.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface ChildProfileDao {
    @Query("SELECT * FROM child_profiles")
    suspend fun getAll(): List<ChildProfileEntity>

    @Query("SELECT * FROM child_profiles WHERE id = :id")
    suspend fun getById(id: String): ChildProfileEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(profile: ChildProfileEntity)

    @Query("DELETE FROM child_profiles WHERE id = :id")
    suspend fun delete(id: String)
}
