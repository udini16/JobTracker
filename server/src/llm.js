const { OpenAI } = require('openai');

const openai = new OpenAI({
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY
});

async function generateReachoutEmail(resumeText, jobDescription, companyName) {
    try {
        const prompt = `You are a professional outreach assistant. Write a customized reach-out email for a job application.
Resume:
${resumeText}

Job Description:
${jobDescription}

Company:
${companyName}

Write a professional, engaging, and concise email to the hiring manager. Highlight the relevant skills from the resume that match the job description. Do not include placeholders like [Your Name] if they can be extracted from the resume, otherwise use generic terms. Ensure the email sounds natural, not robotic.
Start directly with the subject line as "Subject: ...", followed by a blank line, and then the email body.
`;
        const response = await openai.chat.completions.create({
            model: process.env.LLM_MODEL || 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
        });

        const fullResponse = response.choices[0].message.content.trim();
        // Extract Subject and Body
        const match = fullResponse.match(/^Subject:\s*(.*?)\n\n([\s\S]*)$/i);
        if (match) {
            return {
                subject: match[1].trim(),
                body: match[2].trim()
            };
        } else {
            return {
                subject: `Application for role at ${companyName}`,
                body: fullResponse
            };
        }
    } catch (error) {
        console.error('LLM Generation error:', error);
        throw error;
    }
}

async function generateTailoredApplication(profileData, jobDescription, companyName) {
    try {
        const biodataText = `Name: ${profileData.biodata?.name || ''}
Email: ${profileData.biodata?.email || ''}
Phone: ${profileData.biodata?.phone || ''}
GitHub: ${profileData.biodata?.github || ''}
Portfolio: ${profileData.biodata?.portfolio || ''}`;

        const educationText = profileData.education && profileData.education.length > 0
            ? profileData.education.map(e => `- ${e.degree} at ${e.university} (CGPA: ${e.cgpa || 'N/A'})\n  Courses: ${(e.courses || []).join(', ')}`).join('\n')
            : 'No education provided.';

        const experienceText = profileData.experience && profileData.experience.length > 0
            ? profileData.experience.map(e => `- ${e.role} at ${e.company} (${e.location}) | ${e.startDate} - ${e.endDate}\n  ${e.description}`).join('\n\n')
            : 'No experience provided.';

        const certificationsText = profileData.certifications || 'No certifications provided.';

        const projectsText = profileData.projects && profileData.projects.length > 0 
            ? profileData.projects.map(p => `- ${p.title}: ${p.description}`).join('\n')
            : 'No specific projects provided.';
        const skillsText = profileData.skills && profileData.skills.length > 0
            ? profileData.skills.join(', ')
            : 'No specific skills provided.';

        const prompt = `You are an expert career coach and resume writer. I will provide you with a candidate's profile data and a job description. 
Your task is to generate a highly tailored Resume and a Cover Letter specifically for this job.

Candidate's Biodata:
${biodataText}

Candidate's Education:
${educationText}

Candidate's Professional Experience:
${experienceText}

Candidate's Certifications:
${certificationsText}

Candidate's Selected Projects for this role:
${projectsText}

Candidate's Selected Skills for this role:
${skillsText}

Job Description:
${jobDescription}

Company:
${companyName}

CRITICAL INSTRUCTIONS:
1. DO NOT USE ANY EMOJIS in the Resume or the Cover Letter. None. Zero emojis.
2. The tone must be highly professional, corporate, and traditional.
3. Generate a tailored Markdown CV following this exact template structure (skip sections where candidate data is not provided, e.g., if no Awards are present, skip the Awards section). Ensure the Markdown looks visually clean:

[Name]
[City and State] | [Phone number] | [Email address] | [GitHub/Portfolio]

# Education
[Type of degree], [Major and minor]
[Name of school] | [Dates of attendance]
[Thesis, dissertation or relevant coursework, if applicable]

# Certifications
[Certification name], [Issuing organization] | [Date of completion]

# Professional Experience
[Job title], [Name of organization or employer] | [Start date – end date]
[Brief description of impactful achievement. Use short phrases or bullet points to remain as concise and readable as possible.]

# Technical Projects
[Project Title]
[Brief description of the project and skills used]

# Skills
[List skills using bullet points]

# Awards and honors
[Name of award], [Issuing organization], [Year received]

# Professional memberships or affiliations
[Your role], [Full name of organization] [Year joined – Current, if applicable]

# Publications
[Authors list (bold your name), (Year). "Title," Publication name, volume/page numbers.]

# Conference presentations
["Presentation title," Conference name, Month, Year]

4. Highlight the skills and experiences from the master profile that best match the job description. Do not invent new experiences.
5. Generate a professional Cover Letter connecting the candidate's tailored resume to the specific requirements of the job. No emojis.
6. Output the tailored resume inside <RESUME> tags and the cover letter inside <COVER_LETTER> tags.

Format:
<RESUME>
# Resume Content
</RESUME>
<COVER_LETTER>
Cover Letter Content
</COVER_LETTER>
`;
        const response = await openai.chat.completions.create({
            model: process.env.LLM_MODEL || 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
        });

        const fullResponse = response.choices[0].message.content.trim();
        
        const resumeMatch = fullResponse.match(/<RESUME>\s*([\s\S]*?)\s*<\/RESUME>/i);
        const clMatch = fullResponse.match(/<COVER_LETTER>\s*([\s\S]*?)\s*<\/COVER_LETTER>/i);
        
        return {
            resume: resumeMatch ? resumeMatch[1].trim() : 'Failed to parse resume tags from LLM response.\n\n' + fullResponse,
            coverLetter: clMatch ? clMatch[1].trim() : 'Failed to parse cover letter tags from LLM response.'
        };
    } catch (error) {
        console.error('LLM Application Generation error:', error);
        throw error;
    }
}

async function parseRawProfile(rawText) {
    try {
        const prompt = `You are an expert resume parser. You will be provided with a raw resume text.
Your task is to parse this resume and extract specific information into a strict JSON object.

Extract the following:
1. "biodata": Object with name, email, phone, github, and portfolio strings.
2. "education": An array of objects. Each object must have: university, degree, cgpa, and an array of courses.
3. "experience": An array of objects. Each object must have: company, location, role, startDate, endDate, and description.
4. "projects": An array of project objects. Each object must have: title, description, and an array of skills.
5. "masterSkills": A flat array of all technical skills, programming languages, and tools.
6. "certifications": A string summarizing all certifications (if any).

Respond ONLY with a valid JSON object in the following format:
{
  "biodata": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "github": "string",
    "portfolio": "string"
  },
  "education": [
    {
      "university": "string",
      "degree": "string",
      "cgpa": "string",
      "courses": ["string"]
    }
  ],
  "experience": [
    {
      "company": "string",
      "location": "string",
      "role": "string",
      "startDate": "string",
      "endDate": "string",
      "description": "string"
    }
  ],
  "projects": [
    {
      "title": "string",
      "description": "string",
      "skills": ["string"]
    }
  ],
  "masterSkills": ["string"],
  "certifications": "string"
}

Raw Resume:
${rawText}
`;
        const response = await openai.chat.completions.create({
            model: process.env.LLM_MODEL || 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content.trim();
        return JSON.parse(content);
    } catch (error) {
        console.error('LLM Parsing error:', error);
        throw error;
    }
}

async function parseCustomJobText(rawText) {
    try {
        const prompt = `You are an expert job parser. You will be provided with raw text or HTML content from a custom job link (like a Threads post, a company career page, or manual text).
Your task is to parse this content and extract the job details into a strict JSON object.

Extract the following:
1. "title": The job title (string). If not found, output "Unknown Title".
2. "company": The company name (string). If not found, output "Unknown Company".
3. "location": The job location (string). If not found, output "Remote" or "Unknown".
4. "description": A concise but comprehensive job description (string). Summarize the key responsibilities and requirements.

Respond ONLY with a valid JSON object in the following format:
{
  "title": "string",
  "company": "string",
  "location": "string",
  "description": "string"
}

Raw Content:
${rawText}
`;
        const response = await openai.chat.completions.create({
            model: process.env.LLM_MODEL || 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content.trim();
        return JSON.parse(content);
    } catch (error) {
        console.error('LLM Custom Job Parsing error:', error);
        throw error;
    }
}

module.exports = { generateReachoutEmail, generateTailoredApplication, parseRawProfile, parseCustomJobText };
