import { Router } from 'express';
import {
  getLeads,
  createLead,
  updateLead,
  deleteLead,
  bulkInsertLeads,
  subscribeLeads,
} from '../controllers/leadsController.js';

const router = Router();

router.get('/', getLeads);
router.post('/', createLead);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);
router.post('/bulk', bulkInsertLeads);
router.get('/subscribe', subscribeLeads);

export default router;
