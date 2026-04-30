/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Terminal, 
  Search, 
  Trash2, 
  Pause, 
  Play, 
  Filter, 
  Info, 
  AlertTriangle, 
  XCircle, 
  Bug, 
  Code,
  Copy,
  ChevronRight,
  Monitor,
  Server
} from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: string;
  metadata?: any;
  source?: string;
}

const LEVEL_COLORS: Record<LogLevel, string> = {
  trace: 'text-zinc-500',
  debug: 'text-blue-400',
  info: 'text-emerald-400',
  warn: 'text-amber-400',
  error: 'text-rose-500',
};

const LEVEL_ICONS: Record<LogLevel, any> = {
  trace: Code,
  debug: Bug,
  info: Info,
  warn: AlertTriangle,
  error: XCircle,
};

export default function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState<string>('');
  const [selectedLevels, setSelectedLevels] = useState<Set<LogLevel>>(new Set(['debug', 'info', 'warn', 'error']));
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showIntegration, setShowIntegration] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.onmessage = (event) => {
      if (isPaused) return;

      const data = JSON.parse(event.data);
      
      if (data.type === 'init') {
        setLogs(data.logs);
      } else {
        setLogs(prev => [...prev, data].slice(-1000));
      }
    };

    return () => eventSource.close();
  }, [isPaused]);

  useEffect(() => {
    if (!isPaused && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesLevel = selectedLevels.has(log.level);
      const matchesFilter = log.message.toLowerCase().includes(filter.toLowerCase()) || 
                          log.source?.toLowerCase().includes(filter.toLowerCase());
      return matchesLevel && matchesFilter;
    });
  }, [logs, selectedLevels, filter]);

  const toggleLevel = (level: LogLevel) => {
    const next = new Set(selectedLevels);
    if (next.has(level)) next.delete(level);
    else next.add(level);
    setSelectedLevels(next);
  };

  const clearLogs = () => setLogs([]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden font-mono text-zinc-300">
      {/* Container simulating a terminal window */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header / Window Title Bar */}
        <header className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 justify-between shrink-0 select-none">
          <div className="flex items-center gap-6">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-zinc-800 border border-zinc-700" />
              <div className="w-3 h-3 rounded-full bg-zinc-800 border border-zinc-700" />
              <div className="w-3 h-3 rounded-full bg-zinc-800 border border-zinc-700" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">$</span>
              <span className="text-zinc-100 font-bold tracking-tight">remix-logforge-rs</span>
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 border border-zinc-700">v1.0.0-stable</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-zinc-400">Session: active</span>
            </div>
            <div className="h-4 w-px bg-zinc-800" />
            <span className="text-zinc-500 uppercase tracking-widest text-[10px]">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} {new Date().toLocaleTimeString('en-US', { hour12: false })}
            </span>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar / Filters */}
          <aside className="w-16 md:w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
            <div className="p-4 flex flex-col gap-6 overflow-y-auto">
              {/* Search */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-2 font-semibold">Filter Logs</label>
                <div className="relative group">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                  <input 
                    type="text"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="grep..."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded py-1.5 pl-8 pr-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-700"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-700 font-bold">/</span>
                </div>
              </div>

              {/* Log Levels */}
              <div className="hidden md:block">
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-2 font-semibold">Levels</label>
                <div className="space-y-1">
                  {(['trace', 'debug', 'info', 'warn', 'error'] as LogLevel[]).map(level => {
                    const isActive = selectedLevels.has(level);
                    const count = logs.filter(l => l.level === level).length;
                    return (
                      <button
                        key={level}
                        onClick={() => toggleLevel(level)}
                        className={cn(
                          "w-full flex items-center justify-between text-xs px-2 py-1.5 rounded border transition-all",
                          isActive 
                            ? "bg-zinc-800 border-zinc-700 text-zinc-100" 
                            : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-400 hover:bg-zinc-800/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full", {
                            'bg-zinc-500': level === 'trace',
                            'bg-blue-400': level === 'debug',
                            'bg-emerald-400': level === 'info',
                            'bg-amber-400': level === 'warn',
                            'bg-rose-500': level === 'error',
                          })} />
                          <span className="capitalize">{level}</span>
                        </div>
                        <span className="text-[10px] opacity-50">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tools */}
              <div className="hidden md:block border-t border-zinc-800 pt-6">
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-2 font-semibold">Actions</label>
                <div className="space-y-1">
                  <button 
                    onClick={() => setIsPaused(!isPaused)}
                    className="w-full flex items-center gap-2 text-xs px-2 py-1.5 text-zinc-400 hover:bg-zinc-800 rounded transition-colors"
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    <span>{isPaused ? "Resume Tail" : "Pause Tail"}</span>
                  </button>
                  <button 
                    onClick={clearLogs}
                    className="w-full flex items-center gap-2 text-xs px-2 py-1.5 text-zinc-400 hover:bg-zinc-800 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Buffer</span>
                  </button>
                  <button 
                    onClick={() => setShowIntegration(!showIntegration)}
                    className="w-full flex items-center gap-2 text-xs px-2 py-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded transition-colors"
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Show Integration</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-auto p-4 bg-zinc-950/30 border-t border-zinc-800 hidden md:block">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-sm bg-green-500" />
                <span className="text-[10px] text-green-500 font-bold">READY</span>
              </div>
              <span className="text-[10px] text-zinc-600 uppercase tracking-tighter">Socket v1.0.2 linked</span>
            </div>
          </aside>

          {/* Main Log View */}
          <main className="flex-1 bg-zinc-950 flex flex-col overflow-hidden relative">
            {/* Headers in the terminal area */}
            <div className="flex gap-4 px-4 py-2 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur z-10 text-[10px] font-bold text-zinc-500 tracking-wider h-9 shrink-0 items-center">
              <span className="w-24">TIMESTAMP</span>
              <span className="w-16">LEVEL</span>
              <span className="w-24">SOURCE</span>
              <span>MESSAGE</span>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-2 space-y-0.5"
            >
              <AnimatePresence initial={false}>
                {filteredLogs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-4 opacity-50">
                    <Terminal className="w-12 h-12 text-zinc-800" />
                    <p className="text-xs tracking-widest uppercase">Buffer empty. Awaiting signals...</p>
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <motion.div 
                      key={log.id}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => setSelectedLog(log)}
                      className={cn(
                        "group flex gap-4 text-[13px] leading-relaxed cursor-pointer -mx-4 px-4 py-0.5 transition-colors border-l-2",
                        log.level === 'error' ? 'border-rose-500/50' : 
                        log.level === 'warn' ? 'border-amber-500/50' : 'border-transparent',
                        selectedLog?.id === log.id ? "bg-blue-500/10" : "hover:bg-zinc-900/50"
                      )}
                    >
                      <span className="w-24 shrink-0 text-zinc-600 select-none">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
                      </span>
                      <span className={cn("w-16 shrink-0 font-bold", {
                        'text-zinc-500': log.level === 'trace',
                        'text-blue-400': log.level === 'debug',
                        'text-emerald-400': log.level === 'info',
                        'text-amber-400': log.level === 'warn',
                        'text-rose-400': log.level === 'error',
                      })}>
                        {log.level.toUpperCase()}
                      </span>
                      <span className="w-24 shrink-0 text-zinc-500 truncate flex items-center gap-1">
                        {log.source === 'server' ? <Server className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                        {log.source}
                      </span>
                      <span className={cn("flex-1 break-all whitespace-pre-wrap", 
                        log.level === 'error' ? 'text-rose-100 italic' : 
                        log.level === 'warn' ? 'text-amber-100' : 'text-zinc-200'
                      )}>
                        {log.message}
                      </span>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Listening Indicator */}
            {!isPaused && (
              <div className="absolute bottom-2 left-4 flex items-center gap-2 pointer-events-none select-none">
                <span className="text-zinc-500 text-[11px] uppercase tracking-widest font-bold opacity-50">listening</span>
                <span className="w-2 h-4 bg-zinc-700 animate-pulse" />
              </div>
            )}
          </main>
        </div>

        {/* Bottom Status Bar */}
        <footer className="h-8 bg-blue-600 text-white flex items-center px-4 justify-between text-[11px] font-bold uppercase tracking-wider shrink-0 select-none">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full bg-white", !isPaused && "animate-pulse")} />
              <span>CONNECTED</span>
              <span className="opacity-60 hidden md:inline">127.0.0.1:3000</span>
            </div>
            <div className="h-3 w-px bg-white/20 hidden md:block" />
            <div className="hidden md:flex items-center gap-2">
              <span>BUFF: {logs.length}/1000</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="opacity-60 text-[10px]">CPU</span>
                <span>0.1%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="opacity-60 text-[10px]">MEM</span>
                <span>32MB</span>
              </div>
            </div>
            <div className="bg-white text-blue-600 px-2 py-0.5 rounded-sm text-[10px]">
              LIVE TAIL
            </div>
          </div>
        </footer>
      </div>

      {/* Entry Details Drawer / Integration Guide */}
      <AnimatePresence>
        {(selectedLog || showIntegration) && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-96 border-l border-zinc-800 bg-zinc-900 shadow-2xl flex flex-col z-50 fixed right-0 top-0 bottom-0 overflow-hidden"
          >
            <div className="h-12 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
              <h2 className="font-bold text-[10px] tracking-widest uppercase text-zinc-400">
                {showIntegration ? "SETUP GUIDE" : "METADATA RECAP"}
              </h2>
              <button 
                onClick={() => { setSelectedLog(null); setShowIntegration(false); }}
                className="p-1 hover:text-white transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {showIntegration ? (
                <div className="space-y-6">
                  <section>
                    <h3 className="text-blue-400 text-[11px] font-bold uppercase tracking-widest mb-3">1. Add Logger Utility</h3>
                    <p className="text-zinc-500 text-xs mb-3 italic">Place this in <code className="text-zinc-300">app/utils/log.ts</code></p>
                    <div className="relative group">
                      <pre className="bg-zinc-950 p-4 rounded border border-zinc-800 text-[10px] overflow-x-auto text-emerald-500">
{`const REMOTE_URL = "/api/logs";

export const log = (msg: any, level = 'info') => {
  fetch(REMOTE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      level,
      message: typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2),
      source: typeof window === 'undefined' ? 'server' : 'browser',
      timestamp: new Date().toISOString()
    })
  }).catch(() => {});
};`}
                      </pre>
                      <button 
                        onClick={() => copyToClipboard(`const REMOTE_URL = "/api/logs";\n\nexport const log = (msg: any, level = 'info') => {\n  fetch(REMOTE_URL, {\n    method: 'POST', \n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify({\n      level,\n      message: typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2),\n      source: typeof window === 'undefined' ? 'server' : 'browser',\n      timestamp: new Date().toISOString()\n    })\n  }).catch(() => {});\n};`)}
                        className="absolute top-2 right-2 p-1.5 bg-zinc-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </section>
                  <section>
                    <h3 className="text-blue-400 text-[11px] font-bold uppercase tracking-widest mb-3">2. Instrumentation</h3>
                    <pre className="bg-zinc-950 p-4 rounded border border-zinc-800 text-[10px] text-zinc-300">
{`import { log } from "~/utils/log";

export const loader = async () => {
  log("Fetching user profile", "debug");
  // ... rest of code
};`}
                    </pre>
                  </section>
                </div>
              ) : selectedLog && (
                <div className="space-y-6">
                  <div>
                    <label className="text-zinc-500 uppercase font-bold tracking-widest text-[10px] mb-2 block">Precise Timestamp</label>
                    <p className="text-zinc-100 text-sm font-mono">{selectedLog.timestamp}</p>
                  </div>
                  <div>
                    <label className="text-zinc-500 uppercase font-bold tracking-widest text-[10px] mb-2 block">Level / Severity</label>
                    <div className={cn("inline-flex items-center gap-2 px-2 py-1 rounded text-[10px] font-bold uppercase", {
                      'text-zinc-400 bg-zinc-800 border-zinc-700': selectedLog.level === 'trace',
                      'text-blue-400 bg-blue-500/10 border-blue-500/20': selectedLog.level === 'debug',
                      'text-emerald-400 bg-emerald-500/10 border-emerald-500/20': selectedLog.level === 'info',
                      'text-amber-400 bg-amber-500/10 border-amber-500/20': selectedLog.level === 'warn',
                      'text-rose-400 bg-rose-500/10 border-rose-500/20': selectedLog.level === 'error',
                    }, "border")}>
                      {selectedLog.level}
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 uppercase font-bold tracking-widest text-[10px] mb-2 block">Raw Payload</label>
                    <pre className="bg-zinc-950 p-4 rounded border border-zinc-800 text-zinc-100 text-[10px] whitespace-pre-wrap break-all font-mono leading-relaxed">
                      {selectedLog.message}
                    </pre>
                  </div>
                  {selectedLog.metadata && (
                    <div>
                      <label className="text-zinc-500 uppercase font-bold tracking-widest text-[10px] mb-2 block">Context Data</label>
                      <pre className="bg-zinc-950 p-4 rounded border border-zinc-800 text-zinc-400 text-[10px] overflow-auto font-mono">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

