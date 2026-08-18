import React, { useState } from 'react';
import JobSearch from './components/JobSearch';
import ResumeUpload from './components/ResumeUpload';
import OutreachDashboard from './components/OutreachDashboard';
import { Briefcase } from 'lucide-react';

function App() {
  const [resumeText, setResumeText] = useState('');
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Hermes JobTracker</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <ResumeUpload onResumeUploaded={setResumeText} resumeText={resumeText} />
            <JobSearch onJobsFound={(newJobs) => setJobs(newJobs)} isLoading={isLoading} setIsLoading={setIsLoading} />
          </div>
          
          <div className="lg:col-span-2">
            <OutreachDashboard jobs={jobs} setJobs={setJobs} resumeText={resumeText} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
