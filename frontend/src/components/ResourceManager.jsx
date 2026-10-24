import React, { useState } from 'react';
import {
  Ship,
  Truck,
  Activity,
  Users,
  CheckCircle,
  AlertOctagon,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Plus
} from 'lucide-react';
import { api } from '../api';

export default function ResourceManager({
  resources = [],
  assignments = [],
  role,
  onRefresh
}) {
  const [updatingAsgId, setUpdatingAsgId] = useState(null);
  const [updatingResId, setUpdatingResId] = useState(null);

  const handleUpdateAssignmentStatus = async (asgId, newStatus) => {
    setUpdatingAsgId(asgId);
    try {
      await api.updateAssignmentStatus(
        asgId,
        {
          status: newStatus,
          notes: `Operational state changed to ${newStatus}`,
          performed_by: 'Field Dispatcher'
        },
        role
      );
      setUpdatingAsgId(null);
      onRefresh();
    } catch (err) {
      setUpdatingAsgId(null);
      alert(`Assignment update failed: ${err.message}`);
    }
  };

  const handleToggleResourceStatus = async (resource, targetStatus) => {
    setUpdatingResId(resource.id);
    try {
      await api.updateResourceStatus(
        resource.id,
        {
          status: targetStatus,
          performed_by: 'Coordinator',
          notes: `Status changed to ${targetStatus}`
        },
        role
      );
      setUpdatingResId(null);
      onRefresh();
    } catch (err) {
      setUpdatingResId(null);
      alert(`Resource status change failed: ${err.message}`);
    }
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'RESCUE_BOAT':
        return <Ship className="w-5 h-5 text-sky-400" />;
      case 'AMBULANCE':
      case 'MEDICAL_TEAM':
        return <Activity className="w-5 h-5 text-red-400" />;
      case 'EVAC_4X4':
      case 'SUPPLY_TRUCK':
        return <Truck className="w-5 h-5 text-amber-400" />;
      default:
        return <Users className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getStatusColor = (st) => {
    switch (st) {
      case 'AVAILABLE':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'ASSIGNED':
        return 'bg-sky-500/20 text-sky-400 border-sky-500/40';
      case 'MAINTENANCE':
        return 'bg-rose-950/80 text-rose-300 border-rose-700';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Missions / Assignments Board */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-400" />
              Active Rescue Missions & Deployments
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live tracking of dispatched units from assignment through on-scene triage to completion.
            </p>
          </div>
          <span className="text-xs bg-slate-950 border border-slate-800 px-2.5 py-1 rounded font-mono text-slate-300 font-semibold">
            {assignments.filter((a) => a.status !== 'COMPLETED' && a.status !== 'CANCELLED').length} Active
          </span>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            No active or historical rescue missions recorded. Dispatch resources from the Emergency Requests tab.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((asg) => {
              const isCompleted = asg.status === 'COMPLETED' || asg.status === 'CANCELLED';
              return (
                <div
                  key={asg.id}
                  className={`bg-slate-950 border rounded-xl p-4 space-y-3 transition ${
                    isCompleted ? 'border-slate-800 opacity-60' : 'border-sky-800/60 shadow-lg shadow-sky-950/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/60">
                      Mission #{asg.id} &bull; {asg.status}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(asg.assigned_at).toLocaleTimeString()}
                    </span>
                  </div>

                  <div>
                    <div className="font-bold text-sm text-white flex items-center gap-1.5">
                      <span>{asg.resource_name}</span>
                      <span className="text-xs text-slate-400 font-normal">({asg.resource_type})</span>
                    </div>
                    <div className="text-xs text-slate-300 mt-1">
                      Target Request: <b className="text-slate-100">{asg.request_code}</b> ({asg.district})
                    </div>
                    {asg.request_details && (
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 italic bg-slate-900/60 p-1.5 rounded">
                        "{asg.request_details}"
                      </p>
                    )}
                  </div>

                  {/* Operational Transition Flow */}
                  {!isCompleted && role === 'coordinator' && (
                    <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2 items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">Update Progression:</span>
                      <div className="flex gap-1.5">
                        {asg.status === 'ASSIGNED' && (
                          <button
                            onClick={() => handleUpdateAssignmentStatus(asg.id, 'EN_ROUTE')}
                            disabled={updatingAsgId === asg.id}
                            className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-600/40 rounded text-xs font-semibold"
                          >
                            Mark En Route &rarr;
                          </button>
                        )}
                        {asg.status === 'EN_ROUTE' && (
                          <button
                            onClick={() => handleUpdateAssignmentStatus(asg.id, 'ON_SCENE')}
                            disabled={updatingAsgId === asg.id}
                            className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-600/40 rounded text-xs font-semibold"
                          >
                            Mark On Scene &rarr;
                          </button>
                        )}
                        {asg.status === 'ON_SCENE' && (
                          <button
                            onClick={() => handleUpdateAssignmentStatus(asg.id, 'COMPLETED')}
                            disabled={updatingAsgId === asg.id}
                            className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-600/40 rounded text-xs font-semibold"
                          >
                            Complete & Release Resource &check;
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resource Inventory */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Emergency Response Fleet & Volunteer Units
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Boats, mobile ICUs, high-clearance transport trucks, and volunteer squads with real-time operational status.
            </p>
          </div>
          <span className="text-xs bg-slate-950 border border-slate-800 px-2.5 py-1 rounded font-mono text-emerald-400 font-semibold">
            {resources.filter((r) => r.status === 'AVAILABLE').length} / {resources.length} Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((res) => (
            <div
              key={res.id}
              className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getResourceIcon(res.type)}
                    <span className="font-mono text-xs font-bold text-slate-400">{res.resource_code}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getStatusColor(res.status)}`}>
                    {res.status}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-white">{res.name}</h4>
                <div className="text-xs text-slate-400 mt-1">
                  Station: <span className="text-slate-200">{res.district}</span> ({res.current_location})
                </div>

                <div className="mt-3 bg-slate-900/60 p-2.5 rounded border border-slate-800/80 text-xs space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Callsign:</span>
                    <span className="font-mono font-semibold text-sky-400">{res.callsign}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Evac Capacity:</span>
                    <span className="font-bold text-slate-200">{res.capacity_units} persons</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Contact:</span>
                    <span className="font-mono text-slate-400">{res.contact_number}</span>
                  </div>
                </div>

                {res.notes && (
                  <p className="text-[11px] text-slate-400 mt-2 italic bg-slate-900/40 p-1.5 rounded">
                    {res.notes}
                  </p>
                )}
              </div>

              {role === 'coordinator' && (
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Change Status:</span>
                  <div className="flex gap-1.5">
                    {res.status !== 'AVAILABLE' && (
                      <button
                        onClick={() => handleToggleResourceStatus(res, 'AVAILABLE')}
                        disabled={updatingResId === res.id}
                        className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 rounded text-[11px] font-semibold"
                      >
                        Set Available
                      </button>
                    )}
                    {res.status !== 'MAINTENANCE' && (
                      <button
                        onClick={() => handleToggleResourceStatus(res, 'MAINTENANCE')}
                        disabled={updatingResId === res.id}
                        className="px-2 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/60 rounded text-[11px] font-semibold"
                      >
                        Set Maintenance
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
