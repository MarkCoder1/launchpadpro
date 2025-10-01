const Parser = require('rss-parser'); // npm install rss-parser
const RSS_URL = 'https://www.scholarships.com/rss/scholarship-feed.xml';

async function fetchScholarshipsRSS() {
  try {
    let parser = new Parser();
    const feed = await parser.parseURL(RSS_URL);
    console.log('Scholarships Feed:', feed);
    feed.items.forEach(item => console.log(`- ${item.title} (Link: ${item.link})`));
  } catch (error) {
    console.error('RSS Fetch Error:', error.message);
  }
}

fetchScholarshipsRSS();