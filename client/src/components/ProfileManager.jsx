import React, { useEffect, useState } from 'react';
import { UserCircle, Code, Briefcase, Plus, Trash2, Wand2, Loader2, GraduationCap, FileText, Award, X, Pencil } from 'lucide-react';
import axios from 'axios';

export default function ProfileManager({ onProfileUpdate, profileData }) {
  // 6 Main Data States
  const [biodata, setBiodata] = useState({ name: '', email: '', phone: '', github: '', portfolio: '' });
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [projects, setProjects] = useState([]);
  const [masterSkills, setMasterSkills] = useState([]);
  const [certifications, setCertifications] = useState('');

  // Form Inputs
  const [newSkill, setNewSkill] = useState('');
  const [newProject, setNewProject] = useState({ title: '', description: '', techStack: '' });
  const [newEdu, setNewEdu] = useState({ university: '', degree: '', cgpa: '', courses: '' });
  const [newExp, setNewExp] = useState({ company: '', location: '', role: '', startDate: '', endDate: '', description: '' });

  // Editing States
  const [editingEduId, setEditingEduId] = useState(null);
  const [editingExpId, setEditingExpId] = useState(null);
  const [editingProjId, setEditingProjId] = useState(null);

  // Parsing Modal State
  const [showParseModal, setShowParseModal] = useState(false);
  const [rawResumeText, setRawResumeText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [parseTimer, setParseTimer] = useState(15);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('hermes_base_profile_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        setBiodata(parsed.biodata || { name: '', email: '', phone: '', github: '', portfolio: '' });
        setEducation(parsed.education || []);
        setExperience(parsed.experience || []);
        setProjects(parsed.projects || []);
        setMasterSkills(parsed.masterSkills || []);
        setCertifications(parsed.certifications || '');
        
        onProfileUpdate(parsed);
      } else {
        // Migration from old coreDetails to new structured layout
        const oldSaved = localStorage.getItem('hermes_base_profile');
        if (oldSaved) {
          onProfileUpdate({ experience: [], education: [], projects: [], masterSkills: [], certifications: '', biodata: {} });
        }
      }
    } catch (e) {
      console.error('Failed to parse profile data', e);
    }
  }, []);

  const saveToLocal = (updatedFields) => {
    const currentData = {
      biodata,
      education,
      experience,
      projects,
      masterSkills,
      certifications,
      ...updatedFields
    };
    localStorage.setItem('hermes_base_profile_data', JSON.stringify(currentData));
    onProfileUpdate(currentData);
  };

  // BIODATA Handlers
  const handleBiodataChange = (field, value) => {
    const updated = { ...biodata, [field]: value };
    setBiodata(updated);
    saveToLocal({ biodata: updated });
  };

  // CERTIFICATIONS Handler
  const handleCertificationsChange = (e) => {
    const text = e.target.value;
    setCertifications(text);
    saveToLocal({ certifications: text });
  };

  // EDUCATION Handlers
  const addEducation = (e) => {
    e.preventDefault();
    if (!newEdu.university.trim() || !newEdu.degree.trim()) return;
    
    const coursesArray = typeof newEdu.courses === 'string' ? newEdu.courses.split(',').map(s => s.trim()).filter(s => s) : newEdu.courses;
    
    let updated;
    if (editingEduId) {
      updated = education.map(edu => edu.id === editingEduId ? { ...newEdu, id: editingEduId, courses: coursesArray } : edu);
      setEditingEduId(null);
    } else {
      const edu = { id: Date.now().toString(), ...newEdu, courses: coursesArray };
      updated = [...education, edu];
    }
    
    setEducation(updated);
    setNewEdu({ university: '', degree: '', cgpa: '', courses: '' });
    saveToLocal({ education: updated });
  };
  const removeEducation = (id) => {
    const updated = education.filter(e => e.id !== id);
    setEducation(updated);
    saveToLocal({ education: updated });
    if (editingEduId === id) cancelEditEducation();
  };
  const startEditEducation = (edu) => {
    setNewEdu({ ...edu, courses: (edu.courses || []).join(', ') });
    setEditingEduId(edu.id);
  };
  const cancelEditEducation = () => {
    setEditingEduId(null);
    setNewEdu({ university: '', degree: '', cgpa: '', courses: '' });
  };

  // EXPERIENCE Handlers
  const addExperience = (e) => {
    e.preventDefault();
    if (!newExp.company.trim() || !newExp.role.trim()) return;
    
    let updated;
    if (editingExpId) {
      updated = experience.map(exp => exp.id === editingExpId ? { ...newExp, id: editingExpId } : exp);
      setEditingExpId(null);
    } else {
      const exp = { id: Date.now().toString(), ...newExp };
      updated = [...experience, exp];
    }
    
    setExperience(updated);
    setNewExp({ company: '', location: '', role: '', startDate: '', endDate: '', description: '' });
    saveToLocal({ experience: updated });
  };
  const removeExperience = (id) => {
    const updated = experience.filter(e => e.id !== id);
    setExperience(updated);
    saveToLocal({ experience: updated });
    if (editingExpId === id) cancelEditExperience();
  };
  const startEditExperience = (exp) => {
    setNewExp({ ...exp });
    setEditingExpId(exp.id);
  };
  const cancelEditExperience = () => {
    setEditingExpId(null);
    setNewExp({ company: '', location: '', role: '', startDate: '', endDate: '', description: '' });
  };

  // SKILLS Handlers
  const addSkill = (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    const skillsArray = newSkill.split(',').map(s => s.trim()).filter(s => s);
    const updated = [...new Set([...masterSkills, ...skillsArray])];
    setMasterSkills(updated);
    setNewSkill('');
    saveToLocal({ masterSkills: updated });
  };
  const removeSkill = (skillToRemove) => {
    const updated = masterSkills.filter(s => s !== skillToRemove);
    setMasterSkills(updated);
    saveToLocal({ masterSkills: updated });
  };

  // PROJECTS Handlers
  const addProject = (e) => {
    e.preventDefault();
    if (!newProject.title.trim() || !newProject.description.trim()) return;
    const techArray = typeof newProject.techStack === 'string' ? newProject.techStack.split(',').map(s => s.trim()).filter(s => s) : newProject.techStack;
    
    let updated;
    if (editingProjId) {
      updated = projects.map(proj => proj.id === editingProjId ? { ...newProject, id: editingProjId, skills: techArray } : proj);
      setEditingProjId(null);
    } else {
      const proj = { id: Date.now().toString(), title: newProject.title, description: newProject.description, skills: techArray };
      updated = [...projects, proj];
    }

    setProjects(updated);
    setNewProject({ title: '', description: '', techStack: '' });
    saveToLocal({ projects: updated });
  };
  const removeProject = (id) => {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    saveToLocal({ projects: updated });
    if (editingProjId === id) cancelEditProject();
  };
  const startEditProject = (proj) => {
    setNewProject({ ...proj, techStack: (proj.skills || []).join(', ') });
    setEditingProjId(proj.id);
  };
  const cancelEditProject = () => {
    setEditingProjId(null);
    setNewProject({ title: '', description: '', techStack: '' });
  };

  // AUTO-PARSE Logic
  const handleAutoParse = async () => {
    if (!rawResumeText.trim()) return;
    setIsParsing(true);
    setParseError('');
    setParseTimer(15);
    
    const timerInterval = setInterval(() => {
      setParseTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    try {
      const response = await axios.post('http://localhost:3000/api/parse-profile', { rawText: rawResumeText });
      if (response.data.success) {
        const parsedData = response.data.parsedData;
        
        // Merge Biodata
        const updatedBiodata = { ...biodata, ...(parsedData.biodata || {}) };
        
        // Merge Certifications
        const updatedCertifications = parsedData.certifications || certifications;

        // Ensure IDs for arrays
        const generateId = (index) => Date.now().toString() + index.toString();

        const parsedEducation = (parsedData.education || []).map((e, index) => ({ id: generateId(index), ...e, courses: e.courses || [] }));
        const updatedEducation = [...education, ...parsedEducation];

        const parsedExperience = (parsedData.experience || []).map((e, index) => ({ id: generateId(index), ...e }));
        const updatedExperience = [...experience, ...parsedExperience];

        const updatedSkills = [...new Set([...masterSkills, ...(parsedData.masterSkills || [])])];
        
        const parsedProjects = (parsedData.projects || []).map((p, index) => ({
          id: generateId(index), title: p.title || '', description: p.description || '', skills: p.skills || []
        }));
        const updatedProjects = [...projects, ...parsedProjects];
        
        // Set all states
        setBiodata(updatedBiodata);
        setCertifications(updatedCertifications);
        setEducation(updatedEducation);
        setExperience(updatedExperience);
        setMasterSkills(updatedSkills);
        setProjects(updatedProjects);

        saveToLocal({
          biodata: updatedBiodata,
          certifications: updatedCertifications,
          education: updatedEducation,
          experience: updatedExperience,
          masterSkills: updatedSkills,
          projects: updatedProjects
        });

        setShowParseModal(false);
        setRawResumeText('');
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
      {/* Top Banner & Parse Button */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-md flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Master Profile Pipeline</h2>
          <p className="text-blue-100 text-sm mt-1">Manage your structured profile data for AI tailoring.</p>
        </div>
        <button 
          onClick={() => setShowParseModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-bold transition-colors shadow-sm"
        >
          <Wand2 className="w-5 h-5" />
          ✨ Auto-Parse Resume
        </button>
      </div>

      {/* Parse Modal */}
      {showParseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-blue-600" /> Auto-Parse Profile with AI
              </h2>
              <button onClick={() => setShowParseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <p className="text-sm text-slate-600 mb-4">
                Paste your full, unstructured resume below. The AI will extract and organize your biodata, education, experience, projects, skills, and certifications into the grid automatically.
              </p>
              <textarea
                className="w-full h-96 p-4 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                placeholder="Paste your raw resume text here..."
                value={rawResumeText}
                onChange={(e) => setRawResumeText(e.target.value)}
              />
              {parseError && <p className="text-sm text-red-500 mt-2">{parseError}</p>}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setShowParseModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleAutoParse} 
                disabled={isParsing || !rawResumeText.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 min-w-[200px] justify-center"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {parseTimer > 0 ? `Parsing... (~${parseTimer}s left)` : 'Almost done...'}
                  </>
                ) : (
                  <>Auto-Parse Now</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3x2 Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* ROW 1: Biodata | Education */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <UserCircle className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">Biodata</h2>
          </div>
          <div className="space-y-4 flex-1">
            <input className="w-full p-2 text-sm border border-slate-300 rounded-lg" placeholder="Full Name" value={biodata.name || ''} onChange={(e) => handleBiodataChange('name', e.target.value)} />
            <input className="w-full p-2 text-sm border border-slate-300 rounded-lg" placeholder="Email" value={biodata.email || ''} onChange={(e) => handleBiodataChange('email', e.target.value)} />
            <input className="w-full p-2 text-sm border border-slate-300 rounded-lg" placeholder="Phone Number" value={biodata.phone || ''} onChange={(e) => handleBiodataChange('phone', e.target.value)} />
            <input className="w-full p-2 text-sm border border-slate-300 rounded-lg" placeholder="GitHub Link" value={biodata.github || ''} onChange={(e) => handleBiodataChange('github', e.target.value)} />
            <input className="w-full p-2 text-sm border border-slate-300 rounded-lg" placeholder="Portfolio Link" value={biodata.portfolio || ''} onChange={(e) => handleBiodataChange('portfolio', e.target.value)} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-900">Education</h2>
          </div>
          <form onSubmit={addEducation} className="space-y-3 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <input required type="text" className="w-full p-2 text-sm border border-slate-300 rounded-lg" placeholder="University (e.g. Stanford University)" value={newEdu.university} onChange={(e) => setNewEdu({...newEdu, university: e.target.value})} />
            <div className="grid grid-cols-2 gap-3">
              <input required type="text" className="w-full p-2 text-sm border border-slate-300 rounded-lg" placeholder="Degree (e.g. B.S. Computer Science)" value={newEdu.degree} onChange={(e) => setNewEdu({...newEdu, degree: e.target.value})} />
              <input type="text" className="w-full p-2 text-sm border border-slate-300 rounded-lg" placeholder="CGPA (e.g. 3.8/4.0)" value={newEdu.cgpa} onChange={(e) => setNewEdu({...newEdu, cgpa: e.target.value})} />
            </div>
            <input type="text" className="w-full p-2 text-sm border border-slate-300 rounded-lg" placeholder="Relevant Coursework (comma separated)" value={newEdu.courses} onChange={(e) => setNewEdu({...newEdu, courses: e.target.value})} />
            <div className="flex gap-2">
              <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center gap-1">
                {editingEduId ? 'Save Changes' : <><Plus className="w-4 h-4" /> Add Education</>}
              </button>
              {editingEduId && (
                <button type="button" onClick={cancelEditEducation} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 text-sm font-medium">
                  Cancel
                </button>
              )}
            </div>
          </form>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px]">
            {education.map(edu => (
              <div key={edu.id} className={`border ${editingEduId === edu.id ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'} rounded-lg p-3 relative group text-sm transition-colors`}>
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEditEducation(edu)} className="text-slate-400 hover:text-indigo-600">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => removeEducation(edu.id)} className="text-slate-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="font-semibold text-slate-800">{edu.university}</div>
                <div className="text-slate-600">{edu.degree} {edu.cgpa ? ` • CGPA: ${edu.cgpa}` : ''}</div>
                {edu.courses && edu.courses.length > 0 && (
                  <div className="text-slate-500 text-xs mt-1">Courses: {edu.courses.join(', ')}</div>
                )}
              </div>
            ))}
            {education.length === 0 && <p className="text-sm text-slate-400 italic">No education added.</p>}
          </div>
        </div>

        {/* ROW 2: Experience | Projects */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">Professional Experience</h2>
          </div>
          <form onSubmit={addExperience} className="space-y-3 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="grid grid-cols-2 gap-3">
              <input required type="text" className="w-full p-2 text-sm border border-slate-300 rounded-lg" placeholder="Role (e.g. Software Engineer)" value={newExp.role} onChange={(e) => setNewExp({...newExp, role: e.target.value})} />
              <input required type="text" className="w-full p-2 text-sm border border-slate-300 rounded-lg" placeholder="Company" value={newExp.company} onChange={(e) => setNewExp({...newExp, company: e.target.value})} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input type="text" className="w-full p-2 text-sm border border-slate-300 rounded-lg" placeholder="Location" value={newExp.location} onChange={(e) => setNewExp({...newExp, location: e.target.value})} />
              <input type="text" className="w-full p-2 text-sm border border-slate-300 rounded-lg" placeholder="Start Date" value={newExp.startDate} onChange={(e) => setNewExp({...newExp, startDate: e.target.value})} />
              <input type="text" className="w-full p-2 text-sm border border-slate-300 rounded-lg" placeholder="End Date" value={newExp.endDate} onChange={(e) => setNewExp({...newExp, endDate: e.target.value})} />
            </div>
            <textarea required className="w-full p-2 text-sm border border-slate-300 rounded-lg h-20 resize-y" placeholder="Describe what you have done there (bullet points recommended)" value={newExp.description} onChange={(e) => setNewExp({...newExp, description: e.target.value})} />
            <div className="flex gap-2">
              <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium flex items-center gap-1">
                {editingExpId ? 'Save Changes' : <><Plus className="w-4 h-4" /> Add Experience</>}
              </button>
              {editingExpId && (
                <button type="button" onClick={cancelEditExperience} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 text-sm font-medium">
                  Cancel
                </button>
              )}
            </div>
          </form>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px]">
            {experience.map(exp => (
              <div key={exp.id} className={`border ${editingExpId === exp.id ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200'} rounded-lg p-3 relative group text-sm transition-colors`}>
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEditExperience(exp)} className="text-slate-400 hover:text-emerald-600">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => removeExperience(exp.id)} className="text-slate-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="font-semibold text-slate-800">{exp.role} @ {exp.company}</div>
                <div className="text-slate-500 text-xs mb-2">{exp.location ? `${exp.location} | ` : ''}{exp.startDate} - {exp.endDate}</div>
                <div className="text-slate-600 whitespace-pre-wrap">{exp.description}</div>
              </div>
            ))}
            {experience.length === 0 && <p className="text-sm text-slate-400 italic">No experience added.</p>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-900">Project Portfolio</h2>
          </div>
          <form onSubmit={addProject} className="space-y-3 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <input required type="text" className="w-full p-2 text-sm border border-slate-300 rounded-lg" placeholder="Project Title" value={newProject.title} onChange={(e) => setNewProject({...newProject, title: e.target.value})} />
            <textarea required className="w-full p-2 text-sm border border-slate-300 rounded-lg h-20 resize-y" placeholder="Detailed bullet points describing the project..." value={newProject.description} onChange={(e) => setNewProject({...newProject, description: e.target.value})} />
            <input type="text" className="w-full p-2 text-sm border border-slate-300 rounded-lg" placeholder="Tech Stack (comma separated)" value={newProject.techStack} onChange={(e) => setNewProject({...newProject, techStack: e.target.value})} />
            <div className="flex gap-2">
              <button type="submit" className="px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium flex items-center gap-1">
                {editingProjId ? 'Save Changes' : <><Plus className="w-4 h-4" /> Add Project</>}
              </button>
              {editingProjId && (
                <button type="button" onClick={cancelEditProject} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 text-sm font-medium">
                  Cancel
                </button>
              )}
            </div>
          </form>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px]">
            {projects.map(proj => (
              <div key={proj.id} className={`border ${editingProjId === proj.id ? 'border-amber-400 bg-amber-50' : 'border-slate-200'} rounded-lg p-3 relative group text-sm transition-colors`}>
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEditProject(proj)} className="text-slate-400 hover:text-amber-600">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => removeProject(proj.id)} className="text-slate-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="font-semibold text-slate-800">{proj.title}</div>
                <div className="text-slate-600 mt-1 whitespace-pre-wrap">{proj.description}</div>
                {proj.skills && proj.skills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {proj.skills.map(skill => (
                      <span key={skill} className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs">{skill}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {projects.length === 0 && <p className="text-sm text-slate-400 italic">No projects added.</p>}
          </div>
        </div>

        {/* ROW 3: Master Skills | Certifications */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Code className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-slate-900">Master Skills List</h2>
          </div>
          <form onSubmit={addSkill} className="flex gap-2 mb-6">
            <input type="text" className="flex-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="e.g. React, Node.js, Python" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} />
            <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add
            </button>
          </form>
          <div className="flex flex-wrap gap-2 flex-1 items-start content-start">
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

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-pink-600" />
            <h2 className="text-lg font-semibold text-slate-900">Certifications</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">List your certifications, licenses, and achievements.</p>
          <textarea
            className="w-full flex-1 p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none resize-none min-h-[200px]"
            placeholder="e.g. AWS Certified Solutions Architect&#10;Google Professional Cloud Developer"
            value={certifications}
            onChange={handleCertificationsChange}
          />
        </div>

      </div>
    </div>
  );
}
