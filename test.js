// fetch-graphql-jobs.mjs (ESM) or .js in Node 18+
const query = `
  query {
    jobs(first: 5) {
      id
      title
      description
      remote
      company { name logoUrl }
      tags { name }
    }
  }
`;

async function fetchJobs() {
  try {
    const response = await fetch('https://api.graphql.jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const { data, errors } = await response.json();
    if (errors && errors.length) {
      console.error('GraphQL errors:', errors);
      return;
    }
    console.log('Jobs:', data?.jobs ?? []);
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

fetchJobs();