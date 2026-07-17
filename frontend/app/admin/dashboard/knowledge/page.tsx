'use client';

import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';

interface KnowledgeFile {
  id: string;
  filename: string;
  category: string;
  size_bytes: number;
  checksum: string;
  uploaded_at: string;
  last_indexed: string;
}

export default function KnowledgeManager() {
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState('general');
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success'|'error', msg: string } | null>(null);

  const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('zencro_admin_token');
      const res = await fetch(`${apiHost}/api/v1/knowledge`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFiles(data.data || []);
      }
    } catch (e) {
      console.error("Failed to load knowledge files", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadStatus(null);
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('category', category);

    try {
      const token = localStorage.getItem('zencro_admin_token');
      const res = await fetch(`${apiHost}/api/v1/knowledge/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const data = await res.json();
      if (res.ok) {
        setUploadStatus({ type: 'success', msg: data.message });
        setSelectedFile(null);
        fetchFiles();
      } else {
        setUploadStatus({ type: 'error', msg: data.detail || 'Upload failed' });
      }
    } catch (e) {
      setUploadStatus({ type: 'error', msg: 'Network error during upload' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm("Delete this document from the knowledge base? The AI will no longer use it.")) return;
    try {
      const token = localStorage.getItem('zencro_admin_token');
      const res = await fetch(`${apiHost}/api/v1/knowledge/${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchFiles();
    } catch (e) {
      alert("Error deleting file");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB'], i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Knowledge Engine Manager</h1>
          <span className="text-xs text-slate-400">Upload and manage documents the AI uses for RAG context.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Panel */}
        <div className="bg-slate-950/40 border border-slate-900 p-6 rounded-2xl glassmorphism h-fit">
          <h3 className="font-semibold text-sm mb-4 border-b border-slate-900 pb-2 flex items-center space-x-2">
            <UploadCloud size={16} className="text-blue-400" />
            <span>Upload Document</span>
          </h3>
          
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-[10px] text-slate-400 font-medium mb-1">Select File (MD, TXT, PDF, DOCX)</label>
              <input
                type="file"
                required
                accept=".md,.txt,.pdf,.docx"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-900/20 file:text-blue-400 hover:file:bg-blue-900/30"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-medium mb-1">Document Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="general">General Information</option>
                <option value="services">Services & Pricing</option>
                <option value="policies">Company Policies</option>
                <option value="technical">Technical Docs</option>
              </select>
            </div>
            
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-xs py-2.5 rounded-xl transition-all shadow-md flex justify-center items-center"
            >
              {uploading ? <RefreshCw className="animate-spin" size={16} /> : 'Upload & Parse to Engine'}
            </button>

            {uploadStatus && (
              <div className={`mt-3 p-3 rounded-lg text-[10px] font-medium flex items-start space-x-2 ${uploadStatus.type === 'success' ? 'bg-green-950/30 text-green-400 border border-green-900/30' : 'bg-red-950/30 text-red-400 border border-red-900/30'}`}>
                {uploadStatus.type === 'success' ? <CheckCircle2 size={14} className="shrink-0 mt-0.5" /> : <Trash2 size={14} className="shrink-0 mt-0.5" />}
                <span>{uploadStatus.msg}</span>
              </div>
            )}
          </form>
          
          <div className="mt-6 p-4 border border-slate-900 rounded-xl bg-slate-900/20">
            <h4 className="text-[10px] font-bold text-slate-300 mb-2 uppercase">Future Plugin Architecture</h4>
            <ul className="text-[10px] text-slate-500 space-y-1">
              <li>• PPTX parsing plugin (Planned)</li>
              <li>• XLSX/CSV data tables (Planned)</li>
              <li>• HTML/URL crawling (Planned)</li>
            </ul>
          </div>
        </div>

        {/* File Database */}
        <div className="md:col-span-2 bg-slate-950/40 border border-slate-900 rounded-2xl glassmorphism overflow-hidden">
          <div className="p-4 border-b border-slate-900 bg-slate-900/30 flex justify-between items-center">
            <h3 className="font-semibold text-sm">Indexed Knowledge Base</h3>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{files.length} active files</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/60 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Document</th>
                  <th className="p-4 text-center">Category</th>
                  <th className="p-4 text-right">Size</th>
                  <th className="p-4">Metadata</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/50">
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading indexed files...</td></tr>
                ) : files.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">No knowledge files uploaded yet.</td></tr>
                ) : (
                  files.map(f => (
                    <tr key={f.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <FileText size={16} className="text-slate-500" />
                          <span className="font-medium text-slate-200">{f.filename}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {f.category}
                        </span>
                      </td>
                      <td className="p-4 text-right text-slate-400 font-mono text-[10px]">{formatBytes(f.size_bytes || 0)}</td>
                      <td className="p-4 text-[9px] text-slate-500 space-y-1">
                        <div>Upload: {new Date(f.uploaded_at).toLocaleDateString()}</div>
                        <div className="truncate w-24" title={f.checksum}>MD5: {f.checksum?.substring(0,8)}...</div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="flex justify-center items-center space-x-1 text-[10px] text-green-400">
                          <CheckCircle2 size={12} />
                          <span>Indexed</span>
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleDelete(f.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                          title="Delete File"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
