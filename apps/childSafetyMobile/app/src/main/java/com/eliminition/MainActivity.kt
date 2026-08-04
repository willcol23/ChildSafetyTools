package com.eliminition

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.eliminition.data.remote.SafetyApiService
import com.eliminition.ui.landing.LandingScreen
import com.eliminition.ui.map.ConfigScreen
import com.eliminition.ui.map.HeatmapScreen
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var safetyApi: SafetyApiService

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppNavigation(safetyApi)
                }
            }
        }
    }
}

@Composable
fun AppNavigation(api: SafetyApiService) {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = "landing") {
        composable("landing") {
            LandingScreen(
                onNavigateToVault = { /* TODO: Implement Vault UI */ },
                onNavigateToMap = { navController.navigate("map_config") },
                onNavigateToMessenger = {},
                onNavigateToTracker = {}
            )
        }
        composable("map_config") {
            ConfigScreen(
                onLaunchMap = { city ->
                    navController.navigate("map_view/$city")
                }
            )
        }
        composable("map_view/{city}") { backStackEntry ->
            val city = backStackEntry.arguments?.getString("city") ?: "Columbus, OH"
            HeatmapScreen(
                city = city,
                onBack = { navController.popBackStack() },
                api = api
            )
        }
    }
}
