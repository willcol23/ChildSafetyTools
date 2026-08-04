package com.eliminition.di

import android.content.Context
import androidx.room.Room
import com.eliminition.data.adapters.AndroidIdentityVaultAdapter
import com.eliminition.data.local.ChildProfileDao
import com.eliminition.data.local.EliminitionDatabase
import com.eliminition.domain.IdentityVaultPort
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): EliminitionDatabase {
        return Room.databaseBuilder(
            context,
            EliminitionDatabase::class.java,
            "eliminition_db"
        ).build()
    }

    @Provides
    fun provideChildProfileDao(db: EliminitionDatabase): ChildProfileDao {
        return db.childProfileDao()
    }
}

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    @Binds
    @Singleton
    abstract fun bindIdentityVaultPort(
        adapter: AndroidIdentityVaultAdapter
    ): IdentityVaultPort
}

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides
    @Singleton
    fun provideRetrofit(): retrofit2.Retrofit {
        return retrofit2.Retrofit.Builder()
            .baseUrl("http://10.0.2.2:8000/") // Localhost for Android Emulator
            .addConverterFactory(retrofit2.converter.gson.GsonConverterFactory.create())
            .build()
    }

    @Provides
    @Singleton
    fun provideSafetyApiService(retrofit: retrofit2.Retrofit): com.eliminition.data.remote.SafetyApiService {
        return retrofit.create(com.eliminition.data.remote.SafetyApiService::class.java)
    }
}
