import React from 'react';
import { ShieldAlert, Wifi, WifiOff, RefreshCw, UserCheck, Eye, Database, AlertTriangle } from 'lucide-react';

export default function Header({
  isOnline,
  simulateOffline,
  setSimulateOffline,
  role,
  setRole,
  draftsCount,
  onSeedData,
  onRefreshAll,
  isLoading
}) {
  const effectiveOnline = isOnline && !simulateOffline;

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 px-4 lg:px-8 py-3">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Mission Status */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/10">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-white">ResQ<span className="text-red-500">Grid</span></span>
              <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded tracking-wide uppercase">
                IMPACTX 2026
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Disaster Relief: From Alert to Assistance
            </p>
          </div>
        </div>

        {/* Global Status Badges & Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Network status indicator with manual toggle */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            {effectiveOnline ? (
              <div className="flex items-center space-x-1.5 text-emerald-400">
                <Wifi className="w-3.5 h-3.5" />
                <span className="font-semibold">ONLINE</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 text-amber-400 animate-pulse">
                <WifiOff className="w-3.5 h-3.5" />
                <span className="font-bold">OFFLINE DRAFT MODE</span>
              </div>
            )}
            <button
              onClick={() => setSimulateOffline(!simulateOffline)}
              title="Toggle to test offline draft and queuing behavior"
              className={`ml-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded transition ${
                simulateOffline
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {simulateOffline ? 'Disable Sim' : 'Simulate Drop'}
            </button>
          </div>

          {/* Unsent drafts indicator */}
          {draftsCount > 0 && (
            <div className="flex items-center space-x-1.5 bg-amber-500/15 border border-amber-500/40 text-amber-300 px-2.5 py-1 rounded-lg text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
              <span>{draftsCount} Unsent Draft{draftsCount > 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Role selector for Demonstrating Privacy Masking */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setRole('coordinator')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded transition text-xs font-semibold ${
                role === 'coordinator'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Coordinator</span>
            </button>
            <button
              onClick={() => setRole('public')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded transition text-xs font-semibold ${
                role === 'public'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Public View</span>
            </button>
          </div>

          {/* Seed demo dataset button */}
          <button
            onClick={onSeedData}
            title="Reset/Seed synthetic test scenario data"
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition"
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Reset Test Data</span>
          </button>

          {/* Refresh all */}
          <button
            onClick={onRefreshAll}
            disabled={isLoading}
            title="Refresh operational data"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-red-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
