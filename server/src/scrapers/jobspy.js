let jobspy = null;
try {
  jobspy = require('ts-jobspy'); 
} catch (e) {
  console.log("ts-jobspy not found or failed to load. Will use fallback.");
}

async function scrapeJobSpy(keyword, location, platforms) {
    if (!jobspy || !jobspy.scrapeJobs) {
        console.log("JobSpy is not available. Returning mock data for", platforms.join(', '));
        return generateMocks(keyword, location, platforms);
    }

    try {
        console.log("Running JobSpy for platforms:", platforms);
        const jobs = await jobspy.scrapeJobs({
            searchTerm: keyword,
            location: location,
            siteName: platforms,
            resultsWanted: 5,
            countryId: "usa", // Default broad search
            isRemote: location.toLowerCase().includes('remote')
        });

        return jobs.map(j => ({
            id: j.id || `jobspy-${Date.now()}-${Math.random()}`,
            title: `${j.title || j.jobTitle || 'Unknown Title'} (via ${j.siteName || 'JobSpy'})`,
            company: j.company || j.companyName || 'Unknown Company',
            url: j.jobUrl || j.url || '',
            description: j.description || j.jobDescription || `Role at ${j.company}. Please visit link to see details.`,
            hrEmail: 'hr@example.com',
            platform: j.siteName || 'JobSpy'
        }));
    } catch (error) {
        console.error("JobSpy scraping failed (likely proxy blocked):", error.message);
        return generateMocks(keyword, location, platforms);
    }
}

function generateMocks(keyword, location, platforms) {
    const results = [];
    platforms.forEach(platform => {
        results.push({
            id: `mock-${platform}-${Date.now()}-${Math.random()}`,
            title: `${keyword} Professional`,
            company: `Mock ${platform.charAt(0).toUpperCase() + platform.slice(1)} Corp`,
            description: `We are looking for a ${keyword} based in ${location}. Apply via ${platform}.`,
            url: `https://${platform}.com/jobs/mock`,
            hrEmail: `mock.hr@${platform}.com`,
            platform: platform.charAt(0).toUpperCase() + platform.slice(1)
        });
    });
    return results;
}

module.exports = { scrapeJobSpy };
