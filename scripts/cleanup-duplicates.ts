import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

/**
 * cleanup-duplicates.ts
 * 
 * One-time cleanup utility to remove duplicate leads in Supabase.
 * Uses email as primary unique key, or Company + First Name + Last Name as fallback.
 * Merges notes, comments, activities, assignee, and stage into the primary lead.
 */

// 1. Read and Parse .env file
let envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  envPath = path.resolve(process.cwd(), '..', '.env');
}
if (!fs.existsSync(envPath)) {
  console.error('Error: .env file not found.');
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
  console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const LEADS_TABLE = 'Texkera-CRM-DataBase';

// Helper to get unique key for a lead
function getLeadKey(lead: any): string {
  const email = (lead.email || '').trim().toLowerCase();
  if (email) {
    return `email:${email}`;
  }
  const company = (lead.company || '').trim().toLowerCase();
  const fname = (lead.first_name || '').trim().toLowerCase();
  const lname = (lead.last_name || '').trim().toLowerCase();
  return `fallback:${company}|${fname}|${lname}`;
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

  // Split into lines/paragraphs and deduplicate while preserving order
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

async function runCleanup() {
  console.log('Fetching all leads from Supabase...');
  const { data: allLeads, error: fetchError } = await supabase
    .from(LEADS_TABLE)
    .select('*');

  if (fetchError) {
    console.error('Failed to fetch leads:', fetchError.message);
    process.exit(1);
  }

  const totalBefore = allLeads.length;
  console.log(`Total leads in database before cleanup: ${totalBefore}`);

  // Group leads by their unique key
  const groups: Record<string, any[]> = {};
  for (const lead of allLeads) {
    const key = getLeadKey(lead);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(lead);
  }

  let duplicatesRemoved = 0;

  for (const key of Object.keys(groups)) {
    const records = groups[key];
    if (records.length <= 1) continue;

    console.log(`Found duplicate group for key "${key}" with ${records.length} records.`);

    // Choose primary record (prefer one that might be referenced or has older created_at)
    // Sort so primary is first. Primary criteria:
    // 1. Has non-empty assignee
    // 2. Oldest created_at
    records.sort((a, b) => {
      const aHasAssignee = !!a.assignee;
      const bHasAssignee = !!b.assignee;
      if (aHasAssignee && !bHasAssignee) return -1;
      if (!aHasAssignee && bHasAssignee) return 1;
      
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return aTime - bTime;
    });

    const primary = records[0];
    const duplicates = records.slice(1);

    // Merge duplicate records into primary
    let mergedNotes = primary.notes || '';
    let mergedStage = primary.stage || 'new';
    let mergedAssignee = primary.assignee || '';
    let mergedServices = [...(primary.services || [])];

    for (const dup of duplicates) {
      mergedNotes = mergeNotes(mergedNotes, dup.notes);
      mergedStage = mergeStages(mergedStage, dup.stage);
      if (!mergedAssignee) mergedAssignee = dup.assignee;
      
      // Union services
      if (dup.services && Array.isArray(dup.services)) {
        for (const s of dup.services) {
          if (!mergedServices.includes(s)) {
            mergedServices.push(s);
          }
        }
      }
    }

    // Update primary record
    const { error: updateError } = await supabase
      .from(LEADS_TABLE)
      .update({
        notes: mergedNotes,
        stage: mergedStage,
        assignee: mergedAssignee,
        services: mergedServices
      })
      .eq('id', primary.id);

    if (updateError) {
      console.error(`❌ Failed to update primary lead ${primary.first_name} ${primary.last_name}: ${updateError.message}`);
      continue;
    }

    // Delete duplicates
    for (const dup of duplicates) {
      const { error: deleteError } = await supabase
        .from(LEADS_TABLE)
        .delete()
        .eq('id', dup.id);

      if (deleteError) {
        console.error(`❌ Failed to delete duplicate lead ${dup.first_name} ${dup.last_name} (${dup.id}): ${deleteError.message}`);
      } else {
        duplicatesRemoved++;
      }
    }
  }

  const finalCount = totalBefore - duplicatesRemoved;

  console.log('\n================ CLEANUP REPORT ================');
  console.log(`Total leads before cleanup:  ${totalBefore}`);
  console.log(`Duplicate leads removed:     ${duplicatesRemoved}`);
  console.log(`Final lead count:            ${finalCount}`);
  console.log('================================================\n');
}

runCleanup().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
