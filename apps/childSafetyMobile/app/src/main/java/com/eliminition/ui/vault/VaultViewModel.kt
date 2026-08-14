package com.eliminition.ui.vault

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.eliminition.data.SyncRepository
import com.eliminition.models.ChildProfile
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class VaultUiState(
    val profiles: List<ChildProfile> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class VaultViewModel @Inject constructor(
    private val repository: SyncRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(VaultUiState())
    val uiState: StateFlow<VaultUiState> = _uiState.asStateFlow()

    init {
        loadProfiles()
    }

    fun loadProfiles() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            try {
                val profiles = repository.listProfiles()
                _uiState.value = _uiState.value.copy(profiles = profiles, isLoading = false)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    errorMessage = "Failed to load profiles: ${e.localizedMessage}",
                    isLoading = false
                )
            }
        }
    }

    fun saveProfile(name: String, dob: String, description: String?) {
        if (name.isBlank() || dob.isBlank()) {
            _uiState.value = _uiState.value.copy(errorMessage = "Name and DOB are required")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            try {
                val profile = ChildProfile(
                    name = name,
                    dob = dob,
                    description = description
                )
                repository.saveProfile(profile)
                loadProfiles() // Refresh the list
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    errorMessage = "Failed to save profile: ${e.localizedMessage}",
                    isLoading = false
                )
            }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(errorMessage = null)
    }
}
