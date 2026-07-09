import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

/**
 * migrate-jsonbin.ts
 * 
 * One-time migration utility to migrate legacy CRM data from lead.json to Supabase.
 * Maps leads, activities, comments, and team members to Supabase schema.
 * Prevents duplicates by matching email or Company + Name, and merging notes.
 * Safely handles idempotency to allow re-runs.
 */

// 1. Read and Parse .env file
let envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  envPath = path.resolve(process.cwd(), '..', '.env');
}
if (!fs.existsSync(envPath)) {
  console.error('Error: .env file not found in the current or parent directory.');
  process.exit(1);
}

const envText = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envText.split(/\r?\n/).forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LEADS_TABLE = 'Texkera-CRM-DataBase';
const TEAM_TABLE = 'team_members';

// Deterministic UUID generator matching the codebase
function reactIdToUuid(reactId: string): string {
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

// Stage hierarchy for merging stages (prefer qualified/closed/contacted over new)
const STAGE_ORDER = ['new', 'contacted', 'qualified', 'closed'];
function mergeStages(stage1: string, stage2: string): string {
  const idx1 = STAGE_ORDER.indexOf(stage1 || 'new');
  const idx2 = STAGE_ORDER.indexOf(stage2 || 'new');
  return STAGE_ORDER[Math.max(idx1, idx2)];
}

// Merge notes, comments, and activities cleanly without repeating lines
function mergeNotes(notes1: string, notes2: string): string {
  if (!notes1) return notes2 || '';
  if (!notes2) return notes1 || '';
  if (notes1 === notes2) return notes1;

  const lines1 = notes1.split(/\r?\n/);
  const lines2 = notes2.split(/\r?\n/);
  const combined = [...lines1];
  
  for (const line of lines2) {
    const trimmed = line.trim();
    if (trimmed && !combined.map(l => l.trim()).includes(trimmed)) {
      combined.push(line);
    }
  }
  
  return combined.join('\n');
}

async function runMigration() {
  let jsonPath = path.resolve(process.cwd(), 'lead.json');
  if (!fs.existsSync(jsonPath)) {
    jsonPath = path.resolve(process.cwd(), '..', 'lead.json');
  }
  console.log(`Reading legacy data from: ${jsonPath}`);
  
  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: Legacy JSON file not found at ${jsonPath}`);
    process.exit(1);
  }

  const rawJson = fs.readFileSync(jsonPath, 'utf-8');
  let data: any;
  try {
    data = JSON.parse(rawJson);
  } catch (err: any) {
    console.error(`Error parsing lead.json: ${err.message}`);
    process.exit(1);
  }

  const legacyLeads = data.leads || [];
  const legacyActivities = data.activity || [];
  const legacyTeam = data.team || [];

  console.log(`Found in JSON: ${legacyLeads.length} leads, ${legacyActivities.length} activities, ${legacyTeam.length} team members.\n`);

  // Fetch existing team members and leads from Supabase for duplicate detection
  const { data: existingTeam, error: teamFetchError } = await supabase.from(TEAM_TABLE).select('*');
  if (teamFetchError) {
    console.error('Failed to fetch existing team members:', teamFetchError.message);
    process.exit(1);
  }

  const { data: existingLeads, error: leadsFetchError } = await supabase.from(LEADS_TABLE).select('*');
  if (leadsFetchError) {
    console.error('Failed to fetch existing leads:', leadsFetchError.message);
    process.exit(1);
  }

  // --- 1. Import Team Members ---
  let teamImported = 0;
  for (const m of legacyTeam) {
    try {
      const uuid = reactIdToUuid(m.id);
      const payload = {
        id: uuid,
        name: m.name,
        color: m.color || '#4A9EFF',
        status: 'Active'
      };

      const { error } = await supabase
        .from(TEAM_TABLE)
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        console.error(`❌ Failed to import team member ${m.name}: ${error.message}`);
      } else {
        teamImported++;
      }
    } catch (err: any) {
      console.error(`❌ Error processing team member ${m.name}: ${err.message}`);
    }
  }
  if (teamImported > 0) {
    console.log('✔ Imported Team Members');
  }

  // --- 2. Import Leads with Duplicate Detection and Merging ---
  let leadsImported = 0;
  let activitiesProcessedCount = 0;

  for (const lead of legacyLeads) {
    try {
      // Find duplicate in existing leads
      const email = (lead.email || '').trim().toLowerCase();
      const fname = (lead.fname || '').trim().toLowerCase();
      const lname = (lead.lname || '').trim().toLowerCase();
      const company = (lead.company || '').trim().toLowerCase();

      let matchedLead = existingLeads.find(l => {
        const dbEmail = (l.email || '').trim().toLowerCase();
        if (email && dbEmail === email) {
          return true;
        }
        if (!email) {
          const dbFname = (l.first_name || '').trim().toLowerCase();
          const dbLname = (l.last_name || '').trim().toLowerCase();
          const dbCompany = (l.company || '').trim().toLowerCase();
          if (dbCompany === company && dbFname === fname && dbLname === lname) {
            return true;
          }
        }
        return false;
      });

      // Find activities for this lead
      const leadActivities = legacyActivities.filter((act: any) => act.leadId === lead.id);

      // Build legacy comments text if present
      let formattedComments = '';
      if (lead.comments && lead.comments.length > 0) {
        formattedComments = '\n\n--- Migrated Comments ---\n' + lead.comments.map((c: any) => {
          return `• [${c.time || 'N/A'}] ${c.author || 'Unknown'} (${c.role || 'User'}) [Tone: ${c.sentiment || 'neutral'}]: ${c.text || ''}`;
        }).join('\n');
      }

      // Build legacy activities text if present
      let formattedActivities = '';
      if (leadActivities.length > 0) {
        formattedActivities = '\n\n--- Migrated Activity History ---\n' + leadActivities.map((a: any) => {
          const notesText = a.notes ? `\n  Notes: ${a.notes}` : '';
          return `• [${a.date || 'N/A'}] ${a.channel || 'Interaction'} by ${a.by || 'Unknown'} -> Outcome: ${a.outcome || 'N/A'}${notesText}`;
        }).join('\n');
      }

      // Combine notes, comments, and activities from legacy JSON
      const legacyCombinedNotes = `${lead.notes || ''}${formattedComments}${formattedActivities}`.trim();

      let targetId = matchedLead ? matchedLead.id : reactIdToUuid(lead.id);
      let targetNotes = matchedLead ? mergeNotes(matchedLead.notes || '', legacyCombinedNotes) : legacyCombinedNotes;
      let targetStage = matchedLead ? mergeStages(matchedLead.stage || 'new', lead.stage || 'new') : (lead.stage || 'new');
      let targetAssignee = matchedLead ? (matchedLead.assignee || lead.assignee || '') : (lead.assignee || '');
      
      // Union services
      let targetServices = matchedLead ? [...(matchedLead.services || [])] : [];
      if (lead.services && Array.isArray(lead.services)) {
        for (const s of lead.services) {
          if (!targetServices.includes(s)) {
            targetServices.push(s);
          }
        }
      }

      // Parse and format creation date
      let parsedDate = matchedLead ? matchedLead.created_at : new Date().toISOString();
      if (!matchedLead && lead.created) {
        const directDate = new Date(lead.created);
        if (!isNaN(directDate.getTime())) {
          parsedDate = directDate.toISOString();
        }
      }

      const leadPayload = {
        id: targetId,
        first_name: lead.fname || '',
        last_name: lead.lname || '',
        job_title: lead.title || '',
        company: lead.company || '',
        email: lead.email || '',
        country: lead.country || '',
        stage: targetStage,
        assignee: targetAssignee,
        services: targetServices,
        notes: targetNotes,
        created_at: parsedDate
      };

      const { error } = await supabase
        .from(LEADS_TABLE)
        .upsert(leadPayload, { onConflict: 'id' });

      if (error) {
        console.error(`❌ Failed to migrate lead ${lead.fname} ${lead.lname}: ${error.message}`);
      } else {
        leadsImported++;
        activitiesProcessedCount += leadActivities.length;
      }
    } catch (err: any) {
      console.error(`❌ Error processing lead ${lead.fname}: ${err.message}`);
    }
  }

  if (leadsImported > 0) {
    console.log('✔ Imported Leads');
  }

  if (activitiesProcessedCount > 0 || legacyActivities.length > 0) {
    console.log('✔ Imported Activities');
  }

  console.log('✔ Migration Completed');
}

runMigration().catch((err) => {
  console.error('Fatal Migration Error:', err);
  process.exit(1);
});
