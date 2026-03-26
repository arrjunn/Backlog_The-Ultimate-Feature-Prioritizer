'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Music2, Pause, Play, Volume2, VolumeX, Radio, CloudRain, Wind, Coffee, Waves } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

const STATIONS = [
    { name: 'Groove Salad', url: 'https://ice4.somafm.com/groovesalad-128-mp3' },
    { name: 'Drone Zone', url: 'https://ice4.somafm.com/dronezone-128-mp3' },
    { name: 'Lush', url: 'https://ice4.somafm.com/lush-128-mp3' },
    { name: 'Suburbs of Goa', url: 'https://ice4.somafm.com/suburbsofgoa-128-mp3' },
]

const AMBIANCE = [
    { name: 'Rain', icon: CloudRain, url: 'https://cdn.freesound.org/previews/243/243627_1015240-lq.mp3' },
    { name: 'Wind', icon: Wind, url: 'https://cdn.freesound.org/previews/244/244944_4486188-lq.mp3' },
    { name: 'Cafe', icon: Coffee, url: 'https://cdn.freesound.org/previews/348/348425_4930987-lq.mp3' },
    { name: 'Waves', icon: Waves, url: 'https://cdn.freesound.org/previews/400/400632_7601831-lq.mp3' },
]

interface AmbianceState {
    playing: boolean
    volume: number
    audio: HTMLAudioElement | null
}

export function LofiPlayer() {
    const [playing, setPlaying] = useState(false)
    const [loading, setLoading] = useState(false)
    const [volume, setVolume] = useState(0.35)
    const [muted, setMuted] = useState(false)
    const [open, setOpen] = useState(false)
    const [stationIdx, setStationIdx] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [tab, setTab] = useState<'music' | 'ambiance'>('music')
    const [ambiance, setAmbiance] = useState<Record<string, AmbianceState>>(() =>
        Object.fromEntries(AMBIANCE.map((a) => [a.name, { playing: false, volume: 0.3, audio: null }]))
    )
    const [ambianceErrors, setAmbianceErrors] = useState<Record<string, boolean>>({})
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    const station = STATIONS[stationIdx]
    const anyAmbiancePlaying = Object.values(ambiance).some((a) => a.playing)

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
        return () => {
            audioRef.current?.pause()
        }
    }, [buildAudio])

    // Sync volume / mute
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

    // Ambiance controls
    const toggleAmbiance = (name: string) => {
        setAmbiance((prev) => {
            const state = prev[name]
            if (state.playing) {
                state.audio?.pause()
                return { ...prev, [name]: { ...state, playing: false } }
            } else {
                const sound = AMBIANCE.find((a) => a.name === name)
                if (!sound) return prev
                let audio = state.audio
                if (!audio) {
                    audio = new Audio(sound.url)
                    audio.crossOrigin = 'anonymous'
                    audio.loop = true
                    audio.volume = state.volume
                    audio.onerror = () => {
                        setAmbianceErrors((prev) => ({ ...prev, [name]: true }))
                        toast.error(`Failed to load ${name} sound`)
                        setAmbiance((prev) => ({ ...prev, [name]: { ...prev[name], playing: false } }))
                    }
                }
                setAmbianceErrors((prev) => ({ ...prev, [name]: false }))
                audio.play().catch(() => {
                    setAmbianceErrors((prev) => ({ ...prev, [name]: true }))
                    toast.error(`Could not play ${name} — audio unavailable`)
                    setAmbiance((prev) => ({ ...prev, [name]: { ...prev[name], playing: false } }))
                })
                return { ...prev, [name]: { ...state, playing: true, audio } }
            }
        })
    }

    const setAmbianceVolume = (name: string, vol: number) => {
        setAmbiance((prev) => {
            const state = prev[name]
            if (state.audio) state.audio.volume = vol
            return { ...prev, [name]: { ...state, volume: vol } }
        })
    }

    // Cleanup ambiance on unmount
    useEffect(() => {
        return () => {
            Object.values(ambiance).forEach((a) => a.audio?.pause())
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
                                {AMBIANCE.map((sound) => {
                                    const state = ambiance[sound.name]
                                    const Icon = sound.icon
                                    return (
                                        <div key={sound.name} className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => toggleAmbiance(sound.name)}
                                                    className={cn(
                                                        'flex items-center gap-2 flex-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors text-left',
                                                        state.playing
                                                            ? 'bg-primary/10 text-primary font-medium'
                                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                                        ambianceErrors[sound.name] && 'opacity-60'
                                                    )}
                                                >
                                                    <Icon className="h-3.5 w-3.5 shrink-0" />
                                                    {sound.name}
                                                </button>
                                                {ambianceErrors[sound.name] && (
                                                    <span className="text-[10px] text-destructive shrink-0">unavailable</span>
                                                )}
                                            </div>
                                            {state.playing && (
                                                <input
                                                    type="range" min={0} max={1} step={0.02}
                                                    value={state.volume}
                                                    onChange={(e) => setAmbianceVolume(sound.name, Number(e.target.value))}
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
                                    sounds from freesound.org
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    )
}
