import React, { useState } from 'react';
import JobSearch from './components/JobSearch';
import ProfileManager from './components/ProfileManager';
import OutreachDashboard from './components/OutreachDashboard';
import { Briefcase, UserCircle, LayoutDashboard } from 'lucide-react';

function App() {
  const [profileText, setProfileText] = useState('');
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pipeline');

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Hermes JobPortal</h1>
          </div>
          <nav className="flex space-x-2">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'pipeline' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Job Pipeline
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <UserCircle className="w-4 h-4" />
              My Base Profile
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'pipeline' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
              <JobSearch onJobsFound={(newJobs) => setJobs(newJobs)} isLoading={isLoading} setIsLoading={setIsLoading} />
            </div>
            <div className="lg:col-span-2">
              <OutreachDashboard jobs={jobs} setJobs={setJobs} resumeText={profileText} />
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <ProfileManager onProfileUpdate={setProfileText} profileText={profileText} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
