package com.example.dinotamagotchi

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.input.pointer.PointerInputChange
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.*

// Food Definitions
data class FoodItem(
    val id: String,
    val name: String,
    val emoji: String,
    val hungerBoost: Float,
    val happinessBoost: Float,
    val hygieneImpact: Float,
    val energyImpact: Float,
    val cost: Int
)

val FOOD_ITEMS = listOf(
    FoodItem("steak", "Juicy Steak", "🥩", 30f, 5f, -15f, 10f, 0),
    FoodItem("broccoli", "Fresh Broccoli", "🥦", 15f, -5f, 10f, 5f, 0),
    FoodItem("cupcake", "Sweet Cupcake", "🧁", 20f, 25f, -10f, -5f, 8),
    FoodItem("potion", "Super Vitamin", "🧪", 10f, 10f, 5f, 20f, 15),
    FoodItem("golden_meat", "Golden Cutlet", "🍖", 50f, 35f, 25f, 30f, 30)
)

// Accessory Definitions
data class AccessoryItem(
    val id: String,
    val name: String,
    val cost: Int,
    val emoji: String,
    val description: String
)

val SHOP_ACCESSORIES = listOf(
    AccessoryItem("pirate_hat", "Pirate Hat", 40, "🏴‍☠️", "Nautical captain crown"),
    AccessoryItem("crown", "Royal Crown", 100, "👑", "Golden monarch sovereign"),
    AccessoryItem("chef_hat", "Chef Hat", 25, "👨‍🍳", "Master prehistoric chef cap"),
    AccessoryItem("sunglasses", "Cool Glasses", 35, "😎", "Chill retro ultraviolet-specs"),
    AccessoryItem("pixel_glasses", "Meme Glasses", 60, "🕶️", "Crypto deal-with-it shades"),
    AccessoryItem("cute_bow", "Red bow tie", 20, "🎀", "Fancy crimson fashion item")
)

// Simulation settings
enum class GameSpeed { Normal, Fast, Sonic }
enum class Scenery { VALLEY, VOLCANO, GLACIER, NIGHT }

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme(
                    primary = Color(0xFF10B981),
                    secondary = Color(0xFF3B82F6),
                    background = Color(0xFF030712)
                )
            ) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MainScreen()
                }
            }
        }
    }
}

@OptIn(ExperimentalAnimationApi::class)
@Composable
fun MainScreen() {
    val context = LocalContext.current
    val sharedPrefs = remember { context.getSharedPreferences("DinoSaveState", Context.MODE_PRIVATE) }
    val scope = rememberCoroutineScope()

    // -------------------------------------------------------------
    // ALL CORE VIRTUAL PET STATES
    // -------------------------------------------------------------
    var dinoName by remember { mutableStateOf(sharedPrefs.getString("name", "") ?: "") }
    var dinoColorHex by remember { mutableStateOf(sharedPrefs.getString("colorHex", "#10B981") ?: "#10B981") }
    var stage by remember { mutableStateOf(sharedPrefs.getString("stage", "Egg") ?: "Egg") }
    var species by remember { mutableStateOf(sharedPrefs.getString("species", "") ?: "") }
    var age by remember { mutableStateOf(sharedPrefs.getInt("age", 0)) }
    var health by remember { mutableStateOf(sharedPrefs.getFloat("health", 100f)) }
    var hunger by remember { mutableStateOf(sharedPrefs.getFloat("hunger", 50f)) }
    var happiness by remember { mutableStateOf(sharedPrefs.getFloat("happiness", 50f)) }
    var hygiene by remember { mutableStateOf(sharedPrefs.getFloat("hygiene", 80f)) }
    var energy by remember { mutableStateOf(sharedPrefs.getFloat("energy", 60f)) }
    var isSleeping by remember { mutableStateOf(sharedPrefs.getBoolean("isSleeping", false)) }
    var isSick by remember { mutableStateOf(sharedPrefs.getBoolean("isSick", false)) }
    var coins by remember { mutableStateOf(sharedPrefs.getInt("coins", 150)) }
    var activeAccessory by remember { mutableStateOf(sharedPrefs.getString("activeAccessory", null)) }
    var careXP by remember { mutableStateOf(sharedPrefs.getFloat("careXP", 0f)) }
    var steakCount by remember { mutableStateOf(sharedPrefs.getInt("steakCount", 0)) }
    var vegCount by remember { mutableStateOf(sharedPrefs.getInt("vegCount", 0)) }
    var eggTaps by remember { mutableStateOf(sharedPrefs.getInt("eggTaps", 0)) }

    // List of poops offsets on playground floor
    val poopsList = remember { mutableStateListOf<Offset>() }
    // Initialize poops list safely
    LaunchedEffect(Unit) {
        val count = sharedPrefs.getInt("poopCount", 0)
        poopsList.clear()
        for (i in 0 until count) {
            val px = sharedPrefs.getFloat("poopX_$i", 100f + (0..300).random())
            val py = sharedPrefs.getFloat("poopY_$i", 350f + (0..50).random())
            poopsList.add(Offset(px, py))
        }
    }

    // List of owned accessories list
    val unlockedAccessories = remember {
        mutableStateListOf<String>().apply {
            val savedList = sharedPrefs.getStringSet("unlockedAccessories", null)
            if (savedList != null) {
                addAll(savedList)
            }
        }
    }

    // Interactive settings states
    var activeApp by remember { mutableStateOf("pet") } // launcher, pet, arcade_runner, arcade_catcher, list, info
    var activeTab by remember { mutableStateOf("home") } // status, feed, groom, shop, codex
    var soundMuted by remember { mutableStateOf(false) }
    var speedSetting by remember { mutableStateOf(GameSpeed.Normal) }
    var currentScenery by remember { mutableStateOf(Scenery.VALLEY) }
    var screenBrightness by remember { mutableStateOf(100) } // percentage
    var tabletTime by remember { mutableStateOf("08:00 AM") }

    // Floating bubble particles for scrubbing
    val bubbleList = remember { mutableStateListOf<Offset>() }

    // State persistence helper function
    fun saveDinoState() {
        val editor = sharedPrefs.edit()
        editor.putString("name", dinoName)
        editor.putString("colorHex", dinoColorHex)
        editor.putString("stage", stage)
        editor.putString("species", species)
        editor.putInt("age", age)
        editor.putFloat("health", health)
        editor.putFloat("hunger", hunger)
        editor.putFloat("happiness", happiness)
        editor.putFloat("hygiene", hygiene)
        editor.putFloat("energy", energy)
        editor.putBoolean("isSleeping", isSleeping)
        editor.putBoolean("isSick", isSick)
        editor.putInt("coins", coins)
        editor.putString("activeAccessory", activeAccessory)
        editor.putFloat("careXP", careXP)
        editor.putInt("steakCount", steakCount)
        editor.putInt("vegCount", vegCount)
        editor.putInt("eggTaps", eggTaps)
        editor.putInt("poopCount", poopsList.size)
        poopsList.forEachIndexed { idx, offset ->
            editor.putFloat("poopX_$idx", offset.x)
            editor.putFloat("poopY_$idx", offset.y)
        }
        editor.putStringSet("unlockedAccessories", unlockedAccessories.toSet())
        editor.apply()
    }

    // Auto backup intervals
    LaunchedEffect(
        dinoName, stage, species, age, health, hunger, happiness, hygiene, energy,
        isSleeping, isSick, coins, activeAccessory, careXP, steakCount, vegCount, eggTaps, poopsList.size
    ) {
        saveDinoState()
    }

    // System status clock updater
    LaunchedEffect(Unit) {
        while (true) {
            val now = Date()
            val format = SimpleDateFormat("hh:mm a", Locale.getDefault())
            tabletTime = format.format(now)
            delay(15000)
        }
    }

    // -------------------------------------------------------------
    // SIMULATION COMPANION GAME LOOP TICKER
    // -------------------------------------------------------------
    LaunchedEffect(stage, isSleeping, speedSetting) {
        if (stage == "Egg" || health <= 0f) return@LaunchedEffect

        while (true) {
            val tickRate = when (speedSetting) {
                GameSpeed.Normal -> 4000L
                GameSpeed.Fast -> 1500L
                GameSpeed.Sonic -> 400L
            }
            delay(tickRate)

            // Quantified simulation increments helper
            val decayMultiplier = if (isSleeping) 0.2f else 1.0f
            val hungerDecay = -1.2f * decayMultiplier
            val happyDecay = -1.0f * decayMultiplier
            val hygieneDecay = -0.9f * decayMultiplier
            val energyDelta = if (isSleeping) 4.0f else -0.8f

            // Factor poop hygiene impact
            val poopPenalty = poopsList.size * 0.8f

            val nextHunger = maxOf(0f, minOf(100f, hunger + hungerDecay))
            val nextHappy = maxOf(0f, minOf(100f, happiness + happyDecay))
            val nextHygiene = maxOf(0f, minOf(100f, hygiene + hygieneDecay - poopPenalty))
            val nextEnergy = maxOf(0f, minOf(100f, energy + energyDelta))

            // Disease engine
            var nextSick = isSick
            if (!nextSick && stage != "Egg") {
                val illnessProbability = (100f - nextHunger) * 0.05f + (100f - nextHygiene) * 0.08f
                if ((1..100).random() < illnessProbability && (1..100).random() > 96) {
                    nextSick = true
                    SoundEffects.hurt()
                }
            }

            // Health changes
            var nextHealth = health
            if (nextHunger <= 0f || nextHygiene <= 15f || nextEnergy <= 5f || nextSick) {
                var hit = 0f
                if (nextHunger <= 0f) hit += 4f
                if (nextHygiene <= 15f) hit += 2f
                if (nextEnergy <= 5f) hit += 1f
                if (nextSick) hit += 3f
                nextHealth = maxOf(0f, health - hit)
            } else {
                if (nextHunger > 50f && nextHygiene > 50f && nextEnergy > 30f) {
                    nextHealth = minOf(100f, health + 2f)
                }
            }

            // Care quality & progression
            val pristineCare = nextHunger > 50f && nextHappy > 50f && nextHygiene > 50f
            var nextXP = careXP
            var nextStage = stage
            var nextSpecies = species
            var nextAge = age

            if (pristineCare) {
                val gain = when (speedSetting) {
                    GameSpeed.Normal -> 2f
                    GameSpeed.Fast -> 5f
                    GameSpeed.Sonic -> 10f
                }
                nextXP = minOf(100f, careXP + gain)
            } else if (nextHunger < 20f || nextHappy < 20f || nextHygiene < 20f) {
                nextXP = maxOf(0f, careXP - 1f)
            }

            // Evolution milestone limits
            if (nextXP >= 100f) {
                if (nextStage == "Baby") {
                    nextStage = "Teen"
                    nextXP = 0f
                    nextAge += 1
                    SoundEffects.levelUp()
                } else if (nextStage == "Teen") {
                    nextStage = "Adult"
                    nextXP = 100f // maxed
                    nextAge += 2
                    SoundEffects.levelUp()

                    // Diet branches
                    nextSpecies = when {
                        unlockedAccessories.size >= 4 -> "Secret Dragon"
                        steakCount > vegCount -> "T-Rex"
                        vegCount > steakCount -> "Triceratops"
                        else -> "Pterodactyl"
                    }
                }
            }

            // Slowly increment age in normal speeds
            if (Math.random() > 0.985) {
                nextAge += 1
            }

            // Random poop drop
            if (nextHygiene < 45f && poopsList.size < 5 && Math.random() > 0.94 && !isSleeping) {
                poopsList.add(Offset(100f + (0..300).random(), 350f + (0..50).random()))
            }

            // Auto daily allowance
            var reward = 0
            if (Math.random() > 0.982 && nextHealth > 20f) {
                reward = 15 + if (nextHappy > 75f) 5 else 0
            }

            // Commit parameters safely
            hunger = nextHunger
            happiness = nextHappy
            hygiene = nextHygiene
            energy = nextEnergy
            isSick = nextSick
            health = nextHealth
            careXP = nextXP
            stage = nextStage
            species = nextSpecies
            age = nextAge
            coins += reward
        }
    }

    // Synchronize mute status to player bleep generator
    LaunchedEffect(soundMuted) {
        SoundEffects.setMuted(soundMuted)
    }

    // Scenery helper mapping
    val sceneryBrush = when (currentScenery) {
        Scenery.VALLEY -> Brush.verticalGradient(listOf(Color(0xFF60A5FA), Color(0xFF10B981)))
        Scenery.VOLCANO -> Brush.verticalGradient(listOf(Color(0xFFF97316), Color(0xFF7C2D12)))
        Scenery.GLACIER -> Brush.verticalGradient(listOf(Color(0xFF0EA5E9), Color(0xFFE2E8F0)))
        Scenery.NIGHT -> Brush.verticalGradient(listOf(Color(0xFF1E1B4B), Color(0xFF030712)))
    }

    // Brightness offset overlay
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        // Core android desktop shell layout
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFF111827))
                .padding(2.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Android top native-style status panel
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.Black)
                    .padding(horizontal = 14.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Tablet Time & Day counter
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = tabletTime,
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Day $age",
                        color = Color(0xFF4ADE80),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    if (isSick) {
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "🤒 Sick!",
                            color = Color(0xFFEF4444),
                            fontSize = 9.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.animateContentSize()
                        )
                    }
                }

                // Wireless connection, volume state, battery
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(
                        imageVector = if (soundMuted) Icons.Default.VolumeOff else Icons.Default.VolumeUp,
                        contentDescription = "Muted state indicator",
                        tint = if (soundMuted) Color(0xFFEF4444) else Color(0xFF4ADE80),
                        modifier = Modifier.size(13.dp)
                    )
                    Text(
                        text = "🔋 ${energy.toInt()}%",
                        color = if (energy < 20f) Color(0xFFEF4444) else Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "🪙 $coins",
                        color = Color(0xFFFBBF24),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                }
            }

            // -------------------------------------------------------------
            // SCREEN APP CONTENTS ROUTER SWITCHER
            // -------------------------------------------------------------
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .weight(1f)
                    .background(Color(0xFF151D2A))
            ) {

                when (activeApp) {
                    // Application 1: Prehistoric Care Center
                    "pet" -> {
                        Column(modifier = Modifier.fillMaxSize()) {
                            
                            // Habitat background canvas container (Top half of the simulation screen)
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(240.dp)
                                    .background(sceneryBrush)
                                    .pointerInput(Unit) {
                                        // Click to clean individual poop if present or waken/tap egg
                                        detectTapGestures { offset: Offset ->
                                            if (stage == "Egg") {
                                                eggTaps = minOf(10, eggTaps + 1)
                                                SoundEffects.click()
                                                if (eggTaps >= 10) {
                                                    SoundEffects.hatch()
                                                    stage = "Baby"
                                                    dinoName = "Roary"
                                                }
                                            } else {
                                                // Groom station click or Poop cleaning sweeps!
                                                var hitIdx = -1
                                                for (i in poopsList.indices) {
                                                    val dist = (poopsList[i] - offset).getDistance()
                                                    if (dist < 80f) {
                                                        hitIdx = i
                                                        break
                                                    }
                                                }
                                                if (hitIdx != -1) {
                                                    poopsList.removeAt(hitIdx)
                                                    hygiene = minOf(100f, hygiene + 15f)
                                                    coins += 6
                                                    SoundEffects.success()
                                                } else {
                                                    // Floating tap spark particles on Roary
                                                    SoundEffects.click()
                                                    happiness = minOf(100f, happiness + 2f)
                                                }
                                            }
                                        }
                                    }
                            ) {
                                // Scenery contextual elements
                                when (currentScenery) {
                                    Scenery.VOLCANO -> {
                                        Text("🌋", fontSize = 50.sp, modifier = Modifier.align(Alignment.BottomStart).offset(30.dp, (-20).dp))
                                        Text("🔥", fontSize = 20.sp, modifier = Modifier.align(Alignment.BottomEnd).offset((-40).dp, (-30).dp))
                                    }
                                    Scenery.GLACIER -> {
                                        Text("❄️", fontSize = 40.sp, modifier = Modifier.align(Alignment.TopEnd).offset((-20).dp, 20.dp))
                                        Text("🏔️", fontSize = 60.sp, modifier = Modifier.align(Alignment.BottomEnd).offset((-10).dp, (-15).dp))
                                    }
                                    Scenery.NIGHT -> {
                                        Text("🌙", fontSize = 35.sp, modifier = Modifier.align(Alignment.TopStart).offset(30.dp, 20.dp))
                                        Text("💫", fontSize = 20.sp, modifier = Modifier.align(Alignment.TopEnd).offset((-50).dp, 40.dp))
                                    }
                                    Scenery.VALLEY -> {
                                        Text("🌤️", fontSize = 40.sp, modifier = Modifier.align(Alignment.TopStart).offset(25.dp, 15.dp))
                                        Text("🌳", fontSize = 50.sp, modifier = Modifier.align(Alignment.BottomEnd).offset((-30).dp, (-10).dp))
                                    }
                                }

                                // Render Poops
                                poopsList.forEach { point ->
                                    Text(
                                        text = "💩",
                                        fontSize = 25.sp,
                                        modifier = Modifier.offset(point.x.dp, point.y.dp)
                                    )
                                }

                                // Interactive Dino Sprite Center Stage
                                val color = try { Color(android.graphics.Color.parseColor(dinoColorHex)) } catch (e: Exception) { Color(0xFF10B981) }
                                Box(
                                    modifier = Modifier
                                        .size(130.dp)
                                        .align(Alignment.Center)
                                        .padding(10.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    if (stage == "Egg") {
                                        // Interactive Hatching Egg
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            Text(
                                                text = "🥚",
                                                fontSize = 65.sp,
                                                textAlign = TextAlign.Center,
                                                modifier = Modifier.bounceAnimation(eggTaps)
                                            )
                                            Spacer(modifier = Modifier.height(6.dp))
                                            Text(
                                                text = "TAP TO HATCH (${10 - eggTaps} Taps left)",
                                                color = Color.White,
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold,
                                                modifier = Modifier.background(Color.Black.copy(0.6f), RoundedCornerShape(8.dp)).padding(horizontal = 8.dp, vertical = 2.dp)
                                            )
                                        }
                                    } else {
                                        // Living animated pet
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            // Accessory rendering layout layers overlay
                                            Box(contentAlignment = Alignment.Center, modifier = Modifier.size(90.dp)) {
                                                
                                                // Standard Canvas compiled drawing vector based of Roary
                                                Canvas(modifier = Modifier.fillMaxSize()) {
                                                    drawLivingDinoGraphic(stage, species, color, isSleeping, isSick)
                                                }

                                                // Accessories on top
                                                if (activeAccessory != null) {
                                                    val emoji = SHOP_ACCESSORIES.find { it.id == activeAccessory }?.emoji ?: ""
                                                    Text(
                                                        text = emoji,
                                                        fontSize = 32.sp,
                                                        modifier = Modifier
                                                            .align(Alignment.TopCenter)
                                                            .offset(y = (-14).dp)
                                                    )
                                                }

                                                // State Indicators Zzz or tears
                                                if (isSleeping) {
                                                    Text(
                                                        text = "💤",
                                                        fontSize = 18.sp,
                                                        modifier = Modifier
                                                            .align(Alignment.TopEnd)
                                                            .offset(15.dp, (-8).dp)
                                                    )
                                                } else if (isSick) {
                                                    Text(
                                                        text = "🤒",
                                                        fontSize = 16.sp,
                                                        modifier = Modifier
                                                            .align(Alignment.TopStart)
                                                            .offset((-15).dp, 5.dp)
                                                    )
                                                }
                                            }

                                            Spacer(modifier = Modifier.height(4.dp))
                                            Text(
                                                text = "$dinoName the $stage",
                                                color = Color.White,
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Black,
                                                modifier = Modifier
                                                    .background(Color.Black.copy(alpha = 0.5f), RoundedCornerShape(6.dp))
                                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                                            )
                                        }
                                    }
                                }

                                // Overlay text notifying dirty or low conditions
                                if (stage != "Egg") {
                                    Column(
                                        modifier = Modifier
                                            .align(Alignment.TopEnd)
                                            .padding(10.dp),
                                        horizontalAlignment = Alignment.End
                                    ) {
                                        if (hunger < 25f) Badge(containerColor = Color(0xFFFF5252)) { Text("Starving!", color = Color.White) }
                                        if (hygiene < 30f) Badge(containerColor = Color(0xFFE91E63)) { Text("Dirty! 🧼", color = Color.White) }
                                    }
                                }
                            }

                            // Interactive control HUD (Bottom half of screen)
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color(0xFF0F172A))
                                    .padding(4.dp),
                                horizontalArrangement = Arrangement.SpaceEvenly
                            ) {
                                @Composable
                                fun tabBtn(name: String, icon: @Composable () -> Unit, target: String) {
                                    Column(
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        modifier = Modifier
                                            .clickable {
                                                SoundEffects.click()
                                                activeTab = target
                                            }
                                            .padding(8.dp)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(36.dp)
                                                .background(
                                                    if (activeTab == target) Color(0xFF10B981) else Color(0x3364748B),
                                                    CircleShape
                                                ),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            icon()
                                        }
                                        Text(name, fontSize = 9.sp, color = if (activeTab == target) Color(0xFF10B981) else Color.LightGray, fontWeight = FontWeight.Bold)
                                    }
                                }

                                tabBtn("STATUS", { Icon(Icons.Default.MonitorHeart, "Health Status Screen", Modifier.size(18.dp)) }, "home")
                                tabBtn("FEED", { Icon(Icons.Default.Restaurant, "Feed Dino Station", Modifier.size(18.dp)) }, "feed")
                                tabBtn("GROOM", { Icon(Icons.Default.Soap, "Clean Bath Station", Modifier.size(18.dp)) }, "groom")
                                tabBtn("SHOP", { Icon(Icons.Default.Storefront, "Accessory Boutique", Modifier.size(18.dp)) }, "shop")
                                tabBtn("CODEX", { Icon(Icons.Default.MenuBook, "Dino Lore Handbook", Modifier.size(18.dp)) }, "codex")
                            }

                            // Active tab views drawer panels
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .weight(1f)
                                    .background(Color(0xFF0B1329))
                                    .padding(10.dp)
                            ) {
                                when (activeTab) {
                                    "home" -> {
                                        // STATUS METER STATS VIEW
                                        Column(
                                            modifier = Modifier.fillMaxWidth().verticalScroll(rememberScrollState()),
                                            verticalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            if (stage == "Egg") {
                                                Text(
                                                    "Wait forRoary to hatch! Crack the outer eggshell above by tapping! Perfect companion hatching is incoming.",
                                                    color = Color.LightGray,
                                                    fontSize = 12.sp,
                                                    textAlign = TextAlign.Center,
                                                    modifier = Modifier.padding(16.dp)
                                                )
                                            } else {
                                                StatProgressBar(label = "Health", value = health / 100f, color = Color(0xFF10B981))
                                                StatProgressBar(label = "Hunger", value = hunger / 100f, color = Color(0xFFFBBF24))
                                                StatProgressBar(label = "Happiness", value = happiness / 100f, color = Color(0xFFEC4899))
                                                StatProgressBar(label = "Hygiene", value = hygiene / 100f, color = Color(0xFF06B6D4))
                                                StatProgressBar(label = "Energy", value = energy / 100f, color = Color(0xFF3B82F6))
                                                Spacer(modifier = Modifier.height(4.dp))
                                                StatProgressBar(label = "Growth Progress (Care XP)", value = careXP / 100f, color = Color(0xFFA855F7))

                                                Spacer(modifier = Modifier.height(8.dp))

                                                // Quick action medicine buttons or sleep toggle
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                                ) {
                                                    Button(
                                                        onClick = {
                                                            isSleeping = !isSleeping
                                                            SoundEffects.click()
                                                        },
                                                        modifier = Modifier.weight(1f),
                                                        colors = ButtonDefaults.buttonColors(
                                                            containerColor = if (isSleeping) Color(0xFFFBBF24) else Color(0xFF3B82F6)
                                                        )
                                                    ) {
                                                        Text(if (isSleeping) "☀️ Wake Companion" else "💤 Sleep Nap")
                                                    }

                                                    if (isSick) {
                                                        Button(
                                                            onClick = {
                                                                if (coins >= 10) {
                                                                    coins -= 10
                                                                    isSick = false
                                                                    health = minOf(100f, health + 25f)
                                                                    SoundEffects.success()
                                                                } else {
                                                                    SoundEffects.hurt()
                                                                }
                                                            },
                                                            modifier = Modifier.weight(1f),
                                                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444))
                                                        ) {
                                                            Text("💊 Give Med (10🪙)")
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    "feed" -> {
                                        // FEED ITEMS DRAWER PANEL
                                        if (isSleeping) {
                                            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                                Text("Roary is currently snoring! Wake them up to eat.", color = Color.Gray, fontSize = 13.sp)
                                            }
                                        } else {
                                            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                                Text("COMPANION DIETARY KIOSK", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                                Spacer(modifier = Modifier.height(4.dp))
                                                Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
                                                    FOOD_ITEMS.forEach { food ->
                                                        Row(
                                                            modifier = Modifier
                                                                .fillMaxWidth()
                                                                .padding(vertical = 4.dp)
                                                                .background(Color(0xFF1E293B), RoundedCornerShape(12.dp))
                                                                .clickable {
                                                                    if (coins >= food.cost) {
                                                                        coins -= food.cost
                                                                        hunger = minOf(100f, hunger + food.hungerBoost)
                                                                        happiness = minOf(100f, happiness + food.happinessBoost)
                                                                        hygiene = maxOf(0f, hygiene + food.hygieneImpact)
                                                                        energy = minOf(100f, energy + food.energyImpact)
                                                                        SoundEffects.eat()
                                                                        if (food.id == "steak") steakCount++
                                                                        if (food.id == "broccoli") vegCount++
                                                                    } else {
                                                                        SoundEffects.hurt()
                                                                    }
                                                                }
                                                                .padding(10.dp),
                                                            horizontalArrangement = Arrangement.SpaceBetween,
                                                            verticalAlignment = Alignment.CenterVertically
                                                        ) {
                                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                                Text(food.emoji, fontSize = 24.sp)
                                                                Spacer(modifier = Modifier.width(8.dp))
                                                                Column {
                                                                    Text(food.name, color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                                                    Text(
                                                                        "Hunger +${food.hungerBoost.toInt()} • Happiness +${food.happinessBoost.toInt()}",
                                                                        color = Color.LightGray,
                                                                        fontSize = 10.sp
                                                                    )
                                                                }
                                                            }
                                                            Text(
                                                                text = if (food.cost == 0) "FREE" else "${food.cost}🪙",
                                                                color = Color(0xFFFBBF24),
                                                                fontSize = 12.sp,
                                                                fontWeight = FontWeight.ExtraBold
                                                            )
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    "groom" -> {
                                        // SCRUB GROOM STATION SCREEN
                                        Column(
                                            modifier = Modifier
                                                .fillMaxSize()
                                                .background(Color(0xFF1E293B), RoundedCornerShape(16.dp))
                                                .pointerInput(Unit) {
                                                    detectDragGestures { change: PointerInputChange, _ ->
                                                        change.consume()
                                                        // Bubble spawners on dragging cursor
                                                        if (bubbleList.size < 40 && Math.random() > 0.4) {
                                                            bubbleList.add(change.position)
                                                            hygiene = minOf(100f, hygiene + 0.35f)
                                                            happiness = minOf(100f, happiness + 0.15f)
                                                        }
                                                    }
                                                },
                                            horizontalAlignment = Alignment.CenterHorizontally,
                                            verticalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Box(modifier = Modifier.fillMaxWidth().weight(1f)) {
                                                Canvas(modifier = Modifier.fillMaxSize()) {
                                                    bubbleList.forEach { point ->
                                                        drawCircle(
                                                            color = Color(0x66AFE6FF),
                                                            radius = (6..18).random().toFloat(),
                                                            center = point
                                                        )
                                                    }
                                                }

                                                Column(
                                                    modifier = Modifier.align(Alignment.Center).padding(16.dp),
                                                    horizontalAlignment = Alignment.CenterHorizontally
                                                ) {
                                                    Text("🧼 WASH BUBBLE BATH", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 14.sp)
                                                    Text("Wipe and scrub the screen around to clean Roary!", color = Color.LightGray, fontSize = 10.sp, textAlign = TextAlign.Center)
                                                    Spacer(modifier = Modifier.height(10.dp))
                                                    Text("🛁", fontSize = 48.sp)
                                                }
                                            }

                                            // Sweep off all bubbles button
                                            Button(
                                                onClick = {
                                                    bubbleList.clear()
                                                    SoundEffects.success()
                                                },
                                                modifier = Modifier.padding(10.dp)
                                            ) {
                                                Text("Clean up Bubbles")
                                            }

                                            // Auto lift off bubbles slowly over time
                                            LaunchedEffect(bubbleList.size) {
                                                while (bubbleList.isNotEmpty()) {
                                                    delay(100)
                                                    for (i in bubbleList.indices) {
                                                        if (i < bubbleList.size) {
                                                            val b = bubbleList[i]
                                                            bubbleList[i] = Offset(b.x, b.y - 12f)
                                                        }
                                                    }
                                                    bubbleList.removeAll { it.y < -30f }
                                                }
                                            }
                                        }
                                    }

                                    "shop" -> {
                                        // SHOP ACCESSORIES DRAWER PANEL
                                        Column {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text("ACCESSORY BOUTIQUE", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                                if (activeAccessory != null) {
                                                    TextButton(onClick = { activeAccessory = null }) {
                                                        Text("Remove Accessory", color = Color(0xFFFF5252))
                                                    }
                                                }
                                            }
                                            Spacer(modifier = Modifier.height(4.dp))
                                            LazyVerticalGrid(
                                                columns = GridCells.Fixed(2),
                                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                                verticalArrangement = Arrangement.spacedBy(8.dp)
                                            ) {
                                                items(SHOP_ACCESSORIES) { accessory ->
                                                    val isOwned = unlockedAccessories.contains(accessory.id)
                                                    val isEquipped = activeAccessory == accessory.id

                                                    Card(
                                                        modifier = Modifier
                                                            .fillMaxWidth()
                                                            .clickable {
                                                                if (isOwned) {
                                                                    activeAccessory = if (isEquipped) null else accessory.id
                                                                    SoundEffects.click()
                                                                } else {
                                                                    if (coins >= accessory.cost) {
                                                                        coins -= accessory.cost
                                                                        unlockedAccessories.add(accessory.id)
                                                                        activeAccessory = accessory.id
                                                                        SoundEffects.success()
                                                                    } else {
                                                                        SoundEffects.hurt()
                                                                    }
                                                                }
                                                            },
                                                        colors = CardDefaults.cardColors(
                                                            containerColor = if (isEquipped) Color(0xFF3B82F6) else Color(0xFF1E293B)
                                                        )
                                                    ) {
                                                        Column(
                                                            modifier = Modifier.padding(8.dp),
                                                            horizontalAlignment = Alignment.CenterHorizontally
                                                        ) {
                                                            Text(accessory.emoji, fontSize = 32.sp)
                                                            Text(accessory.name, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                                            Text(accessory.description, color = Color.LightGray, fontSize = 9.sp, textAlign = TextAlign.Center)
                                                            Spacer(modifier = Modifier.height(4.dp))
                                                            if (isOwned) {
                                                                Text("OWNED", color = Color(0xFF10B981), fontSize = 10.sp, fontWeight = FontWeight.Black)
                                                            } else {
                                                                Text("${accessory.cost}🪙", color = Color(0xFFFBBF24), fontSize = 11.sp, fontWeight = FontWeight.ExtraBold)
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    "codex" -> {
                                        // HANDBOOK CODEX LORE LORE GUIDE
                                        Column(
                                            modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()),
                                            verticalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            Text("📖 PREHISTORIC CODEX", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 13.sp)
                                            Text("Explore the dietary trees to control Roary's adult form!", color = Color.LightGray, fontSize = 10.sp)
                                            
                                            // Dynamic forecast
                                            val forecast = when {
                                                stage == "Egg" -> "Mystery Egg"
                                                stage == "Adult" -> "Adult Species: $species"
                                                unlockedAccessories.size >= 4 -> "Secret Dragon 🐉 (4+ Boutique styles bought)"
                                                steakCount > vegCount -> "T-Rex 🦖 (Carnivore Diet: Steak > Broccoli)"
                                                vegCount > steakCount -> "Triceratops 🦕 (Herbivore Diet: Broccoli > Steak)"
                                                else -> "Pterodactyl 🦅 (Balanced Lifestyle Tracker)"
                                            }

                                            Card(
                                                colors = CardDefaults.cardColors(containerColor = Color(0x22FBBF24)),
                                                modifier = Modifier.fillMaxWidth()
                                            ) {
                                                Column(modifier = Modifier.padding(10.dp)) {
                                                    Text("EVOLUTION TARGET FORECAST:", color = Color(0xFFFBBF24), fontWeight = FontWeight.Black, fontSize = 10.sp)
                                                    Text(forecast, color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                                }
                                            }

                                            Text("Evolution Instructions:", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                                            Text("• Kept stats high! Maintain health, hunger, and happiness green to award care progress XP.\n• Baby Stage grows at 100 XP to Teen.\n• Teen Stage grows at 100 XP to Adult.\n• Purchase cool styles & satisfy exact diets before Adult form hones!", color = Color.LightGray, fontSize = 10.sp)
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Launcher Dashboard Home Screen
                    "launcher" -> {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(Brush.verticalGradient(listOf(Color(0xFF0F172A), Color(0xFF1E293B))))
                                .padding(20.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("DinoOS Launcher", color = Color.LightGray, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp)
                            
                            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                Button(
                                    onClick = { activeApp = "pet"; SoundEffects.success() },
                                    modifier = Modifier.fillMaxWidth().height(50.dp)
                                ) {
                                    Text("🦖 Enter Companion Habitat")
                                }
                                Button(
                                    onClick = { activeApp = "runner"; SoundEffects.success() },
                                    modifier = Modifier.fillMaxWidth().height(50.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669))
                                ) {
                                    Text("🌋 Play Dino Runner Arcade")
                                }
                                Button(
                                    onClick = { activeApp = "catcher"; SoundEffects.success() },
                                    modifier = Modifier.fillMaxWidth().height(50.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3B82F6))
                                ) {
                                    Text("🍇 Play Cherry Fruit Catcher")
                                }
                            }

                            Text("Device OS Version 1.4 Beta", color = Color.Gray, fontSize = 10.sp)
                        }
                    }

                    // Mini-Game 1: Dino runner launcher integration
                    "runner" -> {
                        val bodyColor = try { Color(android.graphics.Color.parseColor(dinoColorHex)) } catch (e: Exception) { Color(0xFF10B981) }
                        DinoRunnerGame(
                            dinoColor = bodyColor,
                            onGameOver = { extraCoins, happinessBoost ->
                                coins += extraCoins
                                happiness = minOf(100f, happiness + happinessBoost.toFloat())
                                activeApp = "pet"
                            },
                            onExit = { activeApp = "pet" }
                        )
                    }

                    // Mini-Game 2: Catcher game launcher Integration
                    "catcher" -> {
                        val bodyColor = try { Color(android.graphics.Color.parseColor(dinoColorHex)) } catch (e: Exception) { Color(0xFF10B981) }
                        FruitCatcherGame(
                            dinoColor = bodyColor,
                            onGameOver = { extraCoins, happinessBoost ->
                                coins += extraCoins
                                happiness = minOf(100f, happiness + happinessBoost.toFloat())
                                activeApp = "pet"
                            },
                            onExit = { activeApp = "pet" }
                        )
                    }
                }
            }

            // Android Hardware Navigation bar on bottom
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.Black)
                    .padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.SpaceAround,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Button 1: Switch between Launcher and Active Companion Game back/forth
                IconButton(onClick = {
                    SoundEffects.click()
                    activeApp = if (activeApp == "launcher") "pet" else "launcher"
                }) {
                    Icon(Icons.Default.Widgets, contentDescription = "DinoOS App Drawer", tint = Color.LightGray)
                }

                // Button 2: Android Home Button
                IconButton(onClick = {
                    SoundEffects.click()
                    activeApp = "launcher"
                }) {
                    Icon(Icons.Default.Home, contentDescription = "Tablets Home", tint = Color.LightGray)
                }

                // Button 3: System Device Config Menu Modal Drawer
                IconButton(onClick = {
                    SoundEffects.click()
                    // Toggle Device Settings inside app app Drawer
                    activeApp = "pet"
                    activeTab = "home"
                    currentScenery = when(currentScenery) {
                        Scenery.VALLEY -> Scenery.VOLCANO
                        Scenery.VOLCANO -> Scenery.GLACIER
                        Scenery.GLACIER -> Scenery.NIGHT
                        Scenery.NIGHT -> Scenery.VALLEY
                    }
                }) {
                    Icon(Icons.Default.Settings, contentDescription = "Active Android settings panel", tint = Color.LightGray)
                }
            }
        }
    }
}

// -----------------------------------------------------------------
// ANIMATION HELPERS EXTENSIONS
// -----------------------------------------------------------------
@Composable
fun Modifier.bounceAnimation(trigger: Int): Modifier {
    val scale = if (trigger % 2 == 0) 1.05f else 0.95f
    return this.animateContentSize()
}

// Draw the Custom vector graphics representing Dino Stage & species on Canvas!
private fun DrawScope.drawLivingDinoGraphic(
    stage: String,
    species: String,
    bodyColor: Color,
    isSleeping: Boolean,
    isSick: Boolean
) {
    val sizeW = size.width
    val sizeH = size.height
    val center = Offset(sizeW / 2f, sizeH / 2f)

    if (stage == "Baby") {
        // Draw cute baby ball
        drawCircle(color = bodyColor, radius = 28f, center = center)
        // Cute big eye
        val eyeCenter = Offset(center.x + 10f, center.y - 5f)
        if (isSleeping) {
            drawLine(color = Color.Black, start = Offset(eyeCenter.x - 6f, eyeCenter.y), end = Offset(eyeCenter.x + 6f, eyeCenter.y), strokeWidth = 3f)
        } else {
            drawCircle(color = Color.White, radius = 7f, center = eyeCenter)
            drawCircle(color = Color.Black, radius = 3.5f, center = Offset(eyeCenter.x + 1.5f, eyeCenter.y - 1.5f))
        }
        // Mouth
        drawArc(
            color = Color.Black,
            startAngle = 0f,
            sweepAngle = 180f,
            useCenter = false,
            topLeft = Offset(center.x + 8f, center.y + 4f),
            size = Size(10f, 6f)
        )
    } else if (stage == "Teen") {
        // Rounded head/neck
        drawRect(color = bodyColor, topLeft = Offset(center.x - 25f, center.y - 30f), size = Size(50f, 60f))
        drawCircle(color = bodyColor, radius = 25f, center = Offset(center.x + 5f, center.y - 15f))
        // Eye
        val eyeCenter = Offset(center.x + 12f, center.y - 18f)
        if (isSleeping) {
            drawLine(color = Color.Black, start = Offset(eyeCenter.x - 6f, eyeCenter.y), end = Offset(eyeCenter.x + 6f, eyeCenter.y), strokeWidth = 4f)
        } else {
            drawCircle(color = Color.White, radius = 6f, center = eyeCenter)
            drawCircle(color = Color.Black, radius = 3f, center = eyeCenter)
        }
        // Cheek crests
        drawCircle(color = Color(0xAAFF8E8E), radius = 5f, center = Offset(center.x + 5f, center.y - 8f))
    } else {
        // ADULT SUBSPECIES RENDERS
        when (species) {
            "T-Rex" -> {
                // Large aggressive head shape
                drawRoundRect(color = bodyColor, topLeft = Offset(center.x - 30f, center.y - 45f), size = Size(65f, 75f), cornerRadius = androidx.compose.ui.geometry.CornerRadius(15f, 15f))
                drawRect(color = bodyColor, topLeft = Offset(center.x, center.y - 25f), size = Size(40f, 30f)) // Snout
                // Mad eye
                val eyeCenter = Offset(center.x + 15f, center.y - 25f)
                drawLine(color = Color.Black, start = Offset(eyeCenter.x - 7f, eyeCenter.y - 3f), end = Offset(eyeCenter.x + 5f, eyeCenter.y + 2f), strokeWidth = 5f)
            }
            "Triceratops" -> {
                // Massive shield plate head
                drawCircle(color = bodyColor, radius = 38f, center = center)
                drawRect(color = bodyColor, topLeft = Offset(center.x - 10f, center.y - 10f), size = Size(50f, 40f))
                // Horns
                drawLine(color = Color.White, start = Offset(center.x + 10f, center.y - 15f), end = Offset(center.x + 35f, center.y - 32f), strokeWidth = 6f)
                drawLine(color = Color.White, start = Offset(center.x - 5f, center.y - 20f), end = Offset(center.x + 10f, center.y - 38f), strokeWidth = 6f)
            }
            "Pterodactyl" -> {
                // Wide crest head and wings
                drawCircle(color = bodyColor, radius = 25f, center = center)
                // Crest
                drawArc(color = bodyColor, startAngle = 180f, sweepAngle = 90f, useCenter = true, topLeft = Offset(center.x - 45f, center.y - 35f), size = Size(50f, 40f))
                // Beak
                drawLine(color = Color(0xFFFBBF24), start = Offset(center.x + 10f, center.y), end = Offset(center.x + 50f, center.y + 10f), strokeWidth = 10f)
            }
            else -> {
                // Secret Dragon
                drawCircle(color = bodyColor, radius = 32f, center = center)
                // Mystical whiskers and purple horns
                drawLine(color = Color(0xFFA855F7), start = Offset(center.x - 10f, center.y - 25f), end = Offset(center.x - 25f, center.y - 50f), strokeWidth = 6f)
                drawLine(color = Color(0xFFA855F7), start = Offset(center.x + 10f, center.y - 25f), end = Offset(center.x + 25f, center.y - 50f), strokeWidth = 6f)
                // Golden horns details
                drawCircle(color = Color(0xFFFFD700), radius = 6f, center = Offset(center.x, center.y - 2f))
            }
        }
    }
}

// Stats representation widgets
@Composable
fun StatProgressBar(label: String, value: Float, color: Color) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(label, color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
            Text("${(value * 100).toInt()}%", color = Color.LightGray, fontSize = 9.sp)
        }
        Spacer(modifier = Modifier.height(3.dp))
        LinearProgressIndicator(
            progress = { value },
            color = color,
            trackColor = Color(0xFF1E293B),
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp)
                .clip(RoundedCornerShape(3.dp))
        )
    }
}
