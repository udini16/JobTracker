import React, { useState } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function JobSearch({ onJobsFound, isLoading, setIsLoading }) {
  const [keyword, setKeyword] = useState('React');
  const [location, setLocation] = useState('Remote');
  const [selectedPlatforms, setSelectedPlatforms] = useState(['LinkedIn', 'Indeed']);
  const [error, setError] = useState('');

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

  return (
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
  );
}
