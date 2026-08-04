package com.eliminition.data.local

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(entities = [ChildProfileEntity::class], version = 1)
abstract class EliminitionDatabase : RoomDatabase() {
    abstract fun childProfileDao(): ChildProfileDao
}
