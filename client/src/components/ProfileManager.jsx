import React, { useEffect } from 'react';
import { UserCircle } from 'lucide-react';

export default function ProfileManager({ onProfileUpdate, profileText }) {
  useEffect(() => {
    const savedProfile = localStorage.getItem('hermes_base_profile');
    if (savedProfile) {
      onProfileUpdate(savedProfile);
    }
  }, []);

  const handleTextChange = (e) => {
    const text = e.target.value;
    onProfileUpdate(text);
    localStorage.setItem('hermes_base_profile', text);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <UserCircle className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-slate-900">Base Profile (Master Resume)</h2>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Paste your full work history, skills, and education here. Hermes will use this to generate tailored resumes and cover letters for each job. It auto-saves to your browser!
      </p>
      <textarea
        className="w-full min-h-[600px] p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
        placeholder="Paste your extensive master resume here..."
        value={profileText}
        onChange={handleTextChange}
      />
    </div>
  );
}
