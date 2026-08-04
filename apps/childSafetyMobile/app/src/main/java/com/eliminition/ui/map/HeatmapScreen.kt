package com.eliminition.ui.map

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.eliminition.data.remote.SafetyApiService
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.*
import com.google.maps.android.heatmaps.HeatmapTileProvider
import com.google.maps.android.heatmaps.WeightedLatLng

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HeatmapScreen(
    city: String, 
    onBack: () -> Unit, 
    api: SafetyApiService
) {
    val context = LocalContext.current
    var loading by remember { mutableStateOf(true) }
    var center by remember { mutableStateOf(LatLng(39.9612, -82.9988)) }
    var points by remember { mutableStateOf<List<WeightedLatLng>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }
    var retry by remember { mutableIntStateOf(0) }
    
    val camera = rememberCameraPositionState { 
        position = CameraPosition.fromLatLngZoom(center, 11f) 
    }

    LaunchedEffect(city, retry) {
        loading = true
        error = null
        try {
            val parts = city.split(',', limit = 2)
            val cityName = parts.first().trim()
            val stateName = parts.getOrNull(1)?.trim().orEmpty().ifBlank { "OH" }
            
            val overlay = api.getHeatmapOverlay(cityName, stateName)
            center = LatLng(overlay.location.lat, overlay.location.lng)
            points = overlay.cells.map { 
                WeightedLatLng(LatLng(it.lat, it.lng), it.intensity * 10) 
            }
            camera.position = CameraPosition.fromLatLngZoom(center, 12f)
        } catch (e: Exception) {
            error = "Unable to load safety-map data. ${e.message}"
            points = emptyList()
        } finally {
            loading = false
        }
    }

    Scaffold(
        topBar = { 
            TopAppBar(
                title = { Text("Safety Map: $city") }, 
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, "Back") }
                }, 
                actions = {
                    IconButton(onClick = { 
                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("geo:0,0?q=${Uri.encode(city)}"))) 
                    }) { Icon(Icons.Default.Map, "Open in Maps") }
                    IconButton(onClick = { retry++ }) { Icon(Icons.Default.Refresh, "Retry") }
                }
            ) 
        }
    ) { padding ->
        Box(Modifier.padding(padding).fillMaxSize()) {
            GoogleMap(
                modifier = Modifier.fillMaxSize(), 
                cameraPositionState = camera
            ) {
                if (points.isNotEmpty()) {
                    TileOverlay(
                        HeatmapTileProvider.Builder()
                            .weightedData(points)
                            .radius(50)
                            .build()
                    )
                }
            }
            
            if (loading) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { 
                    CircularProgressIndicator() 
                }
            }
            
            error?.let { 
                Card(Modifier.align(Alignment.BottomCenter).padding(16.dp)) { 
                    Text(it, Modifier.padding(16.dp), textAlign = TextAlign.Center) 
                } 
            }
        }
    }
}
