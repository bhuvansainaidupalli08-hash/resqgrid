import React from 'react';
import {
  ShieldAlert,
  Activity,
  Ship,
  Home,
  Radio,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Send,
  MapPin,
  Clock,
  HeartPulse
} from 'lucide-react';

export default function OverviewDashboard({
  stats,
  requests = [],
  shelters = [],
  alerts = [],
  onNavigateTab,
  onSelectRequest
}) {
  const criticalRequests = requests.filter((r) => r.urgency_level === 'CRITICAL' && r.status !== 'RESOLVED');
  const unconfirmedAlerts = alerts.filter((a) => a.credibility === 'DISPUTED' || a.credibility === 'UNCONFIRMED');

  const shelterTotalCap = shelters.reduce((acc, s) => acc + s.capacity, 0);
  const shelterCurrentOcc = shelters.reduce((acc, s) => acc + s.current_occupancy, 0);
  const shelterOccPct = shelterTotalCap > 0 ? Math.round((shelterCurrentOcc / shelterTotalCap) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner Alert Ticker */}
      <div className="bg-red-950/40 border border-red-800/60 p-3.5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-400 shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-red-300 uppercase tracking-wide">
              IMPACTX 2026 Exercise Scenario Active &bull; Multi-Sector Flash Flood & Inundation
            </div>
            <div className="text-xs text-slate-300">
              Riverdale basin water levels cresting +1.8m. Northview power utility outage affecting medical oxygen units.
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('alerts')}
          className="px-3 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/50 rounded-lg text-xs font-semibold whitespace-nowrap transition"
        >
          View 4 Bulletins &rarr;
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Critical Emergencies */}
        <div
          onClick={() => onNavigateTab('requests')}
          className="bg-slate-900 border border-red-900/50 hover:border-red-600/60 p-4 rounded-xl cursor-pointer transition shadow-lg group"
        >
          <div className="flex items-center justify-between text-red-400 mb-2">
            <ShieldAlert className="w-5 h-5 group-hover:scale-110 transition" />
            <span className="text-[10px] font-bold uppercase bg-red-950/80 px-1.5 py-0.5 rounded border border-red-800 font-mono">
              TRIAGE
            </span>
          </div>
          <div className="text-2xl font-black text-white">{stats?.critical_requests ?? criticalRequests.length}</div>
          <div className="text-xs text-slate-400 font-medium mt-0.5">Critical Requests</div>
        </div>

        {/* Active Missions */}
        <div
          onClick={() => onNavigateTab('resources')}
          className="bg-slate-900 border border-sky-900/50 hover:border-sky-600/60 p-4 rounded-xl cursor-pointer transition shadow-lg group"
        >
          <div className="flex items-center justify-between text-sky-400 mb-2">
            <Activity className="w-5 h-5 group-hover:scale-110 transition" />
            <span className="text-[10px] font-bold uppercase bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-800 font-mono">
              LIVE
            </span>
          </div>
          <div className="text-2xl font-black text-white">{stats?.active_assignments ?? 0}</div>
          <div className="text-xs text-slate-400 font-medium mt-0.5">Active Missions</div>
        </div>

        {/* Available Fleet */}
        <div
          onClick={() => onNavigateTab('resources')}
          className="bg-slate-900 border border-emerald-900/50 hover:border-emerald-600/60 p-4 rounded-xl cursor-pointer transition shadow-lg group"
        >
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <Ship className="w-5 h-5 group-hover:scale-110 transition" />
            <span className="text-[10px] font-bold uppercase bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800 font-mono">
              FLEET
            </span>
          </div>
          <div className="text-2xl font-black text-white">{stats?.available_resources ?? 3}</div>
          <div className="text-xs text-slate-400 font-medium mt-0.5">Available Units</div>
        </div>

        {/* Shelter Occupancy */}
        <div
          onClick={() => onNavigateTab('shelters')}
          className="bg-slate-900 border border-amber-900/50 hover:border-amber-600/60 p-4 rounded-xl cursor-pointer transition shadow-lg group"
        >
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <Home className="w-5 h-5 group-hover:scale-110 transition" />
            <span className="text-[10px] font-bold uppercase bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800 font-mono">
              CAPACITY
            </span>
          </div>
          <div className="text-2xl font-black text-white">{shelterOccPct}%</div>
          <div className="text-xs text-slate-400 font-medium mt-0.5">{shelterCurrentOcc} / {shelterTotalCap} Beds</div>
        </div>

        {/* Flagged Alerts / Rumors */}
        <div
          onClick={() => onNavigateTab('alerts')}
          className="bg-slate-900 border border-purple-900/50 hover:border-purple-600/60 p-4 rounded-xl cursor-pointer transition shadow-lg group"
        >
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <Radio className="w-5 h-5 group-hover:scale-110 transition" />
            <span className="text-[10px] font-bold uppercase bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-800 font-mono">
              AUDIT
            </span>
          </div>
          <div className="text-2xl font-black text-white">{unconfirmedAlerts.length}</div>
          <div className="text-xs text-slate-400 font-medium mt-0.5">Flagged Rumors</div>
        </div>

        {/* Resolved Operations */}
        <div
          onClick={() => onNavigateTab('requests')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition shadow-lg group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition text-emerald-400" />
            <span className="text-[10px] font-bold uppercase bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 font-mono">
              RESOLVED
            </span>
          </div>
          <div className="text-2xl font-black text-white">{stats?.resolved_requests ?? 0}</div>
          <div className="text-xs text-slate-400 font-medium mt-0.5">Safely Evacuated</div>
        </div>
      </div>

      {/* Two Column Command Section: High Priority Triage & Scenario Integrity Check */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* High Priority Triage Queue */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <h3 className="font-bold text-sm text-white">Critical Triage Queue (Immediate Response)</h3>
              </div>
              <button
                onClick={() => onNavigateTab('requests')}
                className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
              >
                <span>All Requests</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {criticalRequests.slice(0, 3).map((req) => (
                <div
                  key={req.id}
                  onClick={() => onSelectRequest(req)}
                  className="bg-slate-950 border border-red-950/80 hover:border-red-600/60 p-3.5 rounded-lg cursor-pointer transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded">
                      {req.request_code}
                    </span>
                    <span className="text-[10px] font-bold uppercase bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded">
                      {req.urgency_level} &bull; {req.emergency_type}
                    </span>
                  </div>

                  <div className="font-bold text-xs text-white">{req.citizen_name} ({req.district})</div>
                  <p className="text-xs text-slate-300 line-clamp-2">{req.details}</p>

                  {req.special_needs && (
                    <div className="flex items-center space-x-1.5 text-[11px] text-red-400 font-semibold">
                      <HeartPulse className="w-3.5 h-3.5" />
                      <span>{req.special_needs}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-slate-800">
            <button
              onClick={() => onNavigateTab('intake')}
              className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition flex items-center justify-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit New Citizen Request</span>
            </button>
          </div>
        </div>

        {/* IMPACTX Challenge Scenario Checklist */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-white">IMPACTX Challenge Validation Test Cases</h3>
            </div>
            <span className="text-[11px] bg-slate-950 px-2 py-0.5 rounded font-mono text-slate-400">
              SYNTHETIC DATA
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* Case 1 */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-start space-x-2.5">
              <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-200">Oxygen-Dependent Bedridden Resident: </span>
                <span className="text-slate-400">
                  Harold Vance (REQ-2026-001) in Northview with failing battery inverter & power substation outage.
                </span>
              </div>
            </div>

            {/* Case 2 */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-start space-x-2.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-200">Elderly Resident Reported by Neighbour: </span>
                <span className="text-slate-400">
                  Margaret O'Malley (REQ-2026-002) in Eastwood reported by Martha Stewart; mobility impaired.
                </span>
              </div>
            </div>

            {/* Case 3 */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-start space-x-2.5">
              <span className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-200">Potentially Fake Evacuation Notice: </span>
                <span className="text-slate-400">
                  ALT-2026-01 (Southpoint Sector 4) flagged for review and disputed by official EOC sirens.
                </span>
              </div>
            </div>

            {/* Case 4 */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-start space-x-2.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-200">Conflicting Bridge Status Reports: </span>
                <span className="text-slate-400">
                  Riverdale Causeway Bridge (ALT-2026-02): civilian reports impassable vs Police Patrol lane open.
                </span>
              </div>
            </div>

            {/* Case 5 */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-start space-x-2.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-200">Stale Shelter Telemetry: </span>
                <span className="text-slate-400">
                  Eastwood High School Shelter headcount unverified for 6+ hours; flagged for manual audit.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
