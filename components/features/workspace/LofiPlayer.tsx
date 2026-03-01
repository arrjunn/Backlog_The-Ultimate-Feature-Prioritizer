'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Music2, Pause, Play, Volume2, VolumeX, Radio } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const STATIONS = [
    { name: 'Groove Salad', url: 'https://ice4.somafm.com/groovesalad-128-mp3' },
    { name: 'Drone Zone', url: 'https://ice4.somafm.com/dronezone-128-mp3' },
    { name: 'Lush', url: 'https://ice4.somafm.com/lush-128-mp3' },
    { name: 'Suburbs of Goa', url: 'https://ice4.somafm.com/suburbsofgoa-128-mp3' },
]

export function LofiPlayer() {
    const [playing, setPlaying] = useState(false)
    const [loading, setLoading] = useState(false)
    const [volume, setVolume] = useState(0.35)
    const [muted, setMuted] = useState(false)
    const [open, setOpen] = useState(false)
    const [stationIdx, setStationIdx] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    const station = STATIONS[stationIdx]

    // Rebuild audio when station changes
    const buildAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.src = ''
        }
        const audio = new Audio()
        audio.crossOrigin = 'anonymous'
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
        } catch (e: any) {
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
        // Auto-play new station
        setTimeout(async () => {
            const audio = buildAudio()
            audio.src = STATIONS[idx].url
            setLoading(true)
            try { await audio.play(); setPlaying(true) }
            catch { setError('Could not connect') }
            finally { setLoading(false) }
        }, 50)
    }

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
                        playing
                            ? 'border-primary/60 text-primary bg-primary/8'
                            : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                    )}
                    title="Lofi music"
                >
                    <Music2 className="h-3.5 w-3.5 shrink-0" />
                    {/* Animated bars */}
                    <span className="flex items-end gap-px" style={{ height: 16 }}>
                        {[0, 150, 300, 80].map((delay, i) => (
                            <span key={i} style={{
                                display: 'inline-block', width: 3, borderRadius: 2,
                                background: 'currentColor', height: playing ? undefined : 3,
                                animation: playing ? `lofi-bar 0.8s ease-in-out ${delay}ms infinite alternate` : 'none',
                                minHeight: 3, maxHeight: 16,
                            }} />
                        ))}
                    </span>
                </button>

                {/* Panel */}
                {open && (
                    <div className="absolute right-0 top-full mt-2 z-50 w-60 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                        {/* Header */}
                        <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-2">
                            <Radio className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-semibold">{station.name}</span>
                            {loading && <span className="ml-auto text-[10px] text-muted-foreground animate-pulse">connecting…</span>}
                            {playing && !loading && <span className="ml-auto text-[10px] text-green-500">● live</span>}
                        </div>

                        <div className="px-4 py-3 space-y-3">
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
                                streams via SomaFM · free & legal 🎧
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
