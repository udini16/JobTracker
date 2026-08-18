require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { scrapeJobs } = require('./scraper');
const { generateReachoutEmail, generateTailoredApplication } = require('./llm');
const { sendReachoutEmail } = require('./email');
const { sendNotification } = require('./telegram');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// In-memory store for jobs
let jobsStore = [];

app.post('/api/scrape', async (req, res) => {
    const { keyword, location, platforms } = req.body;
    try {
        const selectedPlatforms = (platforms && platforms.length > 0) ? platforms : ['linkedin'];
        const jobs = await scrapeJobs(keyword || 'React', location || 'Remote', selectedPlatforms);
        
        // Merge with existing or clear depending on preference. Let's prepend.
        const newJobs = jobs.map(j => ({ ...j, status: 'Scraped', generatedEmail: null }));
        jobsStore = [...newJobs, ...jobsStore];
        
        res.json({ success: true, jobs: jobsStore });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/generate', upload.single('resume'), async (req, res) => {
    const { jobId } = req.body;
    const resumeBuffer = req.file?.buffer;
    const resumeText = resumeBuffer ? resumeBuffer.toString('utf-8') : req.body.resumeText;

    if (!resumeText) {
        return res.status(400).json({ success: false, error: 'Resume text is required' });
    }

    const job = jobsStore.find(j => j.id === jobId);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });

    try {
        const { subject, body } = await generateReachoutEmail(resumeText, job.description, job.company);
        job.generatedEmail = { subject, body };
        job.status = 'Email Generated';
        res.json({ success: true, job });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/generate-application', async (req, res) => {
    const { jobId, profileText } = req.body;
    if (!profileText) {
        return res.status(400).json({ success: false, error: 'Base profile is required' });
    }
    const job = jobsStore.find(j => j.id === jobId);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });

    try {
        const { resume, coverLetter } = await generateTailoredApplication(profileText, job.description, job.company);
        job.generatedResume = resume;
        job.generatedCoverLetter = coverLetter;
        res.json({ success: true, job });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/send', async (req, res) => {
    const { jobId } = req.body;
    const job = jobsStore.find(j => j.id === jobId);
    if (!job || !job.generatedEmail) return res.status(400).json({ success: false, error: 'Job or email not found' });

    try {
        await sendReachoutEmail(job.hrEmail, job.generatedEmail.subject, job.generatedEmail.body, job.id);
        job.status = 'Sent';
        await sendNotification(`🚀 Email sent to ${job.company} for the ${job.title} role!`);
        res.json({ success: true, job });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/track/:jobId', async (req, res) => {
    const { jobId } = req.params;
    const job = jobsStore.find(j => j.id === jobId);
    if (job && job.status !== 'Opened') {
        job.status = 'Opened';
        console.log(`Email opened for job ${jobId}`);
        await sendNotification(`👀 UPDATE: Your email to ${job.company} for the ${job.title} role was just OPENED!`);
    }
    // Return a 1x1 transparent pixel
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, {
        'Content-Type': 'image/gif',
        'Content-Length': pixel.length
    });
    res.end(pixel);
});

app.get('/api/jobs', (req, res) => {
    res.json({ success: true, jobs: jobsStore });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
