import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Map,
  Send,
  AlertCircle,
  Truck,
  Home,
  Radio,
  History,
  ShieldCheck,
  Menu,
  X,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import Header from './components/Header';
import OverviewDashboard from './components/OverviewDashboard';
import DisasterMap from './components/DisasterMap';
import CitizenRequestForm from './components/CitizenRequestForm';
import RequestManager from './components/RequestManager';
import ResourceManager from './components/ResourceManager';
import ShelterManager from './components/ShelterManager';
import AlertsManager from './components/AlertsManager';
import AuditLog from './components/AuditLog';
import { api, getOfflineDrafts } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [role, setRole] = useState('coordinator'); // 'coordinator' | 'public'
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [simulateOffline, setSimulateOffline] = useState(false);

  // Core Data
  const [requests, setRequests] = useState([]);
  const [resources, setResources] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [offlineDrafts, setOfflineDrafts] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Network listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setOfflineDrafts(getOfflineDrafts());
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [reqs, resrcs, asgs, shlts, alts, aud, st] = await Promise.all([
        api.getRequests({}, role),
        api.getResources({}, role),
        api.getAssignments({}, role),
        api.getShelters({}, role),
        api.getAlerts({}, role),
        api.getAudit(50, role),
        api.getStats(role)
      ]);

      setRequests(reqs);
      setResources(resrcs);
      setAssignments(asgs);
      setShelters(shlts);
      setAlerts(alts);
      setAuditEvents(aud);
      setStats(st);
      setOfflineDrafts(getOfflineDrafts());
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load operational data:', err);
      setErrorMessage(`Data synchronization error: ${err.message}. Ensure backend is running.`);
      setIsLoading(false);
      setOfflineDrafts(getOfflineDrafts());
    }
  }, [role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Seed demo data handler
  const handleSeedData = async () => {
    setIsLoading(true);
    try {
      await api.seed(role);
      await loadData();
      alert('IMPACTX 2026 Synthetic Demonstration Dataset successfully restored.');
    } catch (err) {
      alert(`Seed failed: ${err.message}`);
      setIsLoading(false);
    }
  };

  const handleSelectRequestForMap = (req) => {
    setSelectedRequest(req);
    setActiveTab('map');
  };

  const navItems = [
    { id: 'overview', label: 'Command Overview', icon: LayoutDashboard },
    { id: 'map', label: 'Interactive Tactical Map', icon: Map },
    { id: 'intake', label: 'Citizen Request Intake', icon: Send },
    { id: 'requests', label: 'Incident Triage & Review', icon: AlertCircle, badge: requests.length },
    { id: 'resources', label: 'Rescue Fleet & Dispatch', icon: Truck },
    { id: 'shelters', label: 'Evacuation Shelters', icon: Home },
    { id: 'alerts', label: 'Bulletins & Credibility', icon: Radio, badge: alerts.length },
    { id: 'audit', label: 'Operational Audit Ledger', icon: History }
  ];

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        isOnline={isOnline}
        simulateOffline={simulateOffline}
        setSimulateOffline={setSimulateOffline}
        role={role}
        setRole={setRole}
        draftsCount={offlineDrafts.length}
        onSeedData={handleSeedData}
        onRefreshAll={loadData}
        isLoading={isLoading}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row max-w-[1720px] w-full mx-auto">
        {/* Mobile menu button */}
        <div className="md:hidden bg-slate-900 border-b border-slate-800 p-3 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
            Navigation Menu
          </span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 bg-slate-800 text-slate-300 rounded"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <aside
          className={`${
            mobileMenuOpen ? 'block' : 'hidden'
          } md:block w-full md:w-64 bg-slate-900/60 md:border-r border-slate-800/80 p-4 space-y-1.5 shrink-0`}
        >
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1 mb-2">
            Operations Center
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                      isActive ? 'bg-red-800 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-6 border-t border-slate-800/80 mt-6 px-3 text-[11px] text-slate-400 space-y-2">
            <div className="font-bold text-slate-400 uppercase">System Status</div>
            <div className="flex justify-between">
              <span>FastAPI Backend:</span>
              <span className="text-emerald-400 font-bold">ONLINE</span>
            </div>
            <div className="flex justify-between">
              <span>Database Engine:</span>
              <span className="text-sky-400 font-bold font-mono">SQLite (Supabase ready)</span>
            </div>
            <div className="flex justify-between">
              <span>Privacy Mode:</span>
              <span className="font-bold text-slate-300 font-mono">
                {role === 'coordinator' ? 'HQ UNRESTRICTED' : 'PUBLIC SANITIZED'}
              </span>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {errorMessage && (
            <div className="mb-5 bg-red-950/60 border border-red-700/80 p-4 rounded-xl flex items-center justify-between text-xs text-red-200">
              <div className="flex items-center space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={loadData}
                className="px-2.5 py-1 bg-red-800 hover:bg-red-700 text-white rounded font-bold"
              >
                Retry Uplink
              </button>
            </div>
          )}

          {activeTab === 'overview' && (
            <OverviewDashboard
              stats={stats}
              requests={requests}
              shelters={shelters}
              alerts={alerts}
              onNavigateTab={setActiveTab}
              onSelectRequest={handleSelectRequestForMap}
            />
          )}

          {activeTab === 'map' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h2 className="text-lg font-bold text-white">Disaster Sector Tactical Map</h2>
                  <p className="text-xs text-slate-400">
                    Live geographic visualization of incidents, flood zones, open shelters, and response assets.
                  </p>
                </div>
                {selectedRequest && (
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded"
                  >
                    Reset Map Focus
                  </button>
                )}
              </div>
              <div className="h-[650px] w-full">
                <DisasterMap
                  requests={requests}
                  shelters={shelters}
                  resources={resources}
                  selectedRequestId={selectedRequest?.id}
                  onSelectRequest={(req) => setSelectedRequest(req)}
                />
              </div>
            </div>
          )}

          {activeTab === 'intake' && (
            <CitizenRequestForm
              role={role}
              isOnline={isOnline}
              simulateOffline={simulateOffline}
              offlineDrafts={offlineDrafts}
              onDraftChange={() => setOfflineDrafts(getOfflineDrafts())}
              onRequestCreated={() => loadData()}
            />
          )}

          {activeTab === 'requests' && (
            <RequestManager
              requests={requests}
              resources={resources}
              role={role}
              onRefresh={loadData}
              onSelectForMap={handleSelectRequestForMap}
            />
          )}

          {activeTab === 'resources' && (
            <ResourceManager
              resources={resources}
              assignments={assignments}
              role={role}
              onRefresh={loadData}
            />
          )}

          {activeTab === 'shelters' && (
            <ShelterManager shelters={shelters} role={role} onRefresh={loadData} />
          )}

          {activeTab === 'alerts' && (
            <AlertsManager alerts={alerts} role={role} onRefresh={loadData} />
          )}

          {activeTab === 'audit' && <AuditLog auditEvents={auditEvents} />}
        </main>
      </div>
    </div>
  );
}
