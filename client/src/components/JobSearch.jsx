import React, { useState } from 'react';
import { Search, MapPin, Loader2, Link as LinkIcon, Plus } from 'lucide-react';
import axios from 'axios';

export default function JobSearch({ onJobsFound, isLoading, setIsLoading, setSavedJobs }) {
  const [keyword, setKeyword] = useState('React');
  const [location, setLocation] = useState('Remote');
  const [selectedPlatforms, setSelectedPlatforms] = useState(['LinkedIn', 'Indeed']);
  const [error, setError] = useState('');

  const [customInput, setCustomInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [customError, setCustomError] = useState('');

  const availablePlatforms = ['LinkedIn', 'Indeed', 'ZipRecruiter', 'Glassdoor', 'Google', 'Bayt', 'Naukri', 'MauKerja'];

  const togglePlatform = (platform) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!keyword) return;
    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform.');
      return;
    }
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:3000/api/scrape', { keyword, location, platforms: selectedPlatforms });
      if (response.data.success) {
        onJobsFound(response.data.jobs);
      } else {
        setError(response.data.error || 'Failed to fetch jobs');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomParse = async (e) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    setIsParsing(true);
    setCustomError('');

    try {
      const response = await axios.post('http://localhost:3000/api/parse-custom-job', { input: customInput });
      if (response.data.success) {
        onJobsFound(response.data.jobs); // Update pipeline
        
        // Auto-save this custom job
        if (setSavedJobs) {
          setSavedJobs(prev => {
            if (prev.some(j => j.id === response.data.job.id)) return prev;
            return [response.data.job, ...prev];
          });
        }
        
        setCustomInput('');
      } else {
        setCustomError(response.data.error || 'Failed to parse job');
      }
    } catch (err) {
      setCustomError(err.message || 'An error occurred while parsing');
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-900">Scrape Jobs</h2>
        </div>
      
      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Job Title / Keyword</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="e.g. Frontend Developer"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Remote, New York"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Job Boards</label>
          <div className="grid grid-cols-2 gap-2">
            {availablePlatforms.map(platform => (
              <label key={platform} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={selectedPlatforms.includes(platform)}
                  onChange={() => togglePlatform(platform)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                {platform}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Scrape Jobs'}
        </button>
      </form>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <LinkIcon className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-900">Add Custom Job</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">Paste a URL (e.g. from Threads, Twitter, or a company page) or just paste raw text describing a job.</p>
        <form onSubmit={handleCustomParse} className="space-y-4">
          <div>
            <textarea 
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm min-h-[100px]"
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              placeholder="https://www.threads.net/... or raw job description text"
            />
          </div>

          {customError && <p className="text-sm text-red-500">{customError}</p>}

          <button
            type="submit"
            disabled={isParsing || !customInput.trim()}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Parse & Add Job</>}
          </button>
        </form>
      </div>
    </div>
  );
}
