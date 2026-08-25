import React, { useState } from 'react';
import { Bookmark, Building2, MapPin, ExternalLink, Trash2, Mail, FileText, Eye, X, Loader2, Bot } from 'lucide-react';
import { marked } from 'marked';
import axios from 'axios';

export default function SavedJobs({ savedJobs, setSavedJobs }) {
  const [activeModalJob, setActiveModalJob] = useState(null);
  const [generatingFor, setGeneratingFor] = useState(null);
  const [error, setError] = useState('');
  const [expandedEmails, setExpandedEmails] = useState({});

  const removeSavedJob = (id) => {
    setSavedJobs(prev => prev.filter(job => job.id !== id));
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

  if (savedJobs.length === 0) {
    return (
      <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
        <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">No saved jobs yet</h3>
        <p className="text-slate-500">Jobs parsed from custom links or tailored for applications will appear here permanently.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-indigo-600" />
          Saved Jobs Collection
        </h2>
        <span className="bg-slate-100 text-slate-600 text-sm px-3 py-1 rounded-full font-medium">
          {savedJobs.length} Saved
        </span>
      </div>

      {error && (
        <div className="px-6 py-3 bg-red-50 text-red-600 text-sm border-b border-red-100">
          {error}
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {savedJobs.map(job => (
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
                  <a href={job.url} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
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
              <div className="mt-4 mb-4 bg-slate-100 rounded-lg p-4 text-sm font-mono text-slate-800 whitespace-pre-wrap border border-slate-200">
                <span className="font-bold">Subject:</span> {job.generatedEmail.subject}
                <hr className="my-2 border-slate-300" />
                {job.generatedEmail.body}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4">
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
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition-colors mr-2"
                >
                  <Eye className="w-3 h-3" />
                  View / Edit Docs
                </button>
              )}

              {job.generatedResume && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1"><FileText className="w-3 h-3" /> CV</span>
                  <button onClick={() => downloadPDF(job.generatedResume, `${job.company.replace(/\\s+/g, '_')}_CV.pdf`)} className="text-xs text-indigo-600 hover:underline">Download PDF</button>
                </div>
              )}
              {job.generatedCoverLetter && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1"><FileText className="w-3 h-3" /> Cover Letter</span>
                  <button onClick={() => downloadPDF(job.generatedCoverLetter, `${job.company.replace(/\\s+/g, '_')}_CoverLetter.pdf`)} className="text-xs text-indigo-600 hover:underline">Download PDF</button>
                </div>
              )}
            </div>
          </div>
        ))}
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
    </div>
  );
}
