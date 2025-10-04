#!/usr/bin/env node

/**
 * Add environment variables to Vercel using API
 */

const TOKEN = 'qQlVie9zdbPbE1xsQHaxJI2G';

const envVars = [
  { key: 'VITE_SUPABASE_URL', value: 'https://sdmjetiogbvgzqsvcuth.supabase.co' },
  { key: 'VITE_SUPABASE_ANON_KEY', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbWpldGlvZ2J2Z3pxc3ZjdXRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTA4ODcsImV4cCI6MjA3NTEyNjg4N30.EKAt4imuEHXdhNsnVTkp2JWnX09jPXXD96WZeE9GyGY' },
  { key: 'VITE_MAPBOX_TOKEN', value: 'pk.eyJ1IjoibW9oc2Vuc2FyaGFuIiwiYSI6ImNtZnliaWFpeTBpdTUyanNieGdydXRjMmUifQ.W14WRrNn17S-bCR6nEK8Yg' },
  { key: 'VITE_APP_NAME', value: 'TruPath' },
  { key: 'VITE_APP_VERSION', value: '1.0.0' },
  { key: 'VITE_APP_DESCRIPTION', value: 'Egyptian Food Bank Donation Journey Tracker' }
];

async function getProjectId() {
  console.log('🔍 Finding Vercel project...\n');

  const response = await fetch('https://api.vercel.com/v9/projects', {
    headers: {
      'Authorization': `Bearer ${TOKEN}`
    }
  });

  const data = await response.json();

  if (!data.projects || data.projects.length === 0) {
    throw new Error('No projects found');
  }

  // Find efbtrack project
  const project = data.projects.find(p => p.name === 'efbtrack' || p.name === 'sigma' || p.name.includes('sigma'));

  if (!project) {
    console.log('Available projects:');
    data.projects.forEach(p => console.log(`  - ${p.name} (${p.id})`));
    throw new Error('Could not find efbtrack/sigma project');
  }

  console.log(`✅ Found project: ${project.name} (${project.id})\n`);
  return project.id;
}

async function addEnvVar(projectId, key, value) {
  console.log(`➤ Adding ${key}...`);

  const response = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      key,
      value,
      type: 'encrypted',
      target: ['production', 'preview', 'development']
    })
  });

  const data = await response.json();

  if (response.ok) {
    console.log(`  ✅ ${key} added successfully`);
  } else {
    console.error(`  ❌ Failed to add ${key}:`, data.error?.message || JSON.stringify(data));
  }
}

async function main() {
  try {
    const projectId = await getProjectId();

    console.log('📦 Adding environment variables...\n');

    for (const { key, value } of envVars) {
      await addEnvVar(projectId, key, value);
    }

    console.log('\n✅ All environment variables added!');
    console.log('\n🚀 Vercel will automatically redeploy with new variables.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
