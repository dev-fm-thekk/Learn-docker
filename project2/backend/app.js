import express from 'express';
import todoRouter from './apis/route.js';

const app = express();

// Parse JSON request bodies
app.use(express.json());

const apiv1 = express.Router();

apiv1.use('/todo', todoRouter);

app.use('/api/v1', apiv1);

export default app;