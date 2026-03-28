// Web Audio API — generates sounds without any audio files
const AudioContext = window.AudioContext || window.webkitAudioContext

let ctx = null

const getCtx = () => {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

// soft "pop" — new message in a room
export const playMessageSound = () => {
  try {
    const context = getCtx()
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(context.destination)

    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(880, context.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(440, context.currentTime + 0.1)

    gainNode.gain.setValueAtTime(0.3, context.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3)

    oscillator.start(context.currentTime)
    oscillator.stop(context.currentTime + 0.3)
  } catch (err) {
    console.log("Sound error:", err)
  }
}

// two-tone "ding" — new DM
export const playDMSound = () => {
  try {
    const context = getCtx()

    const playTone = (freq, startTime, duration) => {
      const oscillator = context.createOscillator()
      const gainNode = context.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(context.destination)

      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(freq, startTime)

      gainNode.gain.setValueAtTime(0.25, startTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

      oscillator.start(startTime)
      oscillator.stop(startTime + duration)
    }

    // two quick tones
    playTone(660, context.currentTime, 0.15)
    playTone(880, context.currentTime + 0.18, 0.2)
  } catch (err) {
    console.log("Sound error:", err)
  }
}

// short "tick" — emoji reaction
export const playReactionSound = () => {
  try {
    const context = getCtx()
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(context.destination)

    oscillator.type = "triangle"
    oscillator.frequency.setValueAtTime(1200, context.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(800, context.currentTime + 0.08)

    gainNode.gain.setValueAtTime(0.15, context.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12)

    oscillator.start(context.currentTime)
    oscillator.stop(context.currentTime + 0.12)
  } catch (err) {
    console.log("Sound error:", err)
  }
}