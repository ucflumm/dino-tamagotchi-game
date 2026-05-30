package com.example.dinotamagotchi

import androidx.compose.animation.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
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
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlin.math.max

data class Cactus(val x: Float, val width: Float = 25f, val height: Float = 55f)

@Composable
fun DinoRunnerGame(
    dinoColor: Color,
    onGameOver: (coinsEarned: Int, happinessEarned: Int) -> Unit,
    onExit: () -> Unit
) {
    var isPlaying by remember { mutableStateOf(false) }
    var isGameOverState by remember { mutableStateOf(false) }
    var score by remember { mutableStateOf(0) }
    var coinsEarned by remember { mutableStateOf(0) }

    // Game physics variables updated via game loop
    var dinoY by remember { mutableStateOf(0f) }
    var dinoVelocityY by remember { mutableStateOf(0f) }
    val gravity = -1.3f
    val jumpVelocity = 18f
    val groundY = 0f

    // List of active obstacles
    val cactiList = remember { mutableStateListOf<Cactus>() }
    var gameSpeed by remember { mutableStateOf(8f) }
    var frameTick by remember { mutableStateOf(0) }

    // LaunchedEffect acts as high frame-rate game loop when user is actively playing
    LaunchedEffect(isPlaying) {
        if (!isPlaying) return@LaunchedEffect
        // Reset game parameters
        dinoY = 0f
        dinoVelocityY = 0f
        cactiList.clear()
        cactiList.add(Cactus(x = 600f))
        gameSpeed = 8f
        score = 0
        coinsEarned = 0
        isGameOverState = false

        while (isPlaying) {
            frameTick++

            // Handle dino physics (jumping to ground)
            if (dinoY > groundY || dinoVelocityY != 0f) {
                dinoVelocityY += gravity
                dinoY += dinoVelocityY
                if (dinoY <= groundY) {
                    dinoY = groundY
                    dinoVelocityY = 0f
                }
            }

            // Move Cacti leftward and spawn new ones
            for (i in cactiList.indices) {
                cactiList[i] = cactiList[i].copy(x = cactiList[i].x - gameSpeed)
            }

            // Remove out of bounds cacti and award scores
            if (cactiList.isNotEmpty() && cactiList[0].x < -50f) {
                cactiList.removeAt(0)
                score += 10
                coinsEarned += 2
                // Increase speed slowly
                if (score % 40 == 0) {
                    gameSpeed += 1f
                    SoundEffects.click()
                }
            }

            // Spawn obstacles randomly when spacing dictates
            if (cactiList.isEmpty() || (cactiList.last().x < 450f && (1..100).random() > 95)) {
                val nextX = 700f + (0..150).random()
                val height = 40f + (10..40).random()
                cactiList.add(Cactus(x = nextX, height = height))
            }

            // Check collision
            val dinoWidth = 35f
            val dinoHeight = 50f
            val dinoLeft = 100f
            val dinoRight = dinoLeft + dinoWidth
            val dinoBottom = dinoY // Height off ground
            val dinoTop = dinoY + dinoHeight

            for (cactus in cactiList) {
                val cacLeft = cactus.x
                val cacRight = cactus.x + cactus.width
                val cacBottom = 0f
                val cacTop = cactus.height

                // Collide if boxes overlap
                val isXOverlap = dinoRight > cacLeft && dinoLeft < cacRight
                val isYOverlap = dinoBottom < cacTop && dinoTop > cacBottom

                if (isXOverlap && isYOverlap) {
                    // Collision! Game over
                    isPlaying = false
                    isGameOverState = true
                    SoundEffects.hurt()
                    break
                }
            }

            delay(16) // ~60 FPS update speed
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
            // Header stats panel
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "🌋 ARCADE RUNNER",
                        color = Color(0xFFFBBF24),
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Tap to jump over cacti!",
                        color = Color.LightGray,
                        fontSize = 11.sp
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Badge(containerColor = Color(0xFF1E293B), contentColor = Color.White) {
                        Text("Score: $score", modifier = Modifier.padding(4.dp), fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                    }
                    Badge(containerColor = Color(0x33FBBF24), contentColor = Color(0xFFFBBF24)) {
                        Text("Coins: +$coinsEarned 🪙", modifier = Modifier.padding(4.dp), fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Game Canvas Box (clickable to trigger jump)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .background(Color(0xFF1E293B), RoundedCornerShape(16.dp))
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null
                    ) {
                        if (isPlaying && dinoY == groundY) {
                            dinoVelocityY = jumpVelocity
                            SoundEffects.click()
                        }
                    },
                contentAlignment = Alignment.Center
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val canvasWidth = size.width
                    val canvasHeight = size.height
                    val drawingGroundY = canvasHeight * 0.75f

                    // Draw horizon/ground floor
                    drawLine(
                        color = Color(0xFF64748B),
                        start = Offset(0f, drawingGroundY),
                        end = Offset(canvasWidth, drawingGroundY),
                        strokeWidth = 4f
                    )

                    // Draw Dino
                    val dinoPixelX = 100f
                    val dinoPixelY = drawingGroundY - dinoY - 45f // Drawn from top-left offset

                    drawDinoSpriteOnCanvas(dinoPixelX, dinoPixelY, dinoColor)

                    // Draw Obstacles (Cacti)
                    for (cactus in cactiList) {
                        val cactusX = cactus.x
                        drawCactusOnCanvas(cactusX, drawingGroundY - cactus.height, cactus.width, cactus.height)
                    }

                    // Background details: small clouds rushing left
                    val cloudShift = (frameTick * 0.8f) % (canvasWidth + 100f)
                    drawCloudOnCanvas(canvasWidth - cloudShift + 100f, 40f)
                    drawCloudOnCanvas(canvasWidth - ((frameTick * 0.4f) % (canvasWidth + 200f)) + 200f, 80f)
                }

                // Title Overlay if idle
                if (!isPlaying && !isGameOverState) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.background(Color(0xCD020617), RoundedCornerShape(16.dp)).padding(16.dp)
                    ) {
                        Text("🌋 JUMP ROARY GAME", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.ExtraBold)
                        Text("Avoid all obstacles to win coins!", color = Color.LightGray, fontSize = 12.sp)
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
                            Text("START RUN")
                        }
                    }
                }

                // Game Over Overlay
                if (isGameOverState) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.background(Color(0xDD000000), RoundedCornerShape(16.dp)).padding(20.dp)
                    ) {
                        Text("💥 COLLISION!", color = Color(0xFFEF4444), fontSize = 21.sp, fontWeight = FontWeight.Black)
                        Text("Your score: $score", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Text("Received $coinsEarned gold and +15 happiness!", color = Color(0xFFFBBF24), fontSize = 12.sp, modifier = Modifier.padding(vertical = 4.dp))
                        Spacer(modifier = Modifier.height(12.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(
                                onClick = {
                                    SoundEffects.click()
                                    onGameOver(coinsEarned, 15)
                                },
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                            ) {
                                Text("Claim & Exit")
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
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "High speed bonus increases with score!",
                    fontSize = 11.sp,
                    color = Color.Gray,
                    fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                )
                Text(
                    text = "[Tap box to JUMP]",
                    fontSize = 11.sp,
                    color = Color(0xFF3B82F6),
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

// Canvas Drawings implementation to avoid loading static bitmaps
private fun DrawScope.drawDinoSpriteOnCanvas(x: Float, y: Float, bodyColor: Color) {
    // Body / head capsule
    drawRect(
        color = bodyColor,
        topLeft = Offset(x, y + 10f),
        size = Size(35f, 35f)
    )
    // Snout / snout pixels
    drawRect(
        color = bodyColor,
        topLeft = Offset(x + 20f, y + 15f),
        size = Size(20f, 15f)
    )
    // Eye dot
    drawRect(
        color = Color.Black,
        topLeft = Offset(x + 25f, y + 15f),
        size = Size(6f, 6f)
    )
    // Little boots
    drawRect(
        color = Color(0xFF1E293B),
        topLeft = Offset(x + 5f, y + 42f),
        size = Size(8f, 6f)
    )
    drawRect(
        color = Color(0xFF1E293B),
        topLeft = Offset(x + 22f, y + 42f),
        size = Size(8f, 6f)
    )
    // Little tail pixel
    drawRect(
        color = bodyColor,
        topLeft = Offset(x - 10f, y + 25f),
        size = Size(11f, 10f)
    )
}

private fun DrawScope.drawCactusOnCanvas(x: Float, y: Float, width: Float, height: Float) {
    // Trunk
    drawRect(
        color = Color(0xFF10B981),
        topLeft = Offset(x + width/3f, y),
        size = Size(width/3f, height)
    )
    // Left arm
    drawRect(
        color = Color(0xFF059669),
        topLeft = Offset(x, y + height*0.3f),
        size = Size(width/3f, 8f)
    )
    drawRect(
        color = Color(0xFF059669),
        topLeft = Offset(x, y + height*0.1f),
        size = Size(6f, height*0.2f)
    )
    // Right arm
    drawRect(
        color = Color(0xFF059669),
        topLeft = Offset(x + width*0.66f, y + height*0.45f),
        size = Size(width/3f, 8f)
    )
    drawRect(
        color = Color(0xFF059669),
        topLeft = Offset(x + width - 6f, y + height*0.25f),
        size = Size(6f, height*0.2f)
    )
}

private fun DrawScope.drawCloudOnCanvas(x: Float, y: Float) {
    drawCircle(
        color = Color(0x33FFFFFF),
        radius = 16f,
        center = Offset(x, y)
    )
    drawCircle(
        color = Color(0x33FFFFFF),
        radius = 22f,
        center = Offset(x + 18f, y - 5f)
    )
    drawCircle(
        color = Color(0x33FFFFFF),
        radius = 16f,
        center = Offset(x + 36f, y)
    )
}
