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
        const projectsText = profileData.projects && profileData.projects.length > 0 
            ? profileData.projects.map(p => `- ${p.title}: ${p.description}`).join('\n')
            : 'No specific projects provided.';
        const skillsText = profileData.skills && profileData.skills.length > 0
            ? profileData.skills.join(', ')
            : 'No specific skills provided.';

        const prompt = `You are an expert career coach and resume writer. I will provide you with a candidate's profile data and a job description. 
Your task is to generate a highly tailored Resume and a Cover Letter specifically for this job.

Candidate's Core Profile:
${profileData.coreDetails}

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
3. Generate a tailored Markdown Resume. You MUST use exactly these headings and no others: 
   - [Header: Name and Contact Info]
   - SKILLS
   - EDUCATION
   - PROFESSIONAL EXPERIENCE
   - TECHNICAL PROJECTS
   - CERTIFICATIONS
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

module.exports = { generateReachoutEmail, generateTailoredApplication };
