import { Router } from 'express';
import SearchController from '../controller/searchController.js'; 

const router = Router();

router.get('/', SearchController.index); 

export default router;