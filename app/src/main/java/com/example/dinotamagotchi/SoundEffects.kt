package com.example.dinotamagotchi

import android.media.AudioManager
import android.media.ToneGenerator
import android.util.Log

object SoundEffects {
    private var isMuted = false
    private var toneGenerator: ToneGenerator? = try {
        ToneGenerator(AudioManager.STREAM_MUSIC, 85)
    } catch (e: Exception) {
        null
    }

    fun setMuted(muted: Boolean) {
        isMuted = muted
    }

    fun click() {
        if (isMuted) return
        Thread {
            try {
                toneGenerator?.startTone(ToneGenerator.TONE_PROP_BEEP, 40)
            } catch (e: Exception) {
                Log.e("SoundEffects", "Error playing click tone", e)
            }
        }.start()
    }

    fun success() {
        if (isMuted) return
        Thread {
            try {
                toneGenerator?.startTone(ToneGenerator.TONE_PROP_PROMPT, 100)
                Thread.sleep(120)
                toneGenerator?.startTone(ToneGenerator.TONE_PROP_PROMPT, 150)
            } catch (e: Exception) {
                Log.e("SoundEffects", "Error playing success tone", e)
            }
        }.start()
    }

    fun hurt() {
        if (isMuted) return
        Thread {
            try {
                toneGenerator?.startTone(ToneGenerator.TONE_PROP_NACK, 250)
            } catch (e: Exception) {
                Log.e("SoundEffects", "Error playing hurt tone", e)
            }
        }.start()
    }

    fun eat() {
        if (isMuted) return
        Thread {
            try {
                toneGenerator?.startTone(ToneGenerator.TONE_PROP_BEEP, 60)
                Thread.sleep(80)
                toneGenerator?.startTone(ToneGenerator.TONE_PROP_BEEP, 60)
            } catch (e: Exception) {
                Log.e("SoundEffects", "Error playing eat tone", e)
            }
        }.start()
    }

    fun hatch() {
        if (isMuted) return
        Thread {
            try {
                for (i in 1..4) {
                    toneGenerator?.startTone(ToneGenerator.TONE_PROP_BEEP, 50)
                    Thread.sleep(80)
                }
                toneGenerator?.startTone(ToneGenerator.TONE_PROP_PROMPT, 300)
            } catch (e: Exception) {
                Log.e("SoundEffects", "Error playing hatch tone", e)
            }
        }.start()
    }

    fun levelUp() {
        if (isMuted) return
        Thread {
            try {
                toneGenerator?.startTone(ToneGenerator.TONE_PROP_PROMPT, 150)
                Thread.sleep(200)
                toneGenerator?.startTone(ToneGenerator.TONE_PROP_PROMPT, 150)
                Thread.sleep(200)
                toneGenerator?.startTone(ToneGenerator.TONE_PROP_ACK, 300)
            } catch (e: Exception) {
                Log.e("SoundEffects", "Error playing levelUp tone", e)
            }
        }.start()
    }
}
