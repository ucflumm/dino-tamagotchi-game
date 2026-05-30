package com.example.dinotamagotchi

import android.media.AudioManager
import android.media.ToneGenerator

object SoundEffects {
    private var isMuted = false
    private val toneGenerator = ToneGenerator(AudioManager.STREAM_MUSIC, 100)

    fun setMuted(muted: Boolean) {
        isMuted = muted
    }

    private fun playTone(type: Int, duration: Int) {
        if (!isMuted) {
            toneGenerator.startTone(type, duration)
        }
    }

    fun click() {
        playTone(ToneGenerator.TONE_PROP_BEEP, 100)
    }

    fun jump() {
        playTone(ToneGenerator.TONE_CDMA_PIP, 150)
    }

    fun success() {
        playTone(ToneGenerator.TONE_CDMA_CONFIRM, 300)
    }

    fun eat() {
        playTone(ToneGenerator.TONE_CDMA_NETWORK_USA_RINGBACK, 200)
    }

    fun clean() {
        playTone(ToneGenerator.TONE_SUP_PIP, 100)
    }

    fun hurt() {
        playTone(ToneGenerator.TONE_CDMA_SOFT_ERROR_LITE, 400)
    }

    fun hatch() {
        playTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 500)
    }

    fun levelUp() {
        playTone(ToneGenerator.TONE_CDMA_HIGH_L, 500)
    }
}
