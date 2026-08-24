import React from 'react';
import { Bookmark, Building2, MapPin, ExternalLink, Trash2, Mail, FileText } from 'lucide-react';
import { marked } from 'marked';
import axios from 'axios';

export default function SavedJobs({ savedJobs, setSavedJobs }) {
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

            {(job.generatedEmail || job.generatedResume || job.generatedCoverLetter) && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4">
                {job.generatedEmail && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1"><Mail className="w-3 h-3"/> Email</span>
                    <button onClick={() => downloadPDF(job.generatedEmail.body, `${job.company.replace(/\\s+/g, '_')}_Email.pdf`)} className="text-xs text-indigo-600 hover:underline">Download PDF</button>
                  </div>
                )}
                {job.generatedResume && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1"><FileText className="w-3 h-3"/> Resume</span>
                    <button onClick={() => downloadPDF(job.generatedResume, `${job.company.replace(/\\s+/g, '_')}_Resume.pdf`)} className="text-xs text-indigo-600 hover:underline">Download PDF</button>
                  </div>
                )}
                {job.generatedCoverLetter && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1"><FileText className="w-3 h-3"/> Cover Letter</span>
                    <button onClick={() => downloadPDF(job.generatedCoverLetter, `${job.company.replace(/\\s+/g, '_')}_CoverLetter.pdf`)} className="text-xs text-indigo-600 hover:underline">Download PDF</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
