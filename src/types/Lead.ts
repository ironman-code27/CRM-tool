import type { Comment } from './Comment';
import type { PipelineStage } from './PipelineStage';

export interface Lead {
  id: string;
  fname: string;
  lname: string;
  title: string;
  company: string;
  email: string;
  country: string;
  stage: PipelineStage;
  assignee: string;
  services: ('cyber' | 'cloud' | 'saas')[];
  notes: string;
  channels: string[];
  created: string;
  comments?: Comment[];
}
