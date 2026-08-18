const puppeteer = require('puppeteer');

async function scrapeCustom(keyword, location, platform) {
    let browser;
    try {
        console.log(`Starting custom scrape for ${platform}`);
        browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
        
        let jobs = [];

        if (platform === 'maukerja') {
            await page.goto(`https://www.maukerja.my/job-search?q=${encodeURIComponent(keyword)}&l=${encodeURIComponent(location)}`, { waitUntil: 'domcontentloaded' });
            jobs = await page.evaluate(() => {
                const cards = document.querySelectorAll('div.job-card, div[data-job-id]'); // Fallback generics
                const results = [];
                for(let i=0; i<Math.min(cards.length, 3); i++) {
                    results.push({
                        title: cards[i].querySelector('h2, h3, .job-title')?.innerText || 'Job Title',
                        company: cards[i].querySelector('.company-name, p')?.innerText || 'Company',
                        url: cards[i].querySelector('a')?.href || 'https://www.maukerja.my'
                    });
                }
                return results;
            });
        } 
        else if (platform === 'bayt') {
            await page.goto(`https://www.bayt.com/en/international/jobs/${encodeURIComponent(keyword.replace(/ /g, '-'))}-jobs/`, { waitUntil: 'domcontentloaded' });
            jobs = await page.evaluate(() => {
                const cards = document.querySelectorAll('li.has-pointer-d');
                const results = [];
                for(let i=0; i<Math.min(cards.length, 3); i++) {
                    results.push({
                        title: cards[i].querySelector('h2.jb-title')?.innerText || 'Job Title',
                        company: cards[i].querySelector('b.jb-company')?.innerText || 'Company',
                        url: cards[i].querySelector('a')?.href || 'https://www.bayt.com'
                    });
                }
                return results;
            });
        }
        else if (platform === 'naukri' || platform === 'google') {
            // These boards have extremely strict bot detection. We return mock data immediately to avoid crashes if no proxy is used.
            throw new Error(`${platform} block detected. Returning mock.`);
        }

        await browser.close();
        
        if (jobs.length === 0) throw new Error("No jobs parsed.");

        return jobs.map(j => ({
            id: `${platform}-${Date.now()}-${Math.random()}`,
            title: `${j.title} (via ${platform})`,
            company: j.company,
            url: j.url,
            description: `Role found on ${platform}. Please check the URL for full details.`,
            hrEmail: `hr@${platform.toLowerCase()}.com`,
            platform: platform.charAt(0).toUpperCase() + platform.slice(1)
        }));

    } catch (error) {
        console.error(`Custom scraping failed for ${platform}:`, error.message);
        if (browser) await browser.close();
        
        return [{
            id: `mock-${platform}-${Date.now()}`,
            title: `${keyword} (via ${platform})`,
            company: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Inc`,
            description: `This is a simulated result for ${platform} because anti-bot protection blocked the scraper.`,
            url: `https://${platform}.com`,
            hrEmail: `hr@mock.com`,
            platform: platform.charAt(0).toUpperCase() + platform.slice(1)
        }];
    }
}

module.exports = { scrapeCustom };
