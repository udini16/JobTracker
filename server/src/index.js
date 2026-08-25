require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { scrapeJobs } = require('./scraper');
const { generateReachoutEmail, generateTailoredApplication, parseRawProfile, parseCustomJobText } = require('./llm');
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
        
        // Filter out duplicate jobs
        const newJobs = jobs.map(j => ({ ...j, status: 'Scraped', generatedEmail: null }));
        const uniqueNewJobs = newJobs.filter(nj => !jobsStore.some(ej => ej.id === nj.id));
        
        jobsStore = [...uniqueNewJobs, ...jobsStore];
        
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

    let job = jobsStore.find(j => j.id === jobId);
    
    // Sync from client if server restarted and memory is lost
    if (!job && req.body.job) {
        job = req.body.job;
        jobsStore.push(job);
    }

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
    const { jobId, profileData } = req.body;
    if (!profileData || (!profileData.biodata && !profileData.experience)) {
        return res.status(400).json({ success: false, error: 'Base profile details are required' });
    }
    let job = jobsStore.find(j => j.id === jobId);
    if (!job && req.body.job) {
        job = req.body.job;
        jobsStore.push(job);
    }
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });

    try {
        const { resume, coverLetter } = await generateTailoredApplication(profileData, job.description, job.company);
        job.generatedResume = resume;
        job.generatedCoverLetter = coverLetter;
        res.json({ success: true, job });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
app.post('/api/parse-profile', async (req, res) => {
    const { rawText } = req.body;
    if (!rawText) {
        return res.status(400).json({ success: false, error: 'Raw text is required' });
    }

    try {
        const parsedData = await parseRawProfile(rawText);
        res.json({ success: true, parsedData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/parse-custom-job', async (req, res) => {
    const { input } = req.body;
    if (!input) return res.status(400).json({ success: false, error: 'Input is required (URL or raw text)' });

    try {
        let textContent = input;

        // Simple check if it's a URL
        if (input.trim().startsWith('http://') || input.trim().startsWith('https://')) {
            const puppeteer = require('puppeteer');
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            await page.goto(input.trim(), { waitUntil: 'domcontentloaded', timeout: 15000 });
            textContent = await page.evaluate(() => document.body.innerText);
            await browser.close();
        }

        // Parse with LLM
        const jobDetails = await parseCustomJobText(textContent);

        // Format as Job Object
        const newJob = {
            id: `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            title: jobDetails.title,
            company: jobDetails.company,
            location: jobDetails.location,
            description: jobDetails.description,
            url: input.trim().startsWith('http') ? input.trim() : '',
            source: 'Custom Link/Text',
            status: 'Scraped',
            generatedEmail: null,
            generatedResume: null,
            generatedCoverLetter: null
        };

        // Add to store
        jobsStore = [newJob, ...jobsStore];

        res.json({ success: true, job: newJob, jobs: jobsStore });
    } catch (error) {
        console.error('Custom Job Parse Error:', error);
        res.status(500).json({ success: false, error: 'Failed to parse custom job.' });
    }
});


async function generatePdfBuffer(html) {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' } });
    await browser.close();
    return pdfBuffer;
}

app.post('/api/send', upload.single('customFile'), async (req, res) => {
    let jobId, clientJob, cvHtml, clHtml;
    try {
        jobId = req.body.jobId;
        clientJob = req.body.job ? JSON.parse(req.body.job) : null;
        cvHtml = req.body.cvHtml;
        clHtml = req.body.clHtml;
    } catch (e) {
        return res.status(400).json({ success: false, error: 'Invalid JSON payload' });
    }

    let job = jobsStore.find(j => j.id === jobId);
    if (!job && clientJob) {
        job = clientJob;
        jobsStore.push(job);
    }
    // Update the job with the latest edited email from client
    if (job && clientJob && clientJob.generatedEmail) {
        job.generatedEmail = clientJob.generatedEmail;
    }
    if (!job || !job.generatedEmail) return res.status(400).json({ success: false, error: 'Job or email not found' });

    try {
        const attachments = [];
        
        if (cvHtml) {
            const cvBuffer = await generatePdfBuffer(cvHtml);
            attachments.push({ filename: `${job.company.replace(/\s+/g, '_')}_CV.pdf`, content: cvBuffer });
        }
        if (clHtml) {
            const clBuffer = await generatePdfBuffer(clHtml);
            attachments.push({ filename: `${job.company.replace(/\s+/g, '_')}_CoverLetter.pdf`, content: clBuffer });
        }
        if (req.file) {
            attachments.push({ filename: req.file.originalname, content: req.file.buffer });
        }

        await sendReachoutEmail(job.hrEmail, job.generatedEmail.subject, job.generatedEmail.body, job.id, attachments);
        job.status = 'Sent';
        await sendNotification(`🚀 Email sent to ${job.company} for the ${job.title} role!`);
        res.json({ success: true, job });
    } catch (error) {
        console.error('Send error:', error);
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

app.post('/api/generate-pdf', async (req, res) => {
    const { html } = req.body;
    if (!html) return res.status(400).json({ error: 'HTML content required' });

    try {
        const pdfBuffer = await generatePdfBuffer(html);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=document.pdf');
        res.send(pdfBuffer);
    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

app.get('/api/jobs', (req, res) => {
    res.json({ success: true, jobs: jobsStore });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
