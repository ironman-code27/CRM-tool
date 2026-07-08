const JSONBIN_API = 'https://api.jsonbin.io/v3';

export async function cloudLoad(binId: string, binKey: string) {
  if (!binId || !binKey) return null;
  try {
    const r = await fetch(`${JSONBIN_API}/b/${binId}/latest`, {
      headers: { 'X-Master-Key': binKey },
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j.record;
  } catch (e) {
    console.error('cloudLoad error:', e);
    return null;
  }
}

export async function cloudSave(
  binId: string,
  binKey: string,
  data: { leads: any[]; tasks: any[]; activity: any[]; team: any[] }
) {
  if (!binId || !binKey) return false;
  try {
    const r = await fetch(`${JSONBIN_API}/b/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': binKey,
      },
      body: JSON.stringify(data),
    });
    return r.ok;
  } catch (e) {
    console.error('cloudSave error:', e);
    return false;
  }
}

export async function createBin(
  binKey: string,
  data: { leads: any[]; tasks: any[]; activity: any[]; team: any[] }
) {
  try {
    const r = await fetch(`${JSONBIN_API}/b`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': binKey,
        'X-Bin-Name': 'TekXera CRM',
        'X-Bin-Private': 'true',
      },
      body: JSON.stringify(data),
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j.metadata?.id || null;
  } catch (e) {
    console.error('createBin error:', e);
    return null;
  }
}
