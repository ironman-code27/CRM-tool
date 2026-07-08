export interface Activity {
  id: string;
  leadId: string;
  channel: 'linkedin' | 'email' | 'phone' | 'event';
  date: string;
  by: string;
  outcome: string;
  notes: string;
}
