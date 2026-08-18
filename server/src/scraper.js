const { scrapeJobSpy } = require('./scrapers/jobspy');
const { scrapeCustom } = require('./scrapers/custom');

async function scrapeJobs(keyword, location, platforms = ['linkedin']) {
    const jobspyPlatforms = [];
    const customPlatforms = [];

    const jobSpySupported = ['linkedin', 'indeed', 'glassdoor', 'ziprecruiter'];

    platforms.forEach(p => {
        const lowerP = p.toLowerCase();
        if (jobSpySupported.includes(lowerP)) {
            jobspyPlatforms.push(lowerP);
        } else {
            customPlatforms.push(lowerP);
        }
    });

    let allJobs = [];

    // Run jobspy for supported platforms
    if (jobspyPlatforms.length > 0) {
        const jobs = await scrapeJobSpy(keyword, location, jobspyPlatforms);
        allJobs = allJobs.concat(jobs);
    }

    // Run custom scrapers concurrently
    if (customPlatforms.length > 0) {
        const customPromises = customPlatforms.map(p => scrapeCustom(keyword, location, p));
        const results = await Promise.all(customPromises);
        results.forEach(res => {
            allJobs = allJobs.concat(res);
        });
    }

    // Shuffle the array to mix results from different platforms
    allJobs = allJobs.sort(() => Math.random() - 0.5);

    return allJobs;
}

module.exports = { scrapeJobs };
