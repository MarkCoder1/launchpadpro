// NOTE: This is a simplified, conceptual example. 
// You must replace <YOUR_ACCESS_TOKEN> with your actual, valid OAuth token.

const UPWORK_API_BASE_URL = 'https://api.upwork.com/api/v3/';
const ACCESS_TOKEN = '<YOUR_ACCESS_TOKEN>'; // Get this via the OAuth process

async function searchUpworkJobs(query) {
    // The search endpoint and parameters might vary based on Upwork's latest documentation.
    const endpoint = `${UPWORK_API_BASE_URL}offers/v1/jobs/search?q=${encodeURIComponent(query)}`;
    
    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                // The Authorization header is essential and contains your token.
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            // Handle errors like 401 Unauthorized (bad token) or 404 Not Found.
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        console.log(`Found ${data.paging.total} job postings for "${query}":\n`);
        
        // Loop through and print details of the first 5 jobs
        data.jobs.slice(0, 5).forEach((job, index) => {
            console.log(`--- Job ${index + 1} ---`);
            console.log(`Title: ${job.title}`);
            console.log(`Budget: ${job.budget ? `$${job.budget}` : 'N/A'}`);
            console.log(`URL: ${job.url}`);
        });

    } catch (error) {
        console.error('Failed to fetch job postings:', error.message);
    }
}

searchUpworkJobs('Node.js developer');