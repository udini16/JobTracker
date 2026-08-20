import React, { useEffect, useState } from 'react';
import { UserCircle, Code, Briefcase, Plus, Trash2, Wand2, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function ProfileManager({ onProfileUpdate, profileData }) {
  const [coreDetails, setCoreDetails] = useState('');
  const [masterSkills, setMasterSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({ title: '', description: '', techStack: '' });

  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [parseTimer, setParseTimer] = useState(15);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('hermes_base_profile_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        setCoreDetails(parsed.coreDetails || '');
        setMasterSkills(parsed.masterSkills || []);
        setProjects(parsed.projects || []);
        onProfileUpdate(parsed);
      } else {
        // Migration from old simple string
        const oldSaved = localStorage.getItem('hermes_base_profile');
        if (oldSaved) {
          setCoreDetails(oldSaved);
          onProfileUpdate({ coreDetails: oldSaved, projects: [], masterSkills: [] });
        }
      }
    } catch (e) {
      console.error('Failed to parse profile data', e);
    }
  }, []);

  const saveToLocal = (updatedData) => {
    localStorage.setItem('hermes_base_profile_data', JSON.stringify(updatedData));
    onProfileUpdate(updatedData);
  };

  const handleCoreChange = (e) => {
    const text = e.target.value;
    setCoreDetails(text);
    saveToLocal({ coreDetails: text, projects, masterSkills });
  };

  const addSkill = (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    const skillsArray = newSkill.split(',').map(s => s.trim()).filter(s => s);
    const updated = [...new Set([...masterSkills, ...skillsArray])];
    setMasterSkills(updated);
    setNewSkill('');
    saveToLocal({ coreDetails, projects, masterSkills: updated });
  };

  const removeSkill = (skillToRemove) => {
    const updated = masterSkills.filter(s => s !== skillToRemove);
    setMasterSkills(updated);
    saveToLocal({ coreDetails, projects, masterSkills: updated });
  };

  const addProject = (e) => {
    e.preventDefault();
    if (!newProject.title.trim() || !newProject.description.trim()) return;
    
    // Parse tech stack comma separated
    const techArray = newProject.techStack.split(',').map(s => s.trim()).filter(s => s);
    
    const proj = {
      id: Date.now().toString(),
      title: newProject.title,
      description: newProject.description,
      skills: techArray
    };
    
    const updated = [...projects, proj];
    setProjects(updated);
    setNewProject({ title: '', description: '', techStack: '' });
    saveToLocal({ coreDetails, projects: updated, masterSkills });
  };

  const removeProject = (id) => {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    saveToLocal({ coreDetails, projects: updated, masterSkills });
  };

  const handleAutoParse = async () => {
    if (!coreDetails.trim()) return;
    setIsParsing(true);
    setParseError('');
    setParseTimer(15);
    
    const timerInterval = setInterval(() => {
      setParseTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    try {
      const response = await axios.post('http://localhost:3000/api/parse-profile', { rawText: coreDetails });
      if (response.data.success) {
        const parsedData = response.data.parsedData;
        
        const updatedSkills = [...new Set([...masterSkills, ...(parsedData.masterSkills || [])])];
        
        const parsedProjects = (parsedData.projects || []).map((p, index) => ({
          id: Date.now().toString() + index.toString(),
          title: p.title || '',
          description: p.description || '',
          skills: p.skills || []
        }));
        const updatedProjects = [...projects, ...parsedProjects];
        
        const updatedCore = parsedData.coreDetails || coreDetails;
        
        setCoreDetails(updatedCore);
        setMasterSkills(updatedSkills);
        setProjects(updatedProjects);
        saveToLocal({ coreDetails: updatedCore, projects: updatedProjects, masterSkills: updatedSkills });
      } else {
        setParseError(response.data.error || 'Failed to parse profile.');
      }
    } catch (err) {
      setParseError(err.message);
    } finally {
      clearInterval(timerInterval);
      setIsParsing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <UserCircle className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-900">Core Profile (Summary, Experience, Education)</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Paste your full work history and education here. (Do not put specific projects or skills here, use the sections below!)
        </p>
        <textarea
          className="w-full h-64 p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
          placeholder="Paste your extensive master resume here..."
          value={coreDetails}
          onChange={handleCoreChange}
        />
        {parseError && <p className="text-sm text-red-500 mt-2">{parseError}</p>}
        <div className="mt-4 flex justify-end">
          <button 
            onClick={handleAutoParse} 
            disabled={isParsing || !coreDetails.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 min-w-[240px] justify-center"
          >
            {isParsing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {parseTimer > 0 ? `Parsing... (~${parseTimer}s left)` : 'Almost done...'}
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Auto-Parse Profile with AI
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Code className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Master Skills List</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Add your technical skills here. You can paste a comma-separated list.
        </p>
        
        <form onSubmit={addSkill} className="flex gap-2 mb-4">
          <input
            type="text"
            className="flex-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. React, Node.js, Python"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
          />
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>
        
        <div className="flex flex-wrap gap-2">
          {masterSkills.map(skill => (
            <span key={skill} className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-full text-sm flex items-center gap-2">
              {skill}
              <button onClick={() => removeSkill(skill)} className="text-slate-400 hover:text-red-500">
                <Trash2 className="w-3 h-3" />
              </button>
            </span>
          ))}
          {masterSkills.length === 0 && <span className="text-sm text-slate-400 italic">No skills added yet.</span>}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-900">Project Portfolio</h2>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Add your past projects here. You can dynamically select which ones to include when tailoring a resume!
        </p>

        <form onSubmit={addProject} className="space-y-4 mb-8 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h3 className="text-sm font-medium text-slate-700 mb-2">Add New Project</h3>
          <div>
            <input
              type="text"
              required
              className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Project Title (e.g. Hermes JobPortal)"
              value={newProject.title}
              onChange={(e) => setNewProject({...newProject, title: e.target.value})}
            />
          </div>
          <div>
            <textarea
              required
              className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 h-24 resize-y"
              placeholder="Detailed bullet points describing the project..."
              value={newProject.description}
              onChange={(e) => setNewProject({...newProject, description: e.target.value})}
            />
          </div>
          <div>
            <input
              type="text"
              className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Tech Stack (comma separated, e.g. React, Node.js, Tailwind CSS)"
              value={newProject.techStack}
              onChange={(e) => setNewProject({...newProject, techStack: e.target.value})}
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium flex items-center gap-1">
            <Plus className="w-4 h-4" /> Save Project
          </button>
        </form>

        <div className="space-y-4">
          {projects.map(proj => (
            <div key={proj.id} className="border border-slate-200 rounded-lg p-4 relative group bg-white">
              <button 
                onClick={() => removeProject(proj.id)}
                className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <h3 className="font-semibold text-slate-800">{proj.title}</h3>
              <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{proj.description}</p>
              {proj.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {proj.skills.map(skill => (
                    <span key={skill} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {projects.length === 0 && <p className="text-sm text-slate-400 italic text-center py-4">No projects added yet.</p>}
        </div>
      </div>
    </div>
  );
}
