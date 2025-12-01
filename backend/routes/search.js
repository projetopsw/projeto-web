import express from 'express';
import SearchController from '../controller/searchController.js';

const router = express.Router();

router.get('/', SearchController.index);

export default router;