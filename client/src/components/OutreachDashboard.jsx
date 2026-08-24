import React, { useState } from 'react';
import { Send, Bot, Mail, CheckCircle2, Eye, Loader2, ExternalLink, FileText, X } from 'lucide-react';
import axios from 'axios';
import { marked } from 'marked';

export default function OutreachDashboard({ jobs, setJobs, profileData, setSavedJobs }) {
  const [generatingFor, setGeneratingFor] = useState(null);
  const [tailoringFor, setTailoringFor] = useState(null);
  const [sendingFor, setSendingFor] = useState(null);
  const [activeModalJob, setActiveModalJob] = useState(null);
  const [error, setError] = useState('');
  
  const [showPreGenFor, setShowPreGenFor] = useState(null);
  const [selectedProjIds, setSelectedProjIds] = useState([]);
  const [manualSkills, setManualSkills] = useState([]);
  const [newManualSkill, setNewManualSkill] = useState('');

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
    if (!profileData || Object.keys(profileData).length === 0) {
      setError('Please provide your Base Profile details first.');
      return;
    }
    setError('');
    setGeneratingFor(jobId);
    
    try {
      const response = await axios.post('http://localhost:3000/api/generate', { jobId, resumeText: JSON.stringify(profileData) });
      if (response.data.success) {
        setJobs(prev => prev.map(j => j.id === jobId ? response.data.job : j));
        
        // Auto-save
        if (setSavedJobs) {
          setSavedJobs(prev => {
            const exists = prev.find(j => j.id === response.data.job.id);
            if (exists) {
              return prev.map(j => j.id === response.data.job.id ? response.data.job : j);
            }
            return [response.data.job, ...prev];
          });
        }
      } else {
        setError(response.data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setGeneratingFor(null);
    }
  };

  const handleTailorClick = (jobId) => {
    if (!profileData || Object.keys(profileData).length === 0) {
      setError('Please provide your Profile details first in the Base Profile tab.');
      return;
    }
    setError('');
    setShowPreGenFor(jobId);
    setSelectedProjIds(profileData.projects?.map(p => p.id) || []);
    setManualSkills([]);
    setNewManualSkill('');
  };

  const tailorApplication = async () => {
    const jobId = showPreGenFor;
    setTailoringFor(jobId);
    setShowPreGenFor(null);
    
    const selectedProjects = profileData.projects?.filter(p => selectedProjIds.includes(p.id)) || [];
    const autoSkills = [...new Set(selectedProjects.flatMap(p => p.skills))];
    const finalSkills = [...new Set([...manualSkills, ...autoSkills])];

    try {
      const response = await axios.post('http://localhost:3000/api/generate-application', { 
        jobId, 
        profileData: {
          ...profileData,
          projects: selectedProjects,
          skills: finalSkills
        } 
      });
      if (response.data.success) {
        setJobs(prev => prev.map(j => j.id === jobId ? response.data.job : j));
        setActiveModalJob(response.data.job);
        
        // Auto-save
        if (setSavedJobs) {
          setSavedJobs(prev => {
            const exists = prev.find(j => j.id === response.data.job.id);
            if (exists) {
              return prev.map(j => j.id === response.data.job.id ? response.data.job : j);
            }
            return [response.data.job, ...prev];
          });
        }
      } else {
        setError(response.data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setTailoringFor(null);
    }
  };

  const addManualSkill = (e) => {
    e.preventDefault();
    if (!newManualSkill.trim()) return;
    const skillsArray = newManualSkill.split(',').map(s => s.trim()).filter(s => s);
    setManualSkills(prev => [...new Set([...prev, ...skillsArray])]);
    setNewManualSkill('');
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

              <button
                onClick={() => handleTailorClick(job.id)}
                disabled={tailoringFor === job.id}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {tailoringFor === job.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Tailor Resume & CV
              </button>

              {job.generatedResume && (
                <button
                  onClick={() => setActiveModalJob(job)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-sm font-medium transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Docs
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
                  <h4 className="font-semibold text-slate-700 flex items-center gap-2"><FileText className="w-4 h-4"/> Tailored Resume</h4>
                  <button onClick={() => downloadPDF(activeModalJob.generatedResume, `${activeModalJob.company.replace(/\s+/g, '_')}_Resume.pdf`)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">Download .pdf</button>
                </div>
                <textarea 
                  className="w-full h-[500px] p-4 text-sm font-mono text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                  defaultValue={activeModalJob.generatedResume}
                  readOnly
                />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="font-semibold text-slate-700 flex items-center gap-2"><Mail className="w-4 h-4"/> Cover Letter</h4>
                  <button onClick={() => downloadPDF(activeModalJob.generatedCoverLetter, `${activeModalJob.company.replace(/\s+/g, '_')}_CoverLetter.pdf`)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">Download .pdf</button>
                </div>
                <textarea 
                  className="w-full h-[500px] p-4 text-sm font-mono text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                  defaultValue={activeModalJob.generatedCoverLetter}
                  readOnly
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end">
              <button onClick={() => setActiveModalJob(null)} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreGenFor && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="text-lg font-bold text-slate-900">Tailor Resume Settings</h3>
              <button onClick={() => setShowPreGenFor(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">1. Select Projects</h4>
                <p className="text-sm text-slate-500 mb-3">Choose which projects to include for this application.</p>
                <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-lg">
                  {profileData.projects?.map(proj => (
                    <label key={proj.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="mt-1"
                        checked={selectedProjIds.includes(proj.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedProjIds([...selectedProjIds, proj.id]);
                          else setSelectedProjIds(selectedProjIds.filter(id => id !== proj.id));
                        }}
                      />
                      <div>
                        <div className="text-sm font-medium text-slate-800">{proj.title}</div>
                        <div className="text-xs text-slate-500 line-clamp-1">{proj.description}</div>
                      </div>
                    </label>
                  ))}
                  {(!profileData.projects || profileData.projects.length === 0) && (
                    <p className="text-sm text-slate-400 p-2">No projects added to base profile.</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 mb-2">2. Dynamic Skills</h4>
                <p className="text-sm text-slate-500 mb-3">These skills are automatically populated from your selected projects. You can add extra skills manually or select them from your master list.</p>
                
                <div className="mb-4 space-y-2">
                  <p className="text-xs font-medium text-slate-700">Master Skills List (Click to include/exclude)</p>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-white">
                    {profileData.masterSkills?.map(skill => {
                      const isSelected = manualSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setManualSkills(prev => prev.filter(s => s !== skill));
                            } else {
                              setManualSkills(prev => [...prev, skill]);
                            }
                          }}
                          className={`px-2 py-1 border rounded text-xs transition-colors ${isSelected ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                        >
                          {skill}
                        </button>
                      );
                    })}
                    {(!profileData.masterSkills || profileData.masterSkills.length === 0) && (
                      <span className="text-xs text-slate-400">No master skills available in Base Profile.</span>
                    )}
                  </div>
                </div>

                <form onSubmit={addManualSkill} className="flex gap-2 mb-3">
                  <input
                    type="text"
                    className="flex-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Add extra skill manually..."
                    value={newManualSkill}
                    onChange={(e) => setNewManualSkill(e.target.value)}
                  />
                  <button type="submit" className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-sm font-medium">
                    Add
                  </button>
                </form>

                <div className="flex flex-wrap gap-1.5 p-3 border border-slate-200 rounded-lg bg-slate-50 min-h-[60px]">
                  {(() => {
                    const selectedProjects = profileData.projects?.filter(p => selectedProjIds.includes(p.id)) || [];
                    const autoSkills = [...new Set(selectedProjects.flatMap(p => p.skills))];
                    const finalSkills = [...new Set([...manualSkills, ...autoSkills])];

                    if (finalSkills.length === 0) return <span className="text-sm text-slate-400 italic">No skills selected.</span>;

                    return finalSkills.map(skill => {
                      const isAuto = autoSkills.includes(skill);
                      return (
                        <span key={skill} className={`px-2 py-1 border rounded text-xs flex items-center gap-1 ${isAuto ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-300 text-slate-700'}`}>
                          {skill}
                          {!isAuto && (
                            <button onClick={() => setManualSkills(prev => prev.filter(s => s !== skill))} className="text-slate-400 hover:text-red-500 ml-1">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      );
                    });
                  })()}
                </div>
                <p className="text-xs text-slate-400 mt-2">Green tags are auto-generated from selected projects.</p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-3">
              <button onClick={() => setShowPreGenFor(null)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={tailorApplication} disabled={tailoringFor !== null} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
                {tailoringFor !== null ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                Generate Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
