package com.eliminition.ui.activityTracker

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
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
import com.eliminition.data.remote.LocationEventPayload
import com.eliminition.data.remote.LocationPayload
import com.eliminition.data.remote.SafetyApiService

@Composable
fun ActivityTrackerScreen(api: SafetyApiService) {
    var profileId by remember { mutableStateOf("demo-profile") }
    var lat by remember { mutableStateOf("39.9612") }
    var lng by remember { mutableStateOf("-82.9988") }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Activity Tracker") }) }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Share a quick location update",
                fontSize = 24.sp
            )

            OutlinedTextField(
                value = profileId,
                onValueChange = { profileId = it },
                label = { Text("Profile ID") },
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = lat,
                onValueChange = { lat = it },
                label = { Text("Latitude") },
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = lng,
                onValueChange = { lng = it },
                label = { Text("Longitude") },
                modifier = Modifier.fillMaxWidth()
            )

            Button(
                onClick = {
                    val payload = LocationEventPayload(
                        profileId = profileId.ifBlank { "demo-profile" },
                        location = LocationPayload(
                            lat = lat.toDoubleOrNull() ?: 39.9612,
                            lng = lng.toDoubleOrNull() ?: -82.9988,
                        ),
                        timestamp = java.time.Instant.now().toString(),
                        activity_type = "walking",
                        battery_level = 85.0,
                    )
                    kotlinx.coroutines.GlobalScope.launch {
                        api.reportLocationEvent(payload)
                    }
                }
            ) {
                Text("Send update")
            }

            Text(
                text = "This uses the shared tracker endpoint from the mobile API contract.",
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}
