import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Send, CloudOff, RefreshCw, Trash2, HeartPulse } from 'lucide-react';
import { api, saveOfflineDraft, removeOfflineDraft } from '../api';

const DISTRICT_COORDINATES = {
  Northview: { lat: 37.7925, lng: -122.4245 },
  Riverdale: { lat: 37.7654, lng: -122.4388 },
  Eastwood: { lat: 37.7812, lng: -122.4150 },
  Southpoint: { lat: 37.7450, lng: -122.4050 }
};

export default function CitizenRequestForm({
  role,
  isOnline,
  simulateOffline,
  offlineDrafts = [],
  onDraftChange,
  onRequestCreated
}) {
  const [formData, setFormData] = useState({
    citizen_name: '',
    contact_phone: '',
    district: 'Riverdale',
    location_address: '',
    latitude: 37.7654,
    longitude: -122.4388,
    emergency_type: 'RESCUE',
    urgency_level: 'CRITICAL',
    details: '',
    special_needs: '',
    reporter_type: 'SELF'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [retryingDraftId, setRetryingDraftId] = useState(null);

  const effectiveOnline = isOnline && !simulateOffline;

  const handleDistrictChange = (e) => {
    const dist = e.target.value;
    const coords = DISTRICT_COORDINATES[dist] || { lat: 37.770, lng: -122.420 };
    setFormData((prev) => ({
      ...prev,
      district: dist,
      latitude: coords.lat,
      longitude: coords.lng
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSubmissionResult(null);

    // Client idempotency key
    const idempotency_key = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const payload = {
      ...formData,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      idempotency_key
    };

    // If offline or simulated offline, store as local draft immediately
    if (!effectiveOnline) {
      const draft = saveOfflineDraft(payload);
      setIsSubmitting(false);
      onDraftChange();
      setSubmissionResult({
        offline: true,
        message: 'Network offline. Request saved locally as an unsent draft.',
        draft
      });
      return;
    }

    try {
      const res = await api.createRequest(payload, role, simulateOffline);
      setIsSubmitting(false);
      setSubmissionResult({
        offline: false,
        message: 'Emergency request registered successfully and transmitted to Disaster Command.',
        data: res
      });
      // Reset form fields
      setFormData((prev) => ({
        ...prev,
        citizen_name: '',
        contact_phone: '',
        location_address: '',
        details: '',
        special_needs: ''
      }));
      if (onRequestCreated) onRequestCreated(res);
    } catch (err) {
      console.warn('API submission failed, queuing as offline draft:', err);
      const draft = saveOfflineDraft(payload);
      setIsSubmitting(false);
      onDraftChange();
      setSubmissionResult({
        offline: true,
        message: `Transmission failed (${err.message}). Safely cached as an unsent draft.`,
        draft
      });
    }
  };

  const handleRetryDraft = async (draft) => {
    if (!effectiveOnline) {
      alert('Cannot retry while network is offline or simulated offline. Restore connection first.');
      return;
    }
    setRetryingDraftId(draft.id);
    try {
      const res = await api.createRequest(draft, role, false);
      removeOfflineDraft(draft.id);
      onDraftChange();
      setRetryingDraftId(null);
      if (onRequestCreated) onRequestCreated(res);
      alert(`Draft ${draft.id} successfully synchronized as ${res.request_code}!`);
    } catch (err) {
      setRetryingDraftId(null);
      alert(`Retry failed: ${err.message}`);
    }
  };

  const handleDeleteDraft = (draftId) => {
    removeOfflineDraft(draftId);
    onDraftChange();
  };

  return (
    <div className="space-y-6">
      {/* Offline Status Advisory Notice */}
      {!effectiveOnline && (
        <div className="bg-amber-950/40 border border-amber-600/50 p-4 rounded-xl flex items-start space-x-3 text-amber-200">
          <CloudOff className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-amber-300">OFFLINE RESILIENCE ACTIVE: </span>
            Your terminal has no direct uplink to EOC. Any emergency submitted right now will be safely
            stored in browser local persistence with status{' '}
            <span className="font-mono bg-amber-900/60 px-1 py-0.5 rounded font-bold text-amber-300">
              NOT SENT — WAITING FOR CONNECTION
            </span>
            . No request will be lost.
          </div>
        </div>
      )}

      {/* Main Request Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-red-500" />
              Citizen Emergency Assistance Dispatch Request
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Rapid incident intake for stranded residents, urgent medical needs, or localized hazards.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-red-950/60 text-red-400 border border-red-800/60 rounded font-semibold">
            SECURE INTAKE
          </span>
        </div>

        {submissionResult && (
          <div
            className={`p-4 rounded-lg mb-6 border ${
              submissionResult.offline
                ? 'bg-amber-950/40 border-amber-700/60 text-amber-200'
                : 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {submissionResult.offline ? (
                <Clock className="w-5 h-5 text-amber-400" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )}
              <span className="font-bold text-sm">{submissionResult.message}</span>
            </div>
            {submissionResult.data && (
              <div className="mt-2 text-xs font-mono bg-slate-950/60 p-2.5 rounded border border-slate-800">
                Tracking ID: <span className="text-emerald-400 font-bold">{submissionResult.data.request_code}</span> |
                Status: <span className="text-sky-400 font-bold">{submissionResult.data.status}</span> |
                District: {submissionResult.data.district}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Citizen / Contact Name *
              </label>
              <input
                type="text"
                required
                value={formData.citizen_name}
                onChange={(e) => setFormData({ ...formData, citizen_name: e.target.value })}
                placeholder="e.g., Harold Vance or Martha Stewart (Reporting for neighbor)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Contact Phone / Radio *
              </label>
              <input
                type="text"
                required
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="e.g., +1 555-0811"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Disaster Sector / District *
              </label>
              <select
                value={formData.district}
                onChange={handleDistrictChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-red-500"
              >
                <option value="Northview">Northview (Highland & Hills)</option>
                <option value="Riverdale">Riverdale (Flood Basin Zone)</option>
                <option value="Eastwood">Eastwood (Urban Core)</option>
                <option value="Southpoint">Southpoint (Coastal Maritime)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Emergency Type *
              </label>
              <select
                value={formData.emergency_type}
                onChange={(e) => setFormData({ ...formData, emergency_type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-red-500"
              >
                <option value="RESCUE">RESCUE (Stranded / Water Evac)</option>
                <option value="MEDICAL">MEDICAL (Critical Care / Life Support)</option>
                <option value="FLOOD_HAZARD">FLOOD_HAZARD (Structural Threat)</option>
                <option value="FOOD_WATER">FOOD_WATER (Relief Sustenance)</option>
                <option value="SHELTER_NEEDED">SHELTER_NEEDED (Displaced)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Urgency Level *
              </label>
              <select
                value={formData.urgency_level}
                onChange={(e) => setFormData({ ...formData, urgency_level: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-red-500"
              >
                <option value="CRITICAL">CRITICAL (Immediate Life Threat)</option>
                <option value="HIGH">HIGH (Urgent Rescue Needed)</option>
                <option value="MEDIUM">MEDIUM (Assistance Required)</option>
                <option value="LOW">LOW (Informational / Deferred)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Physical Location / Landmark Address *
            </label>
            <input
              type="text"
              required
              value={formData.location_address}
              onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
              placeholder="e.g., 412 Pinecrest Ridge, 2nd floor, water rising above foundation"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Incident Situation Details *
            </label>
            <textarea
              required
              rows={3}
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              placeholder="Describe what is happening, number of persons trapped, surrounding hazards..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-red-400" />
                Vulnerability & Special Needs
              </label>
              <input
                type="text"
                value={formData.special_needs}
                onChange={(e) => setFormData({ ...formData, special_needs: e.target.value })}
                placeholder="e.g., Oxygen dependent bedridden, elderly wheelchair, infant"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Protected personal health information. Masked in public views.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Reporter Relationship
              </label>
              <select
                value={formData.reporter_type}
                onChange={(e) => setFormData({ ...formData, reporter_type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-red-500"
              >
                <option value="SELF">Direct Citizen (Self / Family)</option>
                <option value="NEIGHBOUR">Concerned Neighbour</option>
                <option value="VOLUNTEER">Community Aid Volunteer</option>
                <option value="FIRST_RESPONDER">Field Responder</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-lg font-bold text-sm tracking-wide uppercase transition shadow-lg flex items-center justify-center space-x-2 ${
                effectiveOnline
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
              }`}
            >
              {isSubmitting ? (
                <span>Transmitting to EOC...</span>
              ) : effectiveOnline ? (
                <>
                  <Send className="w-4 h-4" />
                  <span>Transmit Emergency Request to Disaster Command</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-4 h-4" />
                  <span>Save Locally as Unsent Draft (Offline Queue)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Unsent Offline Drafts Queue */}
      {offlineDrafts.length > 0 && (
        <div className="bg-slate-900 border border-amber-600/40 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center space-x-2">
              <CloudOff className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-white">Unsent Drafts Awaiting Connection ({offlineDrafts.length})</h3>
            </div>
            <span className="text-xs bg-amber-950/80 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded font-mono font-bold">
              IDEMPOTENT RETRY READY
            </span>
          </div>

          <div className="space-y-3">
            {offlineDrafts.map((draft) => (
              <div
                key={draft.id}
                className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                      {draft.sync_status}
                    </span>
                    <span className="text-xs font-bold text-slate-200">{draft.citizen_name}</span>
                    <span className="text-xs text-slate-500 font-mono">({draft.district})</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{draft.details}</p>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    Idempotency Key: {draft.idempotency_key} | Saved: {new Date(draft.saved_at).toLocaleTimeString()}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleRetryDraft(draft)}
                    disabled={retryingDraftId === draft.id || !effectiveOnline}
                    className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${retryingDraftId === draft.id ? 'animate-spin' : ''}`} />
                    <span>Sync Now</span>
                  </button>
                  <button
                    onClick={() => handleDeleteDraft(draft.id)}
                    className="p-1.5 bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 rounded border border-slate-700 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
