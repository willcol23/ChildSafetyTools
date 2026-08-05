package com.eliminition.ui.messanger

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
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
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.eliminition.data.remote.SafetyApiService
import com.eliminition.data.remote.SecureMessagePayload
import kotlinx.coroutines.launch
import java.util.UUID


data class SecureMessage(
    val id: String,
    val senderId: String,
    val recipientId: String,
    val body: String,
    val timestamp: Long,
    val isEncrypted: Boolean = true,
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SecureMessengerScreen(
    api: SafetyApiService,
    initialMessages: List<SecureMessage> = emptyList(),
    onBack: () -> Unit = {},
) {
    var draft by remember { mutableStateOf("") }
    var messages by remember { mutableStateOf(initialMessages) }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Secure Messenger") })
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedTextField(
                value = draft,
                onValueChange = { draft = it },
                label = { Text("Message") },
                modifier = Modifier.fillMaxWidth()
            )

            Button(
                onClick = {
                    if (draft.isNotBlank()) {
                        val message = SecureMessage(
                            id = UUID.randomUUID().toString(),
                            senderId = "me",
                            recipientId = "trusted-contact",
                            body = draft.trim(),
                            timestamp = System.currentTimeMillis(),
                            isEncrypted = true,
                        )
                        messages = messages + message
                        draft = ""
                        val payload = SecureMessagePayload(
                            id = message.id,
                            senderId = message.senderId,
                            recipientId = message.recipientId,
                            body = message.body,
                            timestamp = message.timestamp,
                            isEncrypted = message.isEncrypted,
                        )
                        kotlinx.coroutines.GlobalScope.launch {
                            api.sendSecureMessage(payload)
                        }
                    }
                }
            ) {
                Text("Send")
            }

            Text(
                text = "Recent messages",
                style = MaterialTheme.typography.titleMedium
            )

            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(messages) { message ->
                    Column(
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(message.body)
                        Text(
                            text = "${message.senderId} • ${message.timestamp}",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
            }
        }
    }
}
