import React from 'react';
import { FileText } from 'lucide-react';

export default function ResumeUpload({ onResumeUploaded, resumeText }) {
  const handleTextChange = (e) => {
    onResumeUploaded(e.target.value);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-slate-900">Your Resume</h2>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Paste your resume text here. The AI will use this to generate customized reach-out emails.
      </p>
      <textarea
        className="w-full h-48 p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
        placeholder="Paste your resume content here..."
        value={resumeText}
        onChange={handleTextChange}
      />
    </div>
  );
}
