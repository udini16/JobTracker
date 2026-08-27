import React, { useState } from 'react';
import { Bookmark, Building2, MapPin, ExternalLink, Trash2, Mail, FileText, Eye, X, Loader2, Bot, Send, Pencil, Plus } from 'lucide-react';
import { marked } from 'marked';
import axios from 'axios';

export default function SavedJobs({ savedJobs, setSavedJobs, viewMode = 'saved' }) {
  const [activeModalJob, setActiveModalJob] = useState(null);
  const [generatingFor, setGeneratingFor] = useState(null);
  const [tailoringFor, setTailoringFor] = useState(null);
  const [error, setError] = useState('');
  const [expandedEmails, setExpandedEmails] = useState({});
  const [attachments, setAttachments] = useState({});
  const [sendingFor, setSendingFor] = useState(null);
  const [editingJob, setEditingJob] = useState(null);

  const removeSavedJob = (id) => {
    setSavedJobs(prev => prev.filter(job => job.id !== id));
  };

  const updateEmail = (jobId, field, value) => {
    setSavedJobs(prev => prev.map(job => {
      if (job.id === jobId && job.generatedEmail) {
        return {
          ...job,
          generatedEmail: {
            ...job.generatedEmail,
            [field]: value
          }
        };
      }
      return job;
    }));
  };

  const downloadPDF = async (content, filename) => {
    const htmlContent = marked.parse(content);
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px; }
          h1, h2, h3 { color: #111; margin-bottom: 10px; margin-top: 20px; }
          p { margin-bottom: 15px; }
          ul, ol { margin-bottom: 15px; padding-left: 20px; }
          li { margin-bottom: 5px; }
          strong { font-weight: bold; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;

    try {
      const response = await axios.post('http://localhost:3000/api/generate-pdf', { html: fullHtml }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('PDF download failed', err);
      alert('Failed to generate PDF');
    }
  };

  const buildPdfHtml = (content) => {
    if (!content) return '';
    const htmlContent = marked.parse(content);
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px; }
          h1, h2, h3 { color: #111; margin-bottom: 10px; margin-top: 20px; }
          p { margin-bottom: 15px; }
          ul, ol { margin-bottom: 15px; padding-left: 20px; }
          li { margin-bottom: 5px; }
          strong { font-weight: bold; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;
  };

  const sendEmail = async (jobId) => {
    setError('');
    setSendingFor(jobId);
    
    try {
      const job = savedJobs.find(j => j.id === jobId);
      const jobAttachments = attachments[jobId] || {};
      
      const formData = new FormData();
      formData.append('jobId', jobId);
      formData.append('job', JSON.stringify(job));
      
      if (jobAttachments.attachCV && job.generatedResume) {
        formData.append('cvHtml', buildPdfHtml(job.generatedResume));
      }
      if (jobAttachments.attachCL && job.generatedCoverLetter) {
        formData.append('clHtml', buildPdfHtml(job.generatedCoverLetter));
      }
      if (jobAttachments.customFile) {
        formData.append('customFile', jobAttachments.customFile);
      }

      const response = await axios.post('http://localhost:3000/api/send', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.data.success) {
        setSavedJobs(prev => prev.map(j => j.id === jobId ? response.data.job : j));
      } else {
        setError(response.data.error || 'Failed to send email');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingFor(null);
    }
  };

  const generateEmail = async (jobId) => {
    setGeneratingFor(jobId);
    setError('');
    try {
      const response = await axios.post('http://localhost:3000/api/generate', {
        jobId,
        job: savedJobs.find(j => j.id === jobId),
        resumeText: localStorage.getItem('hermes_base_profile_data') || '{}'
      });

      if (response.data.success) {
        setSavedJobs(prev => prev.map(j => j.id === jobId ? response.data.job : j));
      } else {
        setError(response.data.error || 'Failed to generate email');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setGeneratingFor(null);
    }
  };

  const generateDocs = async (jobId) => {
    setTailoringFor(jobId);
    setError('');
    
    try {
      const profileData = JSON.parse(localStorage.getItem('hermes_base_profile_data') || '{}');
      if (!profileData || Object.keys(profileData).length === 0) {
        setError('Please provide your Profile details first in the Base Profile tab.');
        setTailoringFor(null);
        return;
      }
      
      const response = await axios.post('http://localhost:3000/api/generate-application', { 
        jobId,
        job: savedJobs.find(j => j.id === jobId),
        profileData
      });
      if (response.data.success) {
        setSavedJobs(prev => prev.map(j => j.id === jobId ? response.data.job : j));
        setActiveModalJob(response.data.job);
      } else {
        setError(response.data.error || 'Failed to generate documents');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setTailoringFor(null);
    }
  };

  const handleSaveJobDetails = () => {
    if (!editingJob.title || !editingJob.company) {
      alert("Title and Company are required.");
      return;
    }
    
    setSavedJobs(prev => {
      // If it's an existing job (has an ID that matches)
      const exists = prev.find(j => j.id === editingJob.id);
      if (exists) {
        return prev.map(j => j.id === editingJob.id ? editingJob : j);
      }
      // Otherwise it's a new job being manually added
      return [{
        ...editingJob,
        id: editingJob.id || `manual-${Date.now()}`,
        status: editingJob.status || 'Saved manually',
        source: editingJob.source || 'Manual Entry',
      }, ...prev];
    });
    setEditingJob(null);
  };

  
  const unappliedJobs = savedJobs.filter(j => j.status !== 'Sent' && j.status !== 'Opened');
  const appliedJobs = savedJobs.filter(j => j.status === 'Sent' || j.status === 'Opened');
  const jobsToDisplay = viewMode === 'saved' ? unappliedJobs : appliedJobs;

  if (jobsToDisplay.length === 0 && !editingJob) {
    return (
      <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
        {viewMode === 'saved' ? (
          <>
            <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No saved jobs yet</h3>
            <p className="text-slate-500 mb-6">Jobs parsed from custom links or tailored for applications will appear here.</p>
          </>
        ) : (
          <>
            <Send className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No applied jobs yet</h3>
            <p className="text-slate-500 mb-6">Jobs you have successfully sent emails for will appear here.</p>
          </>
        )}
        {viewMode === 'saved' && (
          <button
            onClick={() => setEditingJob({ title: '', company: '', location: '', url: '', description: '' })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Custom Job
          </button>
        )}
      </div>
    );
  }

  const renderJobCard = (job) => (
    <div key={job.id} className="p-6 hover:bg-slate-50 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">{job.title}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span>{job.company}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    {job.source}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {job.url && (
                  <a href={job.url} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Original Post">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => setEditingJob(job)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Edit Job Details"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeSavedJob(job.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove from saved"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="text-sm text-slate-700 mb-4 line-clamp-2">
              {job.description}
            </div>

            {job.generatedEmail && expandedEmails[job.id] && (
              <div className="mt-4 mb-4 bg-slate-100 rounded-lg p-4 text-sm font-mono border border-slate-200 flex flex-col gap-2">
                <div className="flex items-center gap-2 border-b border-slate-300 pb-2">
                  <span className="font-bold text-slate-700">Subject:</span>
                  <input 
                    className="flex-1 bg-transparent focus:outline-none text-slate-800" 
                    value={job.generatedEmail.subject} 
                    onChange={(e) => updateEmail(job.id, 'subject', e.target.value)}
                  />
                </div>
                <textarea 
                  className="w-full h-48 bg-transparent focus:outline-none resize-y text-slate-800" 
                  value={job.generatedEmail.body} 
                  onChange={(e) => updateEmail(job.id, 'body', e.target.value)}
                />
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="flex-1">
                {job.generatedEmail && job.status !== 'Sent' && job.status !== 'Opened' && expandedEmails[job.id] && (
                  <div className="flex flex-col gap-3">
                    <h4 className="text-sm font-semibold text-slate-700">Attachments</h4>
                    <div className="flex flex-col gap-2">
                      {job.generatedResume && (
                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                          <input type="checkbox" checked={attachments[job.id]?.attachCV || false} onChange={(e) => setAttachments(prev => ({ ...prev, [job.id]: { ...prev[job.id], attachCV: e.target.checked } }))} />
                          Attach Tailored CV
                        </label>
                      )}
                      {job.generatedCoverLetter && (
                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                          <input type="checkbox" checked={attachments[job.id]?.attachCL || false} onChange={(e) => setAttachments(prev => ({ ...prev, [job.id]: { ...prev[job.id], attachCL: e.target.checked } }))} />
                          Attach Tailored Cover Letter
                        </label>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-slate-600">Custom PDF:</span>
                        <input type="file" accept=".pdf" className="text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" onChange={(e) => setAttachments(prev => ({ ...prev, [job.id]: { ...prev[job.id], customFile: e.target.files[0] } }))} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                {!job.generatedEmail && (
                  <button
                    onClick={() => generateEmail(job.id)}
                    disabled={generatingFor === job.id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {generatingFor === job.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3" />}
                    Generate Hermes Email
                  </button>
                )}
                
                {(!job.generatedResume || !job.generatedCoverLetter) && (
                  <button
                    onClick={() => generateDocs(job.id)}
                    disabled={tailoringFor === job.id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {tailoringFor === job.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                    Tailor CV
                  </button>
                )}

                {job.generatedEmail && (
                  <button
                    onClick={() => setExpandedEmails(prev => ({ ...prev, [job.id]: !prev[job.id] }))}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Mail className="w-3 h-3" />
                    {expandedEmails[job.id] ? 'Hide Draft Email' : 'See draft email generated by Hermes'}
                  </button>
                )}

                {(job.generatedEmail || job.generatedResume || job.generatedCoverLetter) && (
                  <button
                    onClick={() => setActiveModalJob(job)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    View / Edit Docs
                  </button>
                )}
                
                {job.generatedResume && (
                  <button onClick={() => downloadPDF(job.generatedResume, `${job.company.replace(/\\s+/g, '_')}_CV.pdf`)} className="text-xs font-medium text-indigo-600 hover:underline">Download CV PDF</button>
                )}
                
                {job.generatedCoverLetter && (
                  <button onClick={() => downloadPDF(job.generatedCoverLetter, `${job.company.replace(/\\s+/g, '_')}_CoverLetter.pdf`)} className="text-xs font-medium text-indigo-600 hover:underline">Download CL PDF</button>
                )}

                {job.generatedEmail && job.status !== 'Sent' && job.status !== 'Opened' && (
                  <button
                    onClick={() => sendEmail(job.id)}
                    disabled={sendingFor === job.id}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ml-2"
                  >
                    {sendingFor === job.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send Email via Gmail
                  </button>
                )}
              </div>
            </div>
          </div>
  );

  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          {viewMode === 'saved' ? <Bookmark className="w-5 h-5 text-indigo-600" /> : <Send className="w-5 h-5 text-green-600" />}
          {viewMode === 'saved' ? 'Saved Jobs Collection' : 'Applied Jobs'}
        </h2>
        <div className="flex items-center gap-3">
          <span className="bg-slate-100 text-slate-600 text-sm px-3 py-1 rounded-full font-medium">
            {jobsToDisplay.length} {viewMode === 'saved' ? 'Saved' : 'Applied'}
          </span>
          {viewMode === 'saved' && (
            <button
              onClick={() => setEditingJob({ title: '', company: '', location: '', url: '', description: '' })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Job
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="px-6 py-3 bg-red-50 text-red-600 text-sm border-b border-red-100">
          {error}
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {jobsToDisplay.map(renderJobCard)}
      </div>

      {activeModalJob && (

        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="text-lg font-bold text-slate-900">Application Documents for {activeModalJob.company}</h3>
              <button onClick={() => setActiveModalJob(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="font-semibold text-slate-700 flex items-center gap-2"><FileText className="w-4 h-4" /> Tailored CV</h4>
                  <button onClick={() => downloadPDF(activeModalJob.generatedResume, `${activeModalJob.company.replace(/\\s+/g, '_')}_CV.pdf`)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">Download .pdf</button>
                </div>
                <textarea
                  className="w-full h-[500px] p-4 text-sm font-mono text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  value={activeModalJob.generatedResume}
                  onChange={(e) => setActiveModalJob(prev => ({ ...prev, generatedResume: e.target.value }))}
                />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="font-semibold text-slate-700 flex items-center gap-2"><Mail className="w-4 h-4" /> Cover Letter</h4>
                  <button onClick={() => downloadPDF(activeModalJob.generatedCoverLetter, `${activeModalJob.company.replace(/\\s+/g, '_')}_CoverLetter.pdf`)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">Download .pdf</button>
                </div>
                <textarea
                  className="w-full h-[500px] p-4 text-sm font-mono text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  value={activeModalJob.generatedCoverLetter}
                  onChange={(e) => setActiveModalJob(prev => ({ ...prev, generatedCoverLetter: e.target.value }))}
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-3">
              <button onClick={() => setActiveModalJob(null)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => {
                  setSavedJobs(prev => prev.map(j => j.id === activeModalJob.id ? activeModalJob : j));
                  setActiveModalJob(null);
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {editingJob && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="text-lg font-bold text-slate-900">{editingJob.id ? 'Edit Job Details' : 'Add New Job'}</h3>
              <button onClick={() => setEditingJob(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Job Title *</label>
                <input 
                  type="text" 
                  value={editingJob.title || ''} 
                  onChange={e => setEditingJob({...editingJob, title: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Senior Frontend Engineer"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company *</label>
                  <input 
                    type="text" 
                    value={editingJob.company || ''} 
                    onChange={e => setEditingJob({...editingJob, company: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target HR Email</label>
                  <input 
                    type="email" 
                    value={editingJob.hrEmail || ''} 
                    onChange={e => setEditingJob({...editingJob, hrEmail: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. careers@acme.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <input 
                    type="text" 
                    value={editingJob.location || ''} 
                    onChange={e => setEditingJob({...editingJob, location: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Remote, San Francisco"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Job URL</label>
                  <input 
                    type="text" 
                    value={editingJob.url || ''} 
                    onChange={e => setEditingJob({...editingJob, url: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Job Description</label>
                <textarea 
                  value={editingJob.description || ''} 
                  onChange={e => setEditingJob({...editingJob, description: e.target.value})}
                  className="w-full h-48 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                  placeholder="Paste the full job description here..."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-3">
              <button onClick={() => setEditingJob(null)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSaveJobDetails}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Save Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
