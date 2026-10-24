import React, { useState } from 'react';
import { Home, AlertTriangle, CheckCircle, Clock, Heart, Edit, RefreshCw } from 'lucide-react';
import { api } from '../api';

export default function ShelterManager({ shelters = [], role, onRefresh }) {
  const [editingShelter, setEditingShelter] = useState(null);
  const [occupancy, setOccupancy] = useState(0);
  const [suppliesStatus, setSuppliesStatus] = useState('ADEQUATE');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEditClick = (s) => {
    setEditingShelter(s);
    setOccupancy(s.current_occupancy);
    setSuppliesStatus(s.supplies_status);
  };

  const handleSaveShelter = async (e) => {
    e.preventDefault();
    if (!editingShelter) return;
    setIsUpdating(true);
    try {
      await api.updateShelter(
        editingShelter.id,
        {
          current_occupancy: parseInt(occupancy, 10),
          supplies_status: suppliesStatus,
          performed_by: 'Shelter Coordinator'
        },
        role
      );
      setIsUpdating(false);
      setEditingShelter(null);
      onRefresh();
    } catch (err) {
      setIsUpdating(false);
      alert(`Update failed: ${err.message}`);
    }
  };

  const getFreshnessDetails = (isoTimestamp) => {
    const elapsedMinutes = Math.floor((new Date() - new Date(isoTimestamp)) / (1000 * 60));
    const isStale = elapsedMinutes > 180; // Over 3 hours
    return {
      elapsedMinutes,
      isStale,
      label:
        elapsedMinutes < 60
          ? `${elapsedMinutes}m ago`
          : `${Math.floor(elapsedMinutes / 60)}h ${elapsedMinutes % 60}m ago`
    };
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Home className="w-5 h-5 text-emerald-400" />
              Evacuation Centers & Shelter Telemetry
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live capacity monitoring, supply reserves, and freshness auditing across disaster sectors.
            </p>
          </div>
          <span className="text-xs bg-slate-950 border border-slate-800 px-2.5 py-1 rounded font-mono text-slate-300 font-semibold">
            {shelters.length} Facilities Monitored
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shelters.map((s) => {
            const pct = Math.min(100, Math.round((s.current_occupancy / s.capacity) * 100));
            const freshness = getFreshnessDetails(s.freshness_timestamp);
            const isFull = pct >= 95;
            const isNear = pct >= 80 && !isFull;

            return (
              <div
                key={s.id}
                className={`bg-slate-950 border rounded-xl p-4 space-y-3.5 flex flex-col justify-between ${
                  freshness.isStale ? 'border-amber-700/60' : 'border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[11px] font-bold text-slate-400 uppercase bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {s.district} Sector
                      </span>
                      <h4 className="font-bold text-base text-white mt-1.5">{s.name}</h4>
                      <p className="text-xs text-slate-400">{s.address}</p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${
                        isFull
                          ? 'bg-rose-950 text-rose-300 border-rose-700'
                          : isNear
                          ? 'bg-amber-950 text-amber-300 border-amber-700'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>

                  {/* Freshness Flag Alert */}
                  {freshness.isStale && (
                    <div className="bg-amber-950/40 border border-amber-600/50 p-2 rounded text-xs text-amber-300 flex items-center space-x-2 my-2 font-medium">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        STALE TELEMETRY (Last updated {freshness.label}) — Field headcount audit required.
                      </span>
                    </div>
                  )}

                  {/* Capacity Bar */}
                  <div className="space-y-1.5 mt-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Shelter Occupancy:</span>
                      <span className="font-bold text-slate-200">
                        {s.current_occupancy} / {s.capacity} beds ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull ? 'bg-red-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Supplies & Medical */}
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Relief Supplies:</span>
                      <span
                        className={`font-semibold ${
                          s.supplies_status === 'CRITICAL'
                            ? 'text-red-400'
                            : s.supplies_status === 'LOW'
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {s.supplies_status}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Medical Support:</span>
                      <span className="font-semibold text-slate-200">
                        {s.medical_support ? 'Staffed Medic Unit' : 'Basic First Aid'}
                      </span>
                    </div>
                  </div>

                  {s.notes && (
                    <p className="text-[11px] text-slate-400 mt-2 italic bg-slate-900/40 p-2 rounded">
                      {s.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">
                    Telemetry Freshness: <span className="font-mono text-slate-300">{freshness.label}</span>
                  </span>
                  {role === 'coordinator' && (
                    <button
                      onClick={() => handleEditClick(s)}
                      className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition font-semibold"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Update Count</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Occupancy Modal */}
      {editingShelter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl p-5 shadow-2xl">
            <h3 className="font-bold text-base text-white mb-1">
              Update Headcount: {editingShelter.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Updating occupancy will refresh telemetry timestamp and notify district logistics.
            </p>

            <form onSubmit={handleSaveShelter} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Current Headcount (Capacity: {editingShelter.capacity})
                </label>
                <input
                  type="number"
                  min={0}
                  max={editingShelter.capacity * 2}
                  value={occupancy}
                  onChange={(e) => setOccupancy(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Supplies Status</label>
                <select
                  value={suppliesStatus}
                  onChange={(e) => setSuppliesStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
                >
                  <option value="ADEQUATE">ADEQUATE (Sufficient rations & water)</option>
                  <option value="LOW">LOW (Replenishment requested within 6 hrs)</option>
                  <option value="CRITICAL">CRITICAL (Immediate logistics air/truck drop required)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingShelter(null)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold"
                >
                  {isUpdating ? 'Saving...' : 'Confirm Update & Reset Freshness'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
