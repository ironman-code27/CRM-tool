import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 1. Read .env file
const envText = fs.readFileSync('.env', 'utf-8');
const env = {};
envText.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Supabase environment variables not found in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const LEADS_TABLE = 'Texkera-CRM-DataBase';

// 2. Helper to parse a single CSV line correctly handling quotes and commas
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// Helper to map and parse dates
function parseCSVDate(dateStr) {
  if (!dateStr) return new Date().toISOString();
  // e.g. 6/17/2026
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const month = parseInt(parts[0], 10) - 1;
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  const directDate = new Date(dateStr);
  if (!isNaN(directDate.getTime())) {
    return directDate.toISOString();
  }
  return new Date().toISOString();
}

// 3. React ID to UUID generator (matching leadsService.ts)
function reactIdToUuid(reactId) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(reactId)) {
    return reactId.toLowerCase();
  }
  let hex = '';
  for (let i = 0; i < reactId.length; i++) {
    hex += reactId.charCodeAt(i).toString(16).padStart(2, '0');
  }
  hex = hex.padEnd(32, '0');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

async function runImport() {
  const csvPath = path.resolve('src/LeadDetail/TekXera_Leads_2026-07-09.csv');
  console.log(`Reading CSV file from: ${csvPath}`);
  
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  const csvText = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  
  if (lines.length < 2) {
    console.error('CSV file has no data lines.');
    process.exit(1);
  }

  // Parse headers
  const rawHeaders = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  console.log('CSV Headers Found:', rawHeaders);

  const colIdx = (name) => rawHeaders.indexOf(name.toLowerCase());
  
  const idx = {
    name: colIdx('Name'),
    title: colIdx('Title'),
    company: colIdx('Company'),
    email: colIdx('Email'),
    country: colIdx('Country'),
    stage: colIdx('Stage'),
    assignee: colIdx('Assigned To'),
    services: colIdx('Services'),
    notes: colIdx('Notes'),
    added: colIdx('Added')
  };

  // Fetch existing leads from Supabase
  console.log('Fetching existing leads from Supabase to prevent duplicates...');
  const { data: existingLeads, error: fetchError } = await supabase
    .from(LEADS_TABLE)
    .select('*');

  if (fetchError) {
    console.error('Failed to fetch existing leads:', fetchError);
    process.exit(1);
  }

  console.log(`Found ${existingLeads.length} existing leads in database.`);

  let totalRecords = lines.length - 1;
  let successImported = 0;
  let updatedExisting = 0;
  let skippedDuplicates = 0;
  let failedRecords = 0;
  const failureReasons = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length < rawHeaders.length) {
      skippedDuplicates++;
      continue; // Skip invalid or incomplete lines
    }

    const nameVal = row[idx.name] ? row[idx.name].trim() : '';
    const titleVal = row[idx.title] ? row[idx.title].trim() : '';
    const companyVal = row[idx.company] ? row[idx.company].trim() : '';
    const emailVal = row[idx.email] ? row[idx.email].trim().toLowerCase() : '';
    const countryVal = row[idx.country] ? row[idx.country].trim() : '';
    const stageVal = row[idx.stage] ? row[idx.stage].trim() : 'new';
    const assigneeVal = row[idx.assignee] ? row[idx.assignee].trim() : '';
    const servicesVal = row[idx.services] ? row[idx.services].split(';').map(s => s.trim().toLowerCase()).filter(Boolean) : [];
    const notesVal = row[idx.notes] ? row[idx.notes].trim() : '';
    const addedVal = row[idx.added] ? row[idx.added].trim() : '';

    if (!nameVal) {
      failedRecords++;
      failureReasons.push(`Row ${i + 1}: Missing name.`);
      continue;
    }

    // Split name
    const parts = nameVal.split(' ');
    const first_name = parts[0] || '';
    const last_name = parts.slice(1).join(' ') || '';

    // Check duplicate
    const matchedLead = existingLeads.find(l => {
      if (emailVal && l.email && l.email.toLowerCase() === emailVal) return true;
      const dbFullName = `${l.first_name || ''} ${l.last_name || ''}`.trim().toLowerCase();
      if (dbFullName === nameVal.toLowerCase() && l.company && l.company.toLowerCase() === companyVal.toLowerCase()) {
        return true;
      }
      return false;
    });

    const leadData = {
      first_name,
      last_name,
      job_title: titleVal,
      company: companyVal,
      email: emailVal,
      country: countryVal,
      stage: stageVal,
      assignee: assigneeVal,
      services: servicesVal,
      notes: notesVal,
      created_at: parseCSVDate(addedVal)
    };

    if (matchedLead) {
      // It exists. Check if we need to update it
      let needsUpdate = false;
      const keysToCheck = ['job_title', 'company', 'country', 'stage', 'assignee', 'notes'];
      for (const k of keysToCheck) {
        if ((leadData[k] || '') !== (matchedLead[k] || '')) {
          needsUpdate = true;
          break;
        }
      }
      // Compare services array
      if (JSON.stringify(leadData.services.sort()) !== JSON.stringify((matchedLead.services || []).sort())) {
        needsUpdate = true;
      }

      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from(LEADS_TABLE)
          .update(leadData)
          .eq('id', matchedLead.id);

        if (updateError) {
          failedRecords++;
          failureReasons.push(`Row ${i + 1} (${nameVal}): Update failed - ${updateError.message}`);
        } else {
          updatedExisting++;
        }
      } else {
        skippedDuplicates++;
      }
    } else {
      // New lead, insert
      // Generate ID
      const newReactId = 'l' + Date.now() + 'x' + i;
      const uuid = reactIdToUuid(newReactId);
      
      const { error: insertError } = await supabase
        .from(LEADS_TABLE)
        .insert({
          id: uuid,
          ...leadData
        });

      if (insertError) {
        failedRecords++;
        failureReasons.push(`Row ${i + 1} (${nameVal}): Insert failed - ${insertError.message}`);
      } else {
        successImported++;
      }
    }
  }

  console.log('\n================ IMPORT SUMMARY ================');
  console.log(`Total records found in CSV: ${totalRecords}`);
  console.log(`Successfully imported:     ${successImported}`);
  console.log(`Updated existing records:  ${updatedExisting}`);
  console.log(`Skipped duplicates:        ${skippedDuplicates}`);
  console.log(`Failed records:            ${failedRecords}`);
  if (failedRecords > 0) {
    console.log('\nFailures detail:');
    failureReasons.forEach(reason => console.log(` - ${reason}`));
  }
  console.log('================================================\n');
}

runImport();
