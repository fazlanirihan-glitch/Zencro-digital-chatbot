'use client';

import React, { useState, useEffect } from 'react';
import { Download, Trash2, Edit } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  business_name: string;
  requirements: string;
  pipeline_stage: string;
  lead_score: number;
  notes: string;
  source: string;
  created_at: string;
}

export default function LeadsCRM() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ pipeline_stage: 'new', notes: '' });

  const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('zencro_admin_token');
      const res = await fetch(`${apiHost}/api/v1/leads`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data.data || data); // handle standard or paginated responses
      }
    } catch (e) {
      console.error("Failed to load leads", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const openEditLead = (lead: Lead) => {
    setEditingLeadId(lead.id);
    setEditForm({ pipeline_stage: lead.pipeline_stage, notes: lead.notes || '' });
  };

  const handleUpdateLead = async (leadId: string) => {
    try {
      const token = localStorage.getItem('zencro_admin_token');
      const res = await fetch(`${apiHost}/api/v1/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setEditingLeadId(null);
        fetchLeads();
      }
    } catch (e) {
      alert("Error updating lead status");
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Are you sure you want to delete this lead record?")) return;
    try {
      const token = localStorage.getItem('zencro_admin_token');
      const res = await fetch(`${apiHost}/api/v1/leads/${leadId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchLeads();
    } catch (e) {
      alert("Error deleting lead");
    }
  };

  const exportToCSV = () => {
    if (leads.length === 0) return;
    
    const headers = ['Name', 'Phone', 'Email', 'Business Name', 'Requirements', 'Stage', 'Score', 'Source', 'Notes', 'Date Created'];
    const rows = leads.map(l => [
      `"${l.name || ''}"`,
      `"${l.phone || ''}"`,
      `"${l.email || ''}"`,
      `"${l.business_name || ''}"`,
      `"${l.requirements ? l.requirements.replace(/"/g, '""') : ''}"`,
      l.pipeline_stage,
      l.lead_score,
      l.source,
      `"${l.notes ? l.notes.replace(/"/g, '""') : ''}"`,
      new Date(l.created_at).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-xs text-slate-400">Loading CRM Pipeline...</span>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Leads Pipeline (CRM)</h1>
          <span className="text-xs text-slate-400">Manage qualified leads captured by the AI engine.</span>
        </div>
        <button 
          onClick={exportToCSV}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center space-x-2 transition-all"
        >
          <Download size={14} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* CRM Table */}
      <div className="bg-slate-950/40 border border-slate-900 rounded-2xl overflow-hidden glassmorphism shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/60 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-4">Contact</th>
                <th className="p-4">Business</th>
                <th className="p-4 max-w-[200px]">Requirements</th>
                <th className="p-4 text-center">Score</th>
                <th className="p-4 text-center">Stage</th>
                <th className="p-4">Internal Notes</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/50">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">No leads captured in CRM database yet.</td>
                </tr>
              ) : (
                leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-slate-200">{lead.name || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400">{lead.phone || 'No phone'}</div>
                      <div className="text-[10px] text-slate-400">{lead.email || 'No email'}</div>
                    </td>
                    <td className="p-4 font-medium text-slate-300">{lead.business_name || 'N/A'}</td>
                    <td className="p-4 max-w-[200px] truncate" title={lead.requirements}>{lead.requirements || 'N/A'}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${lead.lead_score >= 80 ? 'bg-red-950/30 text-red-400 border border-red-900/20' : lead.lead_score >= 50 ? 'bg-yellow-950/30 text-yellow-400 border border-yellow-900/20' : 'bg-blue-950/30 text-blue-400 border border-blue-900/20'}`}>
                        {lead.lead_score}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {editingLeadId === lead.id ? (
                        <select 
                          value={editForm.pipeline_stage} 
                          onChange={(e) => setEditForm(prev => ({ ...prev, pipeline_stage: e.target.value }))}
                          className="bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[10px] text-slate-200 focus:outline-none"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="qualified">Qualified</option>
                          <option value="closed_won">Won</option>
                          <option value="closed_lost">Lost</option>
                          <option value="archived">Archived</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${lead.pipeline_stage === 'new' ? 'bg-blue-950 text-blue-300' : lead.pipeline_stage === 'contacted' ? 'bg-yellow-950 text-yellow-300' : lead.pipeline_stage === 'qualified' ? 'bg-green-950 text-green-300' : lead.pipeline_stage === 'closed_won' ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-800 text-slate-400'}`}>
                          {lead.pipeline_stage?.replace('_', ' ') || 'New'}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {editingLeadId === lead.id ? (
                        <textarea 
                          value={editForm.notes} 
                          onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-200 focus:outline-none w-full"
                          rows={2}
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400 block max-w-[150px] truncate" title={lead.notes}>{lead.notes || 'No notes added'}</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {editingLeadId === lead.id ? (
                          <>
                            <button 
                              onClick={() => handleUpdateLead(lead.id)}
                              className="text-[10px] bg-green-700 hover:bg-green-800 text-white px-2 py-1 rounded"
                            >
                              Save
                            </button>
                            <button 
                              onClick={() => setEditingLeadId(null)}
                              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => openEditLead(lead)}
                              className="text-slate-400 hover:text-blue-400 transition-colors"
                              title="Edit Status/Notes"
                            >
                              <Edit size={13} />
                            </button>
                            <button 
                              onClick={() => handleDeleteLead(lead.id)}
                              className="text-slate-500 hover:text-red-400 transition-colors"
                              title="Delete Lead"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
