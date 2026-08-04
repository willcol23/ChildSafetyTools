package com.eliminition.ui.vault

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.eliminition.data.SyncRepository
import com.eliminition.models.ChildProfile

@Composable
fun VaultScreen(repository: SyncRepository) {
    var name by remember { mutableStateOf("") }
    var dob by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var profiles by remember { mutableStateOf<List<ChildProfile>>(emptyList()) }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Identity Vault") }) }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Name") },
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = dob,
                onValueChange = { dob = it },
                label = { Text("Date of birth") },
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("Description") },
                modifier = Modifier.fillMaxWidth()
            )

            Button(onClick = {
                val profile = ChildProfile(name = name, dob = dob, description = description)
                kotlinx.coroutines.GlobalScope.launch {
                    val saved = repository.saveProfile(profile)
                    profiles = listOf(saved) + profiles
                }
            }) {
                Text("Save profile")
            }

            Button(onClick = {
                kotlinx.coroutines.GlobalScope.launch {
                    profiles = repository.listProfiles()
                }
            }) {
                Text("Refresh")
            }

            Text("Stored profiles", fontSize = 24.sp)
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(profiles) { profile ->
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Text(profile.name, style = MaterialTheme.typography.titleMedium)
                        Text(profile.dob)
                        profile.description?.let { Text(it) }
                    }
                }
            }
        }
    }
}
