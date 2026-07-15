export interface HistoryEntry {
  id: string;
  action: string;
  module: string;
  entity_id: string;
  entity_name: string;
  old_value: string;
  new_value: string;
  description: string;
  performed_by: string;
  created_at: string;
  metadata?: any;
}
