"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleJob = scheduleJob;
const node_cron_1 = __importDefault(require("node-cron"));
const axios_1 = __importDefault(require("axios"));
const prisma_1 = require("./prisma");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function scheduleJob(jobId) {
    const job = await prisma_1.prisma.job.findUnique({ where: { id: jobId } });
    if (!job)
        return;
    console.log("[cron service] Initiating Job");
    node_cron_1.default.schedule(job.cron, async () => {
        try {
            const res = await axios_1.default.post(job.targetUrl, JSON.parse(job.payload), {
                headers: {
                    "Authorization": job.secretKey,
                    "Content-Type": "application/json"
                }
            });
            console.log(`[cron service] Webhook responded with status ${res.status}`);
            await prisma_1.prisma.attempt.create({
                data: {
                    jobId: job.id,
                    payload: job.payload,
                    statusCode: res.status,
                    details: JSON.stringify(res.data)
                }
            });
        }
        catch (err) {
            await prisma_1.prisma.attempt.create({
                data: {
                    jobId: job.id,
                    payload: job.payload,
                    statusCode: err.response?.status || 500,
                    details: err.message
                }
            });
        }
    });
}
