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

module.exports = { generateReachoutEmail };
