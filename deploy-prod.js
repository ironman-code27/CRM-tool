import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const REMOTE_URL = 'https://github.com/ironman-code27/CRM-tool.git';
const BRANCH_NAME = 'production-build';
const DIST_DIR = path.resolve('frontend/dist');

function run() {
  console.log('--- Step 1: Building frontend for production ---');
  execSync('npm run build:frontend', { stdio: 'inherit' });

  if (!fs.existsSync(DIST_DIR)) {
    console.error(`Error: Distribution folder ${DIST_DIR} does not exist.`);
    process.exit(1);
  }

  console.log('--- Step 2: Preparing production-build folder ---');
  // Change directory to frontend/dist
  const originalCwd = process.cwd();
  process.chdir(DIST_DIR);

  try {
    // Check if git is already initialized in dist
    if (!fs.existsSync('.git')) {
      console.log('Initializing git repository in dist folder...');
      execSync('git init', { stdio: 'inherit' });
      execSync(`git remote add origin ${REMOTE_URL}`, { stdio: 'inherit' });
    }

    console.log(`Checking out/creating branch: ${BRANCH_NAME}...`);
    try {
      execSync(`git checkout -b ${BRANCH_NAME}`, { stdio: 'inherit' });
    } catch {
      // If branch already exists locally in this temp git repo
      execSync(`git checkout ${BRANCH_NAME}`, { stdio: 'inherit' });
    }

    console.log('Staging files...');
    execSync('git add .', { stdio: 'inherit' });

    const commitMessage = `deploy: production build - ${new Date().toISOString()}`;
    console.log(`Committing: "${commitMessage}"...`);
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });

    console.log(`Pushing to GitHub branch: ${BRANCH_NAME}...`);
    execSync(`git push origin ${BRANCH_NAME} --force`, { stdio: 'inherit' });

    console.log('--- Deployment successfully pushed! ---');
  } catch (err) {
    console.error('An error occurred during git deployment operations:', err);
  } finally {
    process.chdir(originalCwd);
  }
}

run();
