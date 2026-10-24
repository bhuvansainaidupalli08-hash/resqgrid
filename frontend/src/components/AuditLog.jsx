import React, { useState } from 'react';
import { History, Shield, Filter, Search } from 'lucide-react';

export default function AuditLog({ auditEvents = [] }) {
  const [filterEntity, setFilterEntity] = useState('');
  const [search, setSearch] = useState('');

  const filtered = auditEvents.filter((ev) => {
    if (filterEntity && ev.entity_type !== filterEntity) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        ev.entity_id.toLowerCase().includes(q) ||
        ev.action.toLowerCase().includes(q) ||
        ev.performed_by.toLowerCase().includes(q) ||
        ev.details.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800';
      case 'ASSIGNMENT_CREATE':
        return 'text-sky-400 bg-sky-950/60 border-sky-800';
      case 'CREDIBILITY_UPDATE':
      case 'CREDIBILITY_DECISION':
        return 'text-blue-400 bg-blue-950/60 border-blue-800';
      case 'STATUS_UPDATE':
        return 'text-amber-400 bg-amber-950/60 border-amber-800';
      case 'RESOURCE_RELEASE':
        return 'text-teal-400 bg-teal-950/60 border-teal-800';
      default:
        return 'text-slate-400 bg-slate-900 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div>
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <History className="w-5 h-5 text-slate-400" />
            Operational Audit Trail & Verification Ledger
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable log of all intake events, status transitions, resource allocations, and credibility decisions.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
          >
            <option value="">All Entities</option>
            <option value="REQUEST">Requests</option>
            <option value="ASSIGNMENT">Assignments</option>
            <option value="RESOURCE">Resources</option>
            <option value="SHELTER">Shelters</option>
            <option value="ALERT">Alerts</option>
          </select>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit..."
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">No audit events match your criteria.</div>
        ) : (
          filtered.map((ev) => (
            <div
              key={ev.id}
              className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 hover:border-slate-700 transition"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getActionColor(ev.action)}`}>
                    {ev.action}
                  </span>
                  <span className="font-mono text-slate-400 text-[11px] font-semibold">{ev.entity_type} #{ev.entity_id}</span>
                  <span className="text-slate-500 font-mono text-[10px]">By: {ev.performed_by}</span>
                </div>
                <p className="text-slate-300 leading-relaxed">{ev.details}</p>
              </div>

              <div className="text-[11px] text-slate-500 font-mono whitespace-nowrap shrink-0">
                {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
