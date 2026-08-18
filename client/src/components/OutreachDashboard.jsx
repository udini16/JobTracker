import React, { useState } from 'react';
import { Send, Bot, Mail, CheckCircle2, Eye, Loader2, ExternalLink } from 'lucide-react';
import axios from 'axios';

export default function OutreachDashboard({ jobs, setJobs, resumeText }) {
  const [generatingFor, setGeneratingFor] = useState(null);
  const [sendingFor, setSendingFor] = useState(null);
  const [error, setError] = useState('');

  const generateEmail = async (jobId) => {
    if (!resumeText) {
      setError('Please provide your resume text first.');
      return;
    }
    setError('');
    setGeneratingFor(jobId);
    
    try {
      const response = await axios.post('http://localhost:3000/api/generate', { jobId, resumeText });
      if (response.data.success) {
        setJobs(prev => prev.map(j => j.id === jobId ? response.data.job : j));
      } else {
        setError(response.data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setGeneratingFor(null);
    }
  };

  const sendEmail = async (jobId) => {
    setError('');
    setSendingFor(jobId);
    
    try {
      const response = await axios.post('http://localhost:3000/api/send', { jobId });
      if (response.data.success) {
        setJobs(prev => prev.map(j => j.id === jobId ? response.data.job : j));
      } else {
        setError(response.data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingFor(null);
    }
  };

  const StatusBadge = ({ status }) => {
    switch(status) {
      case 'Scraped':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800"><Bot className="w-3 h-3"/> Discovered</span>;
      case 'Email Generated':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Mail className="w-3 h-3"/> Draft Ready</span>;
      case 'Sent':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Send className="w-3 h-3"/> Sent</span>;
      case 'Opened':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><Eye className="w-3 h-3"/> Opened!</span>;
      default:
        return null;
    }
  };

  if (jobs.length === 0) {
    return (
      <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bot className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-1">No jobs found yet</h3>
        <p className="text-slate-500">Use the job search panel to scrape for new opportunities.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-900">Outreach Pipeline</h2>
        <span className="text-sm font-medium text-slate-500">{jobs.length} jobs in pipeline</span>
      </div>
      
      {error && (
        <div className="px-6 py-3 bg-red-50 text-red-600 text-sm border-b border-red-100">
          {error}
        </div>
      )}

      <div className="divide-y divide-slate-200 max-h-[800px] overflow-y-auto">
        {jobs.map((job) => (
          <div key={job.id} className="p-6 transition-colors hover:bg-slate-50">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{job.title}</h3>
                <p className="text-sm font-medium text-slate-600 mb-2">{job.company}</p>
                <StatusBadge status={job.status} />
              </div>
              <a href={job.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium">
                View Job <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {job.generatedEmail ? (
              <div className="mt-4 bg-slate-100 rounded-lg p-4 text-sm font-mono text-slate-800 whitespace-pre-wrap border border-slate-200">
                <span className="font-bold">Subject:</span> {job.generatedEmail.subject}
                <hr className="my-2 border-slate-300" />
                {job.generatedEmail.body}
              </div>
            ) : (
              <p className="text-sm text-slate-500 mt-2 line-clamp-2">{job.description}</p>
            )}

            <div className="mt-6 flex items-center gap-3">
              {!job.generatedEmail && (
                <button
                  onClick={() => generateEmail(job.id)}
                  disabled={generatingFor === job.id}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {generatingFor === job.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                  Generate Hermes Email
                </button>
              )}
              
              {job.generatedEmail && job.status !== 'Sent' && job.status !== 'Opened' && (
                <button
                  onClick={() => sendEmail(job.id)}
                  disabled={sendingFor === job.id}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {sendingFor === job.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send Email via Resend
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
