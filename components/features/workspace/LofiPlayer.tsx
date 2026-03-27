'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Music2, Pause, Play, Volume2, VolumeX, Radio, CloudRain, Wind, Coffee, Waves, Square } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const STATIONS = [
    { name: 'Groove Salad', url: 'https://ice4.somafm.com/groovesalad-128-mp3' },
    { name: 'Drone Zone', url: 'https://ice4.somafm.com/dronezone-128-mp3' },
    { name: 'Lush', url: 'https://ice4.somafm.com/lush-128-mp3' },
    { name: 'Suburbs of Goa', url: 'https://ice4.somafm.com/suburbsofgoa-128-mp3' },
]

const AMBIANCE_SOUNDS = [
    { name: 'Rain', icon: CloudRain },
    { name: 'Wind', icon: Wind },
    { name: 'Cafe', icon: Coffee },
    { name: 'Waves', icon: Waves },
] as const

// ─── Ambient sound engine ───
// Uses Web Audio API with shaped noise — no external URLs, works offline.
// Each sound gets its own AudioContext so start/stop is clean.

interface AmbientEngine {
    ctx: AudioContext
    gain: GainNode
    stop: () => void
}

function makeNoise(ctx: AudioContext, type: 'white' | 'pink' | 'brown', seconds: number): AudioBuffer {
    const buf = ctx.createBuffer(2, ctx.sampleRate * seconds, ctx.sampleRate)
    for (let ch = 0; ch < 2; ch++) {
        const data = buf.getChannelData(ch)
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
        let last = 0
        for (let i = 0; i < data.length; i++) {
            const white = Math.random() * 2 - 1
            if (type === 'white') {
                data[i] = white
            } else if (type === 'pink') {
                // Paul Kellet's refined method
                b0 = 0.99886 * b0 + white * 0.0555179
                b1 = 0.99332 * b1 + white * 0.0750759
                b2 = 0.96900 * b2 + white * 0.1538520
                b3 = 0.86650 * b3 + white * 0.3104856
                b4 = 0.55000 * b4 + white * 0.5329522
                b5 = -0.7616 * b5 - white * 0.0168980
                data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
                b6 = white * 0.115926
            } else {
                // Brown: integrated white noise
                last = (last + white * 0.02) / 1.02
                data[i] = last * 3.5
            }
        }
    }
    return buf
}

function startRain(vol: number): AmbientEngine {
    const ctx = new AudioContext()
    const master = ctx.createGain()
    master.gain.value = vol
    master.connect(ctx.destination)

    // Layer 1: steady rain body (pink noise, mid-high frequencies)
    const rain1 = ctx.createBufferSource()
    rain1.buffer = makeNoise(ctx, 'pink', 5)
    rain1.loop = true
    const hp1 = ctx.createBiquadFilter()
    hp1.type = 'highpass'
    hp1.frequency.value = 2500
    const lp1 = ctx.createBiquadFilter()
    lp1.type = 'lowpass'
    lp1.frequency.value = 9000
    const g1 = ctx.createGain()
    g1.gain.value = 0.6
    rain1.connect(hp1).connect(lp1).connect(g1).connect(master)

    // Layer 2: heavier drops (white noise, narrow band, modulated)
    const rain2 = ctx.createBufferSource()
    rain2.buffer = makeNoise(ctx, 'white', 4)
    rain2.loop = true
    const bp2 = ctx.createBiquadFilter()
    bp2.type = 'bandpass'
    bp2.frequency.value = 5000
    bp2.Q.value = 0.8
    const g2 = ctx.createGain()
    g2.gain.value = 0.3
    // Slow amplitude modulation for variation
    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = 0.08
    const lfoG = ctx.createGain()
    lfoG.gain.value = 0.12
    lfo.connect(lfoG).connect(g2.gain)
    rain2.connect(bp2).connect(g2).connect(master)

    // Layer 3: low rumble (distant thunder ambiance)
    const rain3 = ctx.createBufferSource()
    rain3.buffer = makeNoise(ctx, 'brown', 6)
    rain3.loop = true
    const lp3 = ctx.createBiquadFilter()
    lp3.type = 'lowpass'
    lp3.frequency.value = 200
    const g3 = ctx.createGain()
    g3.gain.value = 0.25
    rain3.connect(lp3).connect(g3).connect(master)

    rain1.start()
    rain2.start()
    rain3.start()
    lfo.start()

    return {
        ctx, gain: master,
        stop: () => { ctx.close().catch(() => {}) },
    }
}

function startWind(vol: number): AmbientEngine {
    const ctx = new AudioContext()
    const master = ctx.createGain()
    master.gain.value = vol
    master.connect(ctx.destination)

    // Brown noise with slowly sweeping filter = organic wind
    const src = ctx.createBufferSource()
    src.buffer = makeNoise(ctx, 'brown', 8)
    src.loop = true

    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 500
    lp.Q.value = 2

    // Slow LFO sweeps the cutoff for gusting
    const lfo1 = ctx.createOscillator()
    lfo1.type = 'sine'
    lfo1.frequency.value = 0.07
    const lfo1G = ctx.createGain()
    lfo1G.gain.value = 350
    lfo1.connect(lfo1G).connect(lp.frequency)

    // Second even slower LFO for intensity variation
    const lfo2 = ctx.createOscillator()
    lfo2.type = 'sine'
    lfo2.frequency.value = 0.02
    const lfo2G = ctx.createGain()
    lfo2G.gain.value = 0.3
    const ampMod = ctx.createGain()
    ampMod.gain.value = 0.7
    lfo2.connect(lfo2G).connect(ampMod.gain)

    // Higher whistle layer
    const whistle = ctx.createBufferSource()
    whistle.buffer = makeNoise(ctx, 'pink', 6)
    whistle.loop = true
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1200
    bp.Q.value = 3
    const wG = ctx.createGain()
    wG.gain.value = 0.08
    const wLfo = ctx.createOscillator()
    wLfo.type = 'sine'
    wLfo.frequency.value = 0.05
    const wLfoG = ctx.createGain()
    wLfoG.gain.value = 0.06
    wLfo.connect(wLfoG).connect(wG.gain)
    whistle.connect(bp).connect(wG).connect(master)

    src.connect(lp).connect(ampMod).connect(master)

    src.start()
    whistle.start()
    lfo1.start()
    lfo2.start()
    wLfo.start()

    return {
        ctx, gain: master,
        stop: () => { ctx.close().catch(() => {}) },
    }
}

function startCafe(vol: number): AmbientEngine {
    const ctx = new AudioContext()
    const master = ctx.createGain()
    master.gain.value = vol
    master.connect(ctx.destination)

    // Layer 1: low crowd murmur (brown noise, bandpass around speech)
    const murmur = ctx.createBufferSource()
    murmur.buffer = makeNoise(ctx, 'brown', 6)
    murmur.loop = true
    const bp1 = ctx.createBiquadFilter()
    bp1.type = 'bandpass'
    bp1.frequency.value = 400
    bp1.Q.value = 0.5
    const g1 = ctx.createGain()
    g1.gain.value = 0.5
    murmur.connect(bp1).connect(g1).connect(master)

    // Layer 2: speech-range chatter (pink noise, narrow bandpass)
    const chatter = ctx.createBufferSource()
    chatter.buffer = makeNoise(ctx, 'pink', 5)
    chatter.loop = true
    const bp2 = ctx.createBiquadFilter()
    bp2.type = 'bandpass'
    bp2.frequency.value = 1800
    bp2.Q.value = 1.5
    const g2 = ctx.createGain()
    g2.gain.value = 0.07
    // Modulate for natural conversation rhythm
    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = 0.3
    const lfoG = ctx.createGain()
    lfoG.gain.value = 0.04
    lfo.connect(lfoG).connect(g2.gain)
    chatter.connect(bp2).connect(g2).connect(master)

    // Layer 3: subtle clink/clatter texture (white noise, very high, very quiet)
    const clink = ctx.createBufferSource()
    clink.buffer = makeNoise(ctx, 'white', 3)
    clink.loop = true
    const hp3 = ctx.createBiquadFilter()
    hp3.type = 'highpass'
    hp3.frequency.value = 6000
    const g3 = ctx.createGain()
    g3.gain.value = 0.015
    const lfo3 = ctx.createOscillator()
    lfo3.type = 'sine'
    lfo3.frequency.value = 0.5
    const lfo3G = ctx.createGain()
    lfo3G.gain.value = 0.01
    lfo3.connect(lfo3G).connect(g3.gain)
    clink.connect(hp3).connect(g3).connect(master)

    murmur.start()
    chatter.start()
    clink.start()
    lfo.start()
    lfo3.start()

    return {
        ctx, gain: master,
        stop: () => { ctx.close().catch(() => {}) },
    }
}

function startWaves(vol: number): AmbientEngine {
    const ctx = new AudioContext()
    const master = ctx.createGain()
    master.gain.value = vol
    master.connect(ctx.destination)

    // Ocean body: brown noise, low-passed
    const ocean = ctx.createBufferSource()
    ocean.buffer = makeNoise(ctx, 'brown', 8)
    ocean.loop = true
    const lp1 = ctx.createBiquadFilter()
    lp1.type = 'lowpass'
    lp1.frequency.value = 800

    // Wave surge: slow deep amplitude modulation
    const surge = ctx.createGain()
    surge.gain.value = 0.5
    const surgeLfo = ctx.createOscillator()
    surgeLfo.type = 'sine'
    surgeLfo.frequency.value = 0.1 // ~10s wave cycle
    const surgeDepth = ctx.createGain()
    surgeDepth.gain.value = 0.45
    surgeLfo.connect(surgeDepth).connect(surge.gain)
    ocean.connect(lp1).connect(surge).connect(master)

    // Foam/wash layer: pink noise, higher freq, out-of-phase modulation
    const foam = ctx.createBufferSource()
    foam.buffer = makeNoise(ctx, 'pink', 6)
    foam.loop = true
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 3000
    bp.Q.value = 0.4
    const foamG = ctx.createGain()
    foamG.gain.value = 0.08
    const foamLfo = ctx.createOscillator()
    foamLfo.type = 'sine'
    foamLfo.frequency.value = 0.12
    const foamDepth = ctx.createGain()
    foamDepth.gain.value = 0.06
    foamLfo.connect(foamDepth).connect(foamG.gain)
    foam.connect(bp).connect(foamG).connect(master)

    ocean.start()
    foam.start()
    surgeLfo.start()
    foamLfo.start()

    return {
        ctx, gain: master,
        stop: () => { ctx.close().catch(() => {}) },
    }
}

const GENERATORS: Record<string, (vol: number) => AmbientEngine> = {
    Rain: startRain,
    Wind: startWind,
    Cafe: startCafe,
    Waves: startWaves,
}

// ─── Component ───

export function LofiPlayer() {
    const [playing, setPlaying] = useState(false)
    const [loading, setLoading] = useState(false)
    const [volume, setVolume] = useState(0.35)
    const [muted, setMuted] = useState(false)
    const [open, setOpen] = useState(false)
    const [stationIdx, setStationIdx] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [tab, setTab] = useState<'music' | 'ambiance'>('music')

    // Ambiance: UI state (playing flags + volumes) in useState, audio engines in ref
    const [ambiancePlaying, setAmbiancePlaying] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(AMBIANCE_SOUNDS.map((a) => [a.name, false]))
    )
    const [ambianceVolumes, setAmbianceVolumes] = useState<Record<string, number>>(() =>
        Object.fromEntries(AMBIANCE_SOUNDS.map((a) => [a.name, 0.3]))
    )
    const enginesRef = useRef<Record<string, AmbientEngine | null>>({})

    const audioRef = useRef<HTMLAudioElement | null>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    const station = STATIONS[stationIdx]
    const anyAmbiancePlaying = Object.values(ambiancePlaying).some(Boolean)

    // Rebuild audio when station changes
    const buildAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.src = ''
        }
        const audio = new Audio()
        audio.preload = 'none'
        audio.volume = muted ? 0 : volume
        audioRef.current = audio
        return audio
    }, [stationIdx]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        buildAudio()
        return () => { audioRef.current?.pause() }
    }, [buildAudio])

    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = muted ? 0 : volume
    }, [volume, muted])

    const play = async () => {
        const audio = audioRef.current
        if (!audio) return
        setError(null)
        setLoading(true)
        audio.src = station.url
        try {
            await audio.play()
            setPlaying(true)
        } catch {
            setError('Could not connect — try another station')
            setPlaying(false)
        } finally {
            setLoading(false)
        }
    }

    const pause = () => {
        audioRef.current?.pause()
        setPlaying(false)
    }

    const toggle = () => playing ? pause() : play()

    const switchStation = (idx: number) => {
        setStationIdx(idx)
        setPlaying(false)
        setError(null)
        setTimeout(async () => {
            const audio = buildAudio()
            audio.src = STATIONS[idx].url
            setLoading(true)
            try { await audio.play(); setPlaying(true) }
            catch { setError('Could not connect') }
            finally { setLoading(false) }
        }, 50)
    }

    // ─── Ambiance toggle (ref-based, no stale closures) ───
    const toggleAmbiance = (name: string) => {
        const engine = enginesRef.current[name]
        if (engine) {
            // STOP — kill the AudioContext immediately
            engine.stop()
            enginesRef.current[name] = null
            setAmbiancePlaying((prev) => ({ ...prev, [name]: false }))
        } else {
            // START — create a fresh engine
            const gen = GENERATORS[name]
            if (!gen) return
            const vol = ambianceVolumes[name] ?? 0.3
            const newEngine = gen(vol)
            enginesRef.current[name] = newEngine
            setAmbiancePlaying((prev) => ({ ...prev, [name]: true }))
        }
    }

    const changeAmbianceVolume = (name: string, vol: number) => {
        setAmbianceVolumes((prev) => ({ ...prev, [name]: vol }))
        const engine = enginesRef.current[name]
        if (engine) engine.gain.gain.value = vol
    }

    // Cleanup all engines on unmount
    useEffect(() => {
        const engines = enginesRef.current
        return () => {
            Object.values(engines).forEach((e) => e?.stop())
        }
    }, [])

    // Close panel on outside click
    useEffect(() => {
        function down(e: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
        }
        if (open) document.addEventListener('mousedown', down)
        return () => document.removeEventListener('mousedown', down)
    }, [open])

    return (
        <>
            <style>{`
                @keyframes lofi-bar { from { height: 3px } to { height: 16px } }
            `}</style>

            <div className="relative" ref={panelRef}>
                {/* Trigger */}
                <button
                    onClick={() => setOpen(o => !o)}
                    className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all',
                        (playing || anyAmbiancePlaying)
                            ? 'border-primary/60 text-primary bg-primary/8'
                            : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                    )}
                    title="Music & Ambiance"
                >
                    <Music2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex items-end gap-px" style={{ height: 16 }}>
                        {[0, 150, 300, 80].map((delay, i) => (
                            <span key={i} style={{
                                display: 'inline-block', width: 3, borderRadius: 2,
                                background: 'currentColor', height: (playing || anyAmbiancePlaying) ? undefined : 3,
                                animation: (playing || anyAmbiancePlaying) ? `lofi-bar 0.8s ease-in-out ${delay}ms infinite alternate` : 'none',
                                minHeight: 3, maxHeight: 16,
                            }} />
                        ))}
                    </span>
                </button>

                {/* Panel */}
                {open && (
                    <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                        {/* Tabs */}
                        <div className="flex border-b border-border/60">
                            <button
                                onClick={() => setTab('music')}
                                className={cn(
                                    'flex-1 px-3 py-2 text-xs font-medium transition-colors',
                                    tab === 'music'
                                        ? 'text-foreground border-b-2 border-primary'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                Music
                            </button>
                            <button
                                onClick={() => setTab('ambiance')}
                                className={cn(
                                    'flex-1 px-3 py-2 text-xs font-medium transition-colors',
                                    tab === 'ambiance'
                                        ? 'text-foreground border-b-2 border-primary'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                Ambiance
                            </button>
                        </div>

                        {tab === 'music' ? (
                            <div className="px-4 py-3 space-y-3">
                                {/* Header */}
                                <div className="flex items-center gap-2">
                                    <Radio className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-xs font-semibold">{station.name}</span>
                                    {loading && <span className="ml-auto text-[10px] text-muted-foreground animate-pulse">connecting…</span>}
                                    {playing && !loading && <span className="ml-auto text-[10px] text-green-500">● live</span>}
                                </div>

                                {/* Play / Pause */}
                                <button
                                    onClick={toggle}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
                                >
                                    {loading ? (
                                        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                    ) : playing ? (
                                        <><Pause className="h-4 w-4" /> Pause</>
                                    ) : (
                                        <><Play className="h-4 w-4" /> Play lofi</>
                                    )}
                                </button>

                                {error && <p className="text-[10px] text-destructive text-center">{error}</p>}

                                {/* Volume */}
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setMuted(m => !m)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                                        {muted || volume === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                                    </button>
                                    <input
                                        type="range" min={0} max={1} step={0.02}
                                        value={muted ? 0 : volume}
                                        onChange={e => { setVolume(Number(e.target.value)); setMuted(false) }}
                                        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-border
                                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3
                                            [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full
                                            [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
                                    />
                                    <span className="text-[10px] text-muted-foreground w-6 text-right tabular-nums">
                                        {muted ? '0' : Math.round(volume * 100)}%
                                    </span>
                                </div>

                                {/* Station picker */}
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Stations</p>
                                    {STATIONS.map((s, i) => (
                                        <button
                                            key={s.name}
                                            onClick={() => switchStation(i)}
                                            className={cn(
                                                'w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors',
                                                i === stationIdx
                                                    ? 'bg-primary/10 text-primary font-medium'
                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                            )}
                                        >
                                            {s.name}
                                        </button>
                                    ))}
                                </div>

                                <p className="text-[9px] text-muted-foreground text-center opacity-60">
                                    streams via SomaFM
                                </p>
                            </div>
                        ) : (
                            <div className="px-4 py-3 space-y-3">
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                                    Layer ambient sounds
                                </p>
                                {AMBIANCE_SOUNDS.map((sound) => {
                                    const isPlaying = ambiancePlaying[sound.name]
                                    const vol = ambianceVolumes[sound.name] ?? 0.3
                                    const Icon = sound.icon
                                    return (
                                        <div key={sound.name} className="space-y-1.5">
                                            <button
                                                onClick={() => toggleAmbiance(sound.name)}
                                                className={cn(
                                                    'flex items-center gap-2 w-full text-xs px-2.5 py-1.5 rounded-lg transition-colors text-left',
                                                    isPlaying
                                                        ? 'bg-primary/10 text-primary font-medium'
                                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                )}
                                            >
                                                <Icon className="h-3.5 w-3.5 shrink-0" />
                                                <span className="flex-1">{sound.name}</span>
                                                {isPlaying && (
                                                    <Square className="h-3 w-3 fill-current opacity-60" />
                                                )}
                                            </button>
                                            {isPlaying && (
                                                <input
                                                    type="range" min={0} max={1} step={0.02}
                                                    value={vol}
                                                    onChange={(e) => changeAmbianceVolume(sound.name, Number(e.target.value))}
                                                    className="w-full h-1 rounded-full appearance-none cursor-pointer bg-border
                                                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2.5
                                                        [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:rounded-full
                                                        [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
                                                />
                                            )}
                                        </div>
                                    )
                                })}
                                <p className="text-[9px] text-muted-foreground text-center opacity-60">
                                    procedurally generated ambient sounds
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    )
}
