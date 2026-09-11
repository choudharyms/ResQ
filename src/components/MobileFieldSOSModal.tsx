import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Mic,
  MicOff,
  MapPin,
  Send,
  Sparkles,
  Waves,
  Mountain,
  Volume2,
} from 'lucide-react';
import { useDisasterStore } from '../stores/useDisasterStore';
import { EventType } from '../types/disaster';
import { playChirp } from '../utils/soundFx';

export const MobileFieldSOSModal: React.FC = () => {
  const { isFieldFormOpen, setFieldFormOpen, addIncident, isDegradedMode, isMuted } = useDisasterStore();

  const [zoneName, setZoneName] = useState('Gaurikund Riverside Base');
  const [eventType, setEventType] = useState<EventType>('FLOOD');
  const [affected, setAffected] = useState(65);
  const [trapped, setTrapped] = useState(18);
  const [injured, setInjured] = useState(6);
  const [accessNote, setAccessNote] = useState('Water entering market stalls; bridge partially submerged');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Oscilloscope animation while recording
  useEffect(() => {
    if (!isRecording || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const renderWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#38BDF8';
      ctx.beginPath();

      const sliceWidth = canvas.width / 40;
      let x = 0;

      for (let i = 0; i < 40; i++) {
        const v = Math.sin(i * 0.25 + phase) * 12 + Math.cos(i * 0.45 - phase) * 8;
        const y = canvas.height / 2 + v;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();
      phase += 0.2;
      animationFrameRef.current = requestAnimationFrame(renderWave);
    };

    renderWave();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording]);

  if (!isFieldFormOpen) return null;

  const handleApplyPreset = (preset: {
    name: string;
    type: EventType;
    affected: number;
    trapped: number;
    injured: number;
    note: string;
  }) => {
    playChirp(isMuted);
    setZoneName(preset.name);
    setEventType(preset.type);
    setAffected(preset.affected);
    setTrapped(preset.trapped);
    setInjured(preset.injured);
    setAccessNote(preset.note);
  };

  const handleSimulateVoice = () => {
    playChirp(isMuted);
    setIsRecording(true);
    setVoiceTranscript('Listening to tactical distress voice stream...');

    setTimeout(() => {
      setIsRecording(false);
      playChirp(isMuted);
      setVoiceTranscript(
        'Voice SOS Transcribed: "Severe Alaknanda flash flood at Gaurikund. 65 pilgrims stranded near market ghats, 18 trapped by rapid currents, water rising. Urgent boats needed."'
      );
      setZoneName('Gaurikund Ghat');
      setEventType('FLOOD');
      setAffected(65);
      setTrapped(18);
      setInjured(6);
      setAccessNote('Voice verified: Pilgrims trapped on temple roof, current too fast for foot crossing');
    }, 1800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addIncident({
      zoneName,
      eventType,
      casualties: {
        affected,
        trapped,
        injured,
        missing: 0,
        children: Math.floor(affected * 0.2),
        elderly: Math.floor(affected * 0.15),
      },
      location: { lat: 30.589, lng: 79.034 },
      accessNote,
    });
    setFieldFormOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-surface-panel border border-border-strong rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-border-subtle flex items-center justify-between gap-3 bg-surface-panel/90">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-content-primary font-mono">
                Field SOS Distress Intake
              </h3>
              <p className="text-[11px] text-content-muted">
                Gemini Flash Multimodal Ingestion &bull; Anti-Phantom Demand
              </p>
            </div>
          </div>

          <button
            onClick={() => setFieldFormOpen(false)}
            className="p-1 rounded-md text-content-muted hover:text-content-primary hover:bg-surface-card transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1 space-y-4 text-xs font-sans">
          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-content-muted uppercase tracking-wider font-mono">
              Quick Scenarios (1-Tap Simulation)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() =>
                  handleApplyPreset({
                    name: 'Gaurikund Market Ghat',
                    type: 'FLOOD',
                    affected: 75,
                    trapped: 24,
                    injured: 8,
                    note: 'River flooded ground floor of pilgrim lodge; trapped on balcony',
                  })
                }
                className="p-2 rounded-lg bg-surface-card hover:bg-surface-hover border border-border-subtle text-left transition-colors"
              >
                <div className="flex items-center gap-1 font-bold text-blue-400 font-mono">
                  <Waves className="h-3.5 w-3.5" /> Flash Flood Trapped
                </div>
                <p className="text-[10px] text-content-muted mt-0.5">75 affected &bull; 24 trapped</p>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleApplyPreset({
                    name: 'Helang Rockfall Sector',
                    type: 'LANDSLIDE',
                    affected: 40,
                    trapped: 12,
                    injured: 10,
                    note: 'Boulders crushed 2 buses on highway; medical trauma squad required',
                  })
                }
                className="p-2 rounded-lg bg-surface-card hover:bg-surface-hover border border-border-subtle text-left transition-colors"
              >
                <div className="flex items-center gap-1 font-bold text-amber-400 font-mono">
                  <Mountain className="h-3.5 w-3.5" /> Landslide Highway Cut
                </div>
                <p className="text-[10px] text-content-muted mt-0.5">40 affected &bull; 10 injured</p>
              </button>
            </div>
          </div>

          {/* Voice Input Section */}
          <div className="p-3 rounded-lg bg-surface-card border border-border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-content-primary font-mono flex items-center gap-1">
                <Mic className="h-3.5 w-3.5 text-indigo-400" /> Web Voice Audio SOS
              </span>
              <button
                type="button"
                onClick={handleSimulateVoice}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold flex items-center gap-1 transition-all ${
                  isRecording
                    ? 'bg-status-critical text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {isRecording ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                {isRecording ? 'Transcribing...' : 'Record Voice Audio'}
              </button>
            </div>

            {/* Animated Waveform Canvas */}
            {isRecording && (
              <div className="bg-surface-canvas p-2 rounded border border-sky-500/40 flex flex-col items-center justify-center gap-1">
                <canvas
                  ref={canvasRef}
                  width={380}
                  height={40}
                  className="w-full h-10 rounded bg-slate-950/80"
                />
                <span className="text-[10px] text-sky-400 font-mono flex items-center gap-1">
                  <Volume2 className="h-3 w-3" /> Live Audio Frequency Spectrum Detected (16 kHz PCM)
                </span>
              </div>
            )}

            {voiceTranscript && (
              <p className="text-[11px] font-mono text-indigo-300 bg-surface-canvas p-2 rounded border border-border-subtle leading-relaxed">
                {voiceTranscript}
              </p>
            )}
          </div>

          {/* Location & Sector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-content-secondary font-mono">
              Sector / Landmark Name *
            </label>
            <input
              type="text"
              required
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              className="w-full bg-surface-canvas border border-border-strong rounded-md px-3 py-1.5 text-xs text-content-primary focus:border-border-focus focus:outline-none"
            />
          </div>

          {/* Event Type & Road Access */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-content-secondary font-mono">
                Disaster Event Type
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
                className="w-full bg-surface-canvas border border-border-strong rounded-md px-2 py-1.5 text-xs text-content-primary focus:border-border-focus focus:outline-none"
              >
                <option value="FLOOD">Flash Flood</option>
                <option value="LANDSLIDE">Mountain Landslide</option>
                <option value="COLLAPSE">Structural Collapse</option>
                <option value="MEDICAL_SURGE">Medical Surge</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-content-secondary font-mono">
                GPS Coordinates
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  readOnly
                  value="30.5890° N, 79.0340° E"
                  className="w-full bg-surface-canvas border border-border-strong rounded-md px-2 py-1.5 text-xs text-content-muted font-mono"
                />
                <button
                  type="button"
                  className="p-1.5 rounded bg-surface-card border border-border-strong text-content-primary"
                  title="Use Device GPS"
                >
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Casualties Inputs */}
          <div className="grid grid-cols-3 gap-2 font-mono">
            <div>
              <label className="text-[10px] text-content-muted uppercase">Affected</label>
              <input
                type="number"
                min="1"
                value={affected}
                onChange={(e) => setAffected(Number(e.target.value))}
                className="w-full bg-surface-canvas border border-border-strong rounded-md px-2 py-1 text-xs text-content-primary focus:border-border-focus"
              />
            </div>
            <div>
              <label className="text-[10px] text-content-muted uppercase">Trapped</label>
              <input
                type="number"
                min="0"
                value={trapped}
                onChange={(e) => setTrapped(Number(e.target.value))}
                className="w-full bg-surface-canvas border border-border-strong rounded-md px-2 py-1 text-xs text-status-critical focus:border-border-focus"
              />
            </div>
            <div>
              <label className="text-[10px] text-content-muted uppercase">Injured</label>
              <input
                type="number"
                min="0"
                value={injured}
                onChange={(e) => setInjured(Number(e.target.value))}
                className="w-full bg-surface-canvas border border-border-strong rounded-md px-2 py-1 text-xs text-status-high focus:border-border-focus"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-content-secondary font-mono">
              On-Ground Situation Note
            </label>
            <textarea
              rows={2}
              value={accessNote}
              onChange={(e) => setAccessNote(e.target.value)}
              className="w-full bg-surface-canvas border border-border-strong rounded-md p-2 text-xs text-content-primary focus:border-border-focus focus:outline-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <Send className="h-4 w-4" />
            <span>{isDegradedMode ? 'Buffer Report in IndexedDB (Offline)' : 'Submit SOS to Information Fusion Engine'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
