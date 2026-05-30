package com.example.dinotamagotchi

import androidx.compose.animation.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

enum class FallingType { FRUIT, GOLD_CHERRY, BOMB }

data class FallingObject(
    val id: Int,
    var x: Float,
    var y: Float,
    val type: FallingType,
    val speed: Float,
    val size: Float = 35f
)

@Composable
fun FruitCatcherGame(
    dinoColor: Color,
    onGameOver: (coinsEarned: Int, happinessEarned: Int) -> Unit,
    onExit: () -> Unit
) {
    var isPlaying by remember { mutableStateOf(false) }
    var isGameOver by remember { mutableStateOf(false) }
    var score by remember { mutableStateOf(0) }
    var coinsEarned by remember { mutableStateOf(0) }
    var lives by remember { mutableStateOf(3) }

    // Bucket/Dino horizontal position coordinate
    var dinoX by remember { mutableStateOf(200f) }
    val dinoSpeed = 15f
    val dinoYPosition = 150f // Dist from top in drawing coords inside 200dp height

    val fallingObjects = remember { mutableStateListOf<FallingObject>() }
    var spawnTimer by remember { mutableStateOf(0) }
    var nextId by remember { mutableStateOf(1) }

    // Game physics updates
    LaunchedEffect(isPlaying) {
        if (!isPlaying) return@LaunchedEffect
        // Reset state
        score = 0
        coinsEarned = 0
        lives = 3
        dinoX = 250f
        fallingObjects.clear()
        isGameOver = false

        while (isPlaying) {
            spawnTimer++

            // Spawner
            if (spawnTimer >= 35) {
                spawnTimer = 0
                val itemType = when ((1..10).random()) {
                    in 1..7 -> FallingType.FRUIT
                    8 -> FallingType.GOLD_CHERRY
                    else -> FallingType.BOMB
                }

                val objX = (10..450).random().toFloat()
                val speed = (4..8).random().toFloat() + (score / 50)
                fallingObjects.add(FallingObject(nextId++, objX, 0f, itemType, speed))
            }

            // Movement and bounds verification
            val toRemove = mutableListOf<FallingObject>()
            for (obj in fallingObjects) {
                obj.y += obj.speed

                // Caught verification
                val caughtXRange = (dinoX - 45f)..(dinoX + 45f)
                val caughtYRange = (140f)..(165f) // Near dino altitude

                if (obj.y in caughtYRange && obj.x in caughtXRange) {
                    toRemove.add(obj)
                    // Trigger effect
                    when (obj.type) {
                        FallingType.FRUIT -> {
                            score += 10
                            coinsEarned += 1
                            SoundEffects.click()
                        }
                        FallingType.GOLD_CHERRY -> {
                            score += 25
                            coinsEarned += 5
                            SoundEffects.success()
                        }
                        FallingType.BOMB -> {
                            lives--
                            SoundEffects.hurt()
                            if (lives <= 0) {
                                isPlaying = false
                                isGameOver = true
                            }
                        }
                    }
                } else if (obj.y > 210f) {
                    toRemove.add(obj)
                    if (obj.type != FallingType.BOMB) {
                        // Lost clean points penalty
                        score = maxOf(0, score - 5)
                    }
                }
            }
            fallingObjects.removeAll(toRemove)

            delay(20) // ~50fps
        }
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(12.dp),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header stats block
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "🍇 FRUIT CATCHER",
                        color = Color(0xFF4ADE80),
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Steer Roary to catch fruit. Dodge Volcano bombs!",
                        color = Color.LightGray,
                        fontSize = 10.sp
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Badge(containerColor = Color(0xFF1E293B), contentColor = Color.White) {
                        Text("Score: $score", modifier = Modifier.padding(4.dp), fontWeight = FontWeight.Bold)
                    }
                    Badge(containerColor = Color(0x33EF4444), contentColor = Color(0xFFEF4444)) {
                        Text("❤️: $lives", modifier = Modifier.padding(4.dp), fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Game viewport Canvas
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .background(Color(0xFF1E293B), RoundedCornerShape(16.dp)),
                contentAlignment = Alignment.Center
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val canvasWidth = size.width
                    val canvasHeight = size.height
                    val groundLevel = canvasHeight - 25f

                    // Ground terrain
                    drawRect(
                        color = Color(0xFF334155),
                        topLeft = Offset(0f, groundLevel),
                        size = Size(canvasWidth, 25f)
                    )

                    // Draw our active player bucket/dino
                    drawDinoCatcherBasket(dinoX, groundLevel - 20f, dinoColor)

                    // Draw falling objects
                    for (obj in fallingObjects) {
                        drawFallingElement(obj)
                    }
                }

                // Initial Overlay
                if (!isPlaying && !isGameOver) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.background(Color(0xE6020617), RoundedCornerShape(16.dp)).padding(16.dp)
                    ) {
                        Text("🍇 CHERRY DROPS", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.ExtraBold)
                        Text("Dodge volcanic rocks & eat delicious fruit!", color = Color.LightGray, fontSize = 12.sp)
                        Spacer(modifier = Modifier.height(12.dp))
                        Button(
                            onClick = {
                                SoundEffects.success()
                                isPlaying = true
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                        ) {
                            Icon(Icons.Default.PlayArrow, contentDescription = "Play")
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("START PLAY")
                        }
                    }
                }

                // Game Over screen
                if (isGameOver) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.background(Color(0xEE090D16), RoundedCornerShape(16.dp)).padding(20.dp)
                    ) {
                        Text("🌋 ERUPTION CRASH!", color = Color(0xFFEF4444), fontSize = 20.sp, fontWeight = FontWeight.Black)
                        Text("Total Score: $score", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Text("Received $coinsEarned gold and +20 happiness!", color = Color(0xFFFBBF24), fontSize = 12.sp)
                        Spacer(modifier = Modifier.height(12.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(
                                onClick = {
                                    SoundEffects.click()
                                    onGameOver(coinsEarned, 20)
                                },
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                            ) {
                                Text("Claim Reward")
                            }

                            Button(
                                onClick = {
                                    SoundEffects.success()
                                    isPlaying = true
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3B82F6))
                            ) {
                                Icon(Icons.Default.Refresh, contentDescription = "Retry")
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Retry")
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Controller controls row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // LEFT BUTTON
                IconButton(
                    onClick = {
                        dinoX = maxOf(40f, dinoX - dinoSpeed)
                        SoundEffects.click()
                    },
                    modifier = Modifier
                        .size(50.dp)
                        .background(Color(0xFF334155), CircleShape)
                ) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Move Left", tint = Color.White)
                }

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("+ $coinsEarned 🪙 Collected", color = Color(0xFFFBBF24), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Text("Steer using buttons", color = Color.Gray, fontSize = 10.sp)
                }

                // RIGHT BUTTON
                IconButton(
                    onClick = {
                        dinoX = minOf(460f, dinoX + dinoSpeed)
                        SoundEffects.click()
                    },
                    modifier = Modifier
                        .size(50.dp)
                        .background(Color(0xFF334155), CircleShape)
                ) {
                    Icon(Icons.Default.ArrowForward, contentDescription = "Move Right", tint = Color.White)
                }
            }
        }
    }
}

private fun DrawScope.drawDinoCatcherBasket(x: Float, y: Float, color: Color) {
    // Drawn bucket or container basket representation
    drawRoundRect(
        color = color,
        topLeft = Offset(x - 30f, y),
        size = Size(60f, 25f),
        cornerRadius = androidx.compose.ui.geometry.CornerRadius(10f, 10f)
    )
    // Draw cute eyes looking upward inside basket
    drawCircle(color = Color.White, radius = 5f, center = Offset(x - 10f, y + 10f))
    drawCircle(color = Color.Black, radius = 2.5f, center = Offset(x - 10f, y + 7f))

    drawCircle(color = Color.White, radius = 5f, center = Offset(x + 10f, y + 10f))
    drawCircle(color = Color.Black, radius = 2.5f, center = Offset(x + 10f, y + 7f))
}

private fun DrawScope.drawFallingElement(obj: FallingObject) {
    when (obj.type) {
        FallingType.FRUIT -> {
            // Draw a shiny red cherry
            drawCircle(
                color = Color(0xFFEF4444),
                radius = 12f,
                center = Offset(obj.x, obj.y)
            )
            // stem
            drawLine(
                color = Color(0xFF10B981),
                start = Offset(obj.x, obj.y - 12f),
                end = Offset(obj.x + 8f, obj.y - 20f),
                strokeWidth = 3f
            )
        }
        FallingType.GOLD_CHERRY -> {
            // Draw a premium gold carrat
            drawCircle(
                color = Color(0xFFFBBF24),
                radius = 14f,
                center = Offset(obj.x, obj.y)
            )
            // Sparkle dot
            drawCircle(
                color = Color.White,
                radius = 4f,
                center = Offset(obj.x - 4f, obj.y - 4f)
            )
        }
        FallingType.BOMB -> {
            // Draw prehistoric stone boulder
            drawCircle(
                color = Color(0xFF64748B),
                radius = 13f,
                center = Offset(obj.x, obj.y)
            )
            // Volcanic cracks or glowing center
            drawCircle(
                color = Color(0xFFEF4444),
                radius = 5f,
                center = Offset(obj.x, obj.y)
            )
        }
    }
}
