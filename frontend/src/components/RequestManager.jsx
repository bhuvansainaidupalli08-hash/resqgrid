import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Search,
  Filter,
  FileCheck,
  Send,
  UserCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  XCircle,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { api } from '../api';

export default function RequestManager({
  requests = [],
  resources = [],
  role,
  onRefresh,
  onSelectForMap
}) {
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCredibility, setFilterCredibility] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [verifyModalReq, setVerifyModalReq] = useState(null);
  const [assignModalReq, setAssignModalReq] = useState(null);
  const [resolveModalReq, setResolveModalReq] = useState(null);
  const [expandedReqId, setExpandedReqId] = useState(null);

  // Form states
  const [verifyCredibility, setVerifyCredibility] = useState('CORROBORATED');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [assignResourceId, setAssignResourceId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [resolveNotes, setResolveNotes] = useState('');
  const [actionError, setActionError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    if (filterDistrict && r.district !== filterDistrict) return false;
    if (filterUrgency && r.urgency_level !== filterUrgency) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterCredibility && r.credibility !== filterCredibility) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        (r.request_code && r.request_code.toLowerCase().includes(q)) ||
        (r.citizen_name && r.citizen_name.toLowerCase().includes(q)) ||
        (r.details && r.details.toLowerCase().includes(q)) ||
        (r.location_address && r.location_address.toLowerCase().includes(q)) ||
        (r.special_needs && r.special_needs.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Verification submit
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verifyModalReq) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      await api.verifyRequest(
        verifyModalReq.id,
        {
          credibility: verifyCredibility,
          notes: verifyNotes,
          verified_by: role === 'coordinator' ? 'Sarah Chen (Lead Coordinator)' : 'Field Officer'
        },
        role
      );
      setIsProcessing(false);
      setVerifyModalReq(null);
      setVerifyNotes('');
      onRefresh();
    } catch (err) {
      setIsProcessing(false);
      setActionError(err.message);
    }
  };

  // Assignment submit
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignModalReq || !assignResourceId) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      await api.createAssignment(
        {
          request_id: assignModalReq.id,
          resource_id: parseInt(assignResourceId, 10),
          assigned_by: 'Sarah Chen (Lead Coordinator)',
          notes: assignNotes
        },
        role
      );
      setIsProcessing(false);
      setAssignModalReq(null);
      setAssignNotes('');
      setAssignResourceId('');
      onRefresh();
    } catch (err) {
      setIsProcessing(false);
      setActionError(err.message);
    }
  };

  // Resolution submit
  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolveModalReq) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      await api.updateRequestStatus(
        resolveModalReq.id,
        {
          status: 'RESOLVED',
          performed_by: 'Sarah Chen (Lead Coordinator)',
          resolution_notes: resolveNotes
        },
        role
      );
      setIsProcessing(false);
      setResolveModalReq(null);
      setResolveNotes('');
      onRefresh();
    } catch (err) {
      setIsProcessing(false);
      setActionError(err.message);
    }
  };

  const getUrgencyBadge = (level) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/40 font-bold';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-semibold';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      default:
        return 'bg-slate-700/40 text-slate-400 border-slate-600';
    }
  };

  const getCredibilityBadge = (cred) => {
    switch (cred) {
      case 'VERIFIED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold';
      case 'CORROBORATED':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40 font-semibold';
      case 'DISPUTED':
        return 'bg-rose-950/80 text-rose-300 border-rose-700 font-bold';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'RESOLVED':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-700';
      case 'ASSIGNED':
      case 'IN_PROGRESS':
        return 'bg-sky-950/80 text-sky-400 border-sky-700 animate-pulse';
      case 'UNDER_REVIEW':
        return 'bg-purple-950/80 text-purple-400 border-purple-700';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  // Filter available resources for dispatch
  const availableResources = resources.filter((res) => res.status === 'AVAILABLE');

  return (
    <div className="space-y-5">
      {/* Search and Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap gap-3 items-center justify-between shadow-lg">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by code, citizen name, address, or details..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center text-xs">
          <select
            value={filterDistrict}
            onChange={(e) => setFilterDistrict(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none"
          >
            <option value="">All Districts</option>
            <option value="Northview">Northview</option>
            <option value="Riverdale">Riverdale</option>
            <option value="Eastwood">Eastwood</option>
            <option value="Southpoint">Southpoint</option>
          </select>

          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none"
          >
            <option value="">All Urgencies</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="RECEIVED">Received</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="VERIFIED">Verified</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select
            value={filterCredibility}
            onChange={(e) => setFilterCredibility(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none"
          >
            <option value="">All Credibility</option>
            <option value="UNCONFIRMED">Unconfirmed</option>
            <option value="CORROBORATED">Corroborated</option>
            <option value="VERIFIED">Verified</option>
            <option value="DISPUTED">Disputed</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl text-center text-slate-400">
            No emergency requests match the selected filters.
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isExpanded = expandedReqId === req.id;
            return (
              <div
                key={req.id}
                className={`bg-slate-900/90 border rounded-xl p-4 transition shadow-md ${
                  req.is_duplicate
                    ? 'border-amber-700/50 bg-amber-950/10'
                    : req.urgency_level === 'CRITICAL'
                    ? 'border-red-900/50 hover:border-red-700/60'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                  {/* Left: Code, Citizen & Badges */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {req.request_code}
                      </span>
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded border ${getUrgencyBadge(req.urgency_level)}`}>
                        {req.urgency_level}
                      </span>
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded border ${getStatusBadge(req.status)}`}>
                        {req.status}
                      </span>
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded border ${getCredibilityBadge(req.credibility)}`}>
                        Credibility: {req.credibility}
                      </span>
                      {req.is_duplicate && (
                        <span className="text-[10px] uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold">
                          Flagged Duplicate ({req.duplicate_reference || 'Probable'})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white">{req.citizen_name}</span>
                      <span className="text-xs text-slate-400">({req.district} Sector)</span>
                      <span className="text-xs text-slate-500 font-mono">| {req.contact_phone}</span>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 max-w-3xl">
                      <span className="text-slate-500">Location:</span> {req.location_address} —{' '}
                      <span className="text-slate-200">{req.details}</span>
                    </p>

                    {req.special_needs && (
                      <div className="inline-flex items-center space-x-1.5 text-xs text-red-300 bg-red-950/40 border border-red-800/50 px-2.5 py-1 rounded-md">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                        <span>Special Needs: <b>{req.special_needs}</b></span>
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                    {onSelectForMap && (
                      <button
                        onClick={() => onSelectForMap(req)}
                        title="Locate on Tactical Map"
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium border border-slate-700 transition"
                      >
                        Locate
                      </button>
                    )}

                    {role === 'coordinator' && (
                      <>
                        <button
                          onClick={() => {
                            setVerifyModalReq(req);
                            setVerifyCredibility(req.credibility);
                            setVerifyNotes(req.credibility_notes || '');
                          }}
                          className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded text-xs font-semibold transition"
                        >
                          Verify Credibility
                        </button>

                        {req.status !== 'RESOLVED' && req.status !== 'CLOSED' && (
                          <button
                            onClick={() => {
                              setAssignModalReq(req);
                              setAssignResourceId(availableResources[0]?.id?.toString() || '');
                            }}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold shadow-sm transition"
                          >
                            Dispatch Resource
                          </button>
                        )}

                        {req.status !== 'RESOLVED' && req.status !== 'CLOSED' && (
                          <button
                            onClick={() => {
                              setResolveModalReq(req);
                            }}
                            className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded text-xs font-semibold transition"
                          >
                            Confirm Resolved
                          </button>
                        )}
                      </>
                    )}

                    <button
                      onClick={() => setExpandedReqId(isExpanded ? null : req.id)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded transition"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details: Assignments & Verification History */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Active/Past Assignments */}
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-blue-400" />
                        Rescue Deployments & Resources ({req.assignments?.length || 0})
                      </div>
                      {req.assignments && req.assignments.length > 0 ? (
                        <div className="space-y-2">
                          {req.assignments.map((asg) => (
                            <div key={asg.id} className="bg-slate-900 p-2 rounded border border-slate-800">
                              <div className="flex justify-between font-bold text-slate-200">
                                <span>{asg.resource_name} ({asg.resource_type})</span>
                                <span className="text-sky-400 font-mono">{asg.status}</span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-1">
                                Dispatched by: {asg.assigned_by} at {new Date(asg.assigned_at).toLocaleTimeString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-500 italic">No resources currently deployed to this incident.</div>
                      )}
                    </div>

                    {/* Verification Records */}
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Credibility Verification Log ({req.verifications?.length || 0})
                      </div>
                      {req.verifications && req.verifications.length > 0 ? (
                        <div className="space-y-2">
                          {req.verifications.map((v) => (
                            <div key={v.id} className="bg-slate-900 p-2 rounded border border-slate-800">
                              <div className="flex justify-between text-slate-200">
                                <span>
                                  {v.previous_credibility} &rarr; <b className="text-emerald-400">{v.new_credibility}</b>
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {new Date(v.created_at).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1 italic">{v.notes}</p>
                              <div className="text-[10px] text-slate-500 mt-0.5">By: {v.verified_by}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-500 italic">No credibility corroboration history recorded yet.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Verify Credibility Modal */}
      {verifyModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl p-5 shadow-2xl">
            <h3 className="font-bold text-base text-white mb-1">
              Verify Credibility: {verifyModalReq.request_code}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Cross-reference field telemetry, drone surveillance, or utility grid data before changing credibility.
            </p>

            {actionError && (
              <div className="bg-red-950/60 border border-red-700 text-red-300 p-2.5 rounded text-xs mb-3">
                {actionError}
              </div>
            )}

            <form onSubmit={handleVerifySubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Credibility</label>
                <select
                  value={verifyCredibility}
                  onChange={(e) => setVerifyCredibility(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200"
                >
                  <option value="CORROBORATED">CORROBORATED (Supported by secondary source)</option>
                  <option value="VERIFIED">VERIFIED (Confirmed by first responder or sensor)</option>
                  <option value="DISPUTED">DISPUTED (Contradicted by field telemetry)</option>
                  <option value="UNCONFIRMED">UNCONFIRMED (Awaiting evidence)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Evidence & Verification Notes *</label>
                <textarea
                  required
                  rows={3}
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="Record verification rationale (e.g., Drone Raven-2 feed confirmation or utility grid outage map)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVerifyModalReq(null)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold"
                >
                  {isProcessing ? 'Recording...' : 'Save Credibility Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatch Resource Modal */}
      {assignModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl p-5 shadow-2xl">
            <h3 className="font-bold text-base text-white mb-1">
              Dispatch Resource to {assignModalReq.request_code}
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Citizen: <b className="text-white">{assignModalReq.citizen_name}</b> in{' '}
              <b className="text-white">{assignModalReq.district}</b> ({assignModalReq.emergency_type})
            </p>

            {actionError && (
              <div className="bg-red-950/60 border border-red-700 text-red-300 p-2.5 rounded text-xs mb-3">
                {actionError}
              </div>
            )}

            <form onSubmit={handleAssignSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Available Resource</label>
                {availableResources.length === 0 ? (
                  <div className="p-3 bg-red-950/40 border border-red-800/60 rounded text-xs text-red-300">
                    No resources currently marked AVAILABLE. (Rescue boats and medics deployed or in maintenance).
                  </div>
                ) : (
                  <select
                    value={assignResourceId}
                    onChange={(e) => setAssignResourceId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200"
                  >
                    {availableResources.map((res) => (
                      <option key={res.id} value={res.id}>
                        {res.name} [{res.type}] — District: {res.district} (Capacity: {res.capacity_units})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mission Dispatch Brief</label>
                <textarea
                  rows={2}
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="e.g., Shallow water rescue on porch roof; proceed with 3 diver crew"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModalReq(null)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || availableResources.length === 0}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded text-xs font-bold"
                >
                  {isProcessing ? 'Dispatching...' : 'Confirm Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Resolved Modal */}
      {resolveModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl p-5 shadow-2xl">
            <h3 className="font-bold text-base text-white mb-1">
              Confirm Resolution for {resolveModalReq.request_code}
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Only mark a rescue request resolved after an authorized responder confirms successful evacuation or care delivery.
            </p>

            {actionError && (
              <div className="bg-red-950/60 border border-red-700 text-red-300 p-2.5 rounded text-xs mb-3">
                {actionError}
              </div>
            )}

            <form onSubmit={handleResolveSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Confirmation Outcome Notes *
                </label>
                <textarea
                  required
                  rows={3}
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="e.g., Resident Harold Vance safely transferred by 4x4 Medic-44 to Northview Civic Sports Complex shelter."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolveModalReq(null)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold"
                >
                  {isProcessing ? 'Resolving...' : 'Confirm Outcome & Close'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
