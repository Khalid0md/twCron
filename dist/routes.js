"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("./prisma");
const cronScheduler_1 = require("./cronScheduler");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = express_1.default.Router();
router.post("/createJob", async (req, res) => {
    const { targetUrl, payload, cron, secretKey } = req.body;
    console.log("[route] /createJob called with:", req.body);
    if (secretKey !== process.env.SECRETKEY) {
        console.log(`[Unathorized] Invalid secret key provided`);
        return res.status(403).json({ error: "403: Invalid secret key" });
    }
    if (!targetUrl || !payload || !cron) {
        return res.status(400).json({ error: "missing required fields" });
    }
    const job = await prisma_1.prisma.job.create({
        data: {
            targetUrl,
            payload: JSON.stringify(payload),
            cron,
            secretKey
        }
    });
    await (0, cronScheduler_1.scheduleJob)(job.id);
    res.json({ jobId: job.id });
});
router.get('/job/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await prisma_1.prisma.job.findUnique({
            where: { id: jobId },
        });
        if (!job) {
            return res.status(404).json({ error: 'job not found' });
        }
        res.json(job);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
});
router.get('/job/:jobId/attempts', async (req, res) => {
    try {
        const { jobId } = req.params;
        const attempts = await prisma_1.prisma.attempt.findMany({
            where: { jobId },
        });
        res.json(attempts);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
