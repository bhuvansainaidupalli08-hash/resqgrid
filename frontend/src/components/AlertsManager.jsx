import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, ShieldAlert, CheckCircle, Radio, Eye, Flag, Plus } from 'lucide-react';
import { api } from '../api';

export default function AlertsManager({ alerts = [], role, onRefresh }) {
  const [reviewingAlert, setReviewingAlert] = useState(null);
  const [credibilityChoice, setCredibilityChoice] = useState('CORROBORATED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New alert form
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('EVACUATION');
  const [newSeverity, setNewSeverity] = useState('WARNING');
  const [newDistrict, setNewDistrict] = useState('Northview');
  const [newMessage, setNewMessage] = useState('');
  const [newSource, setNewSource] = useState('Command HQ Emergency Dispatch');

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewingAlert) return;
    setIsSubmitting(true);
    try {
      await api.updateAlertCredibility(
        reviewingAlert.id,
        {
          credibility: credibilityChoice,
          flags_for_review: reviewNotes,
          performed_by: 'Sarah Chen (Lead Public Info Officer)'
        },
        role
      );
      setIsSubmitting(false);
      setReviewingAlert(null);
      setReviewNotes('');
      onRefresh();
    } catch (err) {
      setIsSubmitting(false);
      alert(`Credibility review update failed: ${err.message}`);
    }
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createAlert(
        {
          title: newTitle,
          category: newCategory,
          severity: newSeverity,
          district: newDistrict,
          message: newMessage,
          source: newSource,
          credibility: 'CORROBORATED',
          flags_for_review: 'Official EOC Authorized Broadcast'
        },
        role
      );
      setIsSubmitting(false);
      setIsCreating(false);
      setNewTitle('');
      setNewMessage('');
      onRefresh();
    } catch (err) {
      setIsSubmitting(false);
      alert(`Alert creation failed: ${err.message}`);
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/40 font-bold';
      case 'WARNING':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-semibold';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    }
  };

  const getCredibilityBadge = (cred) => {
    switch (cred) {
      case 'VERIFIED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold';
      case 'CORROBORATED':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40 font-semibold';
      case 'DISPUTED':
        return 'bg-rose-950/90 text-rose-300 border-rose-600 font-bold animate-pulse';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-800 gap-3">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-500 animate-pulse" />
              Disaster Warnings & Credibility Watchtower
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Rapid verification of conflicting field intelligence, unconfirmed evacuation rumors, and infrastructure hazards.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {role === 'coordinator' && (
              <button
                onClick={() => setIsCreating(!isCreating)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Broadcast New Alert</span>
              </button>
            )}
            <span className="text-xs bg-slate-950 border border-slate-800 px-2.5 py-1 rounded font-mono text-slate-300 font-semibold">
              {alerts.length} Bulletins
            </span>
          </div>
        </div>

        {/* Create Alert Form Accordion */}
        {isCreating && (
          <form
            onSubmit={handleCreateAlert}
            className="mb-6 p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3.5"
          >
            <div className="font-bold text-sm text-white">Broadcast Emergency Advisory / Bulletin</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Alert Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Mandatory Evacuation of Low-Lying Riverdale Basin"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-100"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-100"
                  >
                    <option value="EVACUATION">EVACUATION</option>
                    <option value="WEATHER">WEATHER</option>
                    <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
                    <option value="PUBLIC_SAFETY">PUBLIC_SAFETY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-100"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="WARNING">WARNING</option>
                    <option value="ADVISORY">ADVISORY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">District</label>
                  <select
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-100"
                  >
                    <option value="Northview">Northview</option>
                    <option value="Riverdale">Riverdale</option>
                    <option value="Eastwood">Eastwood</option>
                    <option value="Southpoint">Southpoint</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Broadcast Message Body</label>
              <textarea
                required
                rows={2}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Specific guidance for citizens (routes to take, shelter locations, hazards to avoid)..."
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-100"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded"
              >
                {isSubmitting ? 'Transmitting...' : 'Issue Alert'}
              </button>
            </div>
          </form>
        )}

        {/* Alerts Grid */}
        <div className="space-y-3.5">
          {alerts.map((alt) => (
            <div
              key={alt.id}
              className={`bg-slate-950 border rounded-xl p-4 space-y-2.5 transition shadow-md ${
                alt.credibility === 'DISPUTED'
                  ? 'border-rose-700/80 bg-rose-950/10'
                  : alt.severity === 'CRITICAL'
                  ? 'border-red-900/60'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {alt.alert_code}
                  </span>
                  <span className={`text-[10px] uppercase px-2 py-0.5 rounded border ${getSeverityBadge(alt.severity)}`}>
                    {alt.severity}
                  </span>
                  <span className="text-[10px] uppercase bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800 font-semibold">
                    {alt.category}
                  </span>
                  <span className={`text-[10px] uppercase px-2 py-0.5 rounded border ${getCredibilityBadge(alt.credibility)}`}>
                    {alt.credibility}
                  </span>
                </div>

                <span className="text-[11px] text-slate-500 font-mono">
                  Origin: {alt.source} &bull; {new Date(alt.created_at).toLocaleTimeString()}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-white">{alt.title}</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{alt.message}</p>
              </div>

              {/* Review Flags / Contradiction Notes */}
              {alt.flags_for_review && (
                <div className="bg-slate-900 border border-amber-600/40 p-2.5 rounded-lg text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 text-amber-300 font-bold">
                    <Flag className="w-3.5 h-3.5 text-amber-400" />
                    <span>Intelligence Audit & Verification Notes</span>
                  </div>
                  <p className="text-[11px] text-slate-300 italic">{alt.flags_for_review}</p>
                </div>
              )}

              {role === 'coordinator' && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Credibility Decision Panel:</span>
                  <button
                    onClick={() => {
                      setReviewingAlert(alt);
                      setCredibilityChoice(alt.credibility);
                      setReviewNotes(alt.flags_for_review || '');
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition font-semibold"
                  >
                    Review & Corroborate
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Review Alert Credibility Modal */}
      {reviewingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl p-5 shadow-2xl">
            <h3 className="font-bold text-base text-white mb-1">
              Credibility Evaluation: {reviewingAlert.alert_code}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Rule: Never label an alert false solely because it is unverified. Preserve the original report and record corrections.
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Credibility Decision</label>
                <select
                  value={credibilityChoice}
                  onChange={(e) => setCredibilityChoice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
                >
                  <option value="VERIFIED">VERIFIED (Confirmed by emergency operations)</option>
                  <option value="CORROBORATED">CORROBORATED (Supported by secondary reliable sources)</option>
                  <option value="DISPUTED">DISPUTED (Contradicted by authoritative command)</option>
                  <option value="UNCONFIRMED">UNCONFIRMED (Under ongoing investigation)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Correction & Verification Rationale *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g., EOC confirmed Southpoint levee is intact. No evacuation ordered."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingAlert(null)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold"
                >
                  {isSubmitting ? 'Recording...' : 'Commit Review Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
