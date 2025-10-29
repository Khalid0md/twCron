import cron from "node-cron";
import axios from "axios";
import { prisma } from "./prisma";
import dotenv from "dotenv";

dotenv.config();

export async function scheduleJob(jobId: string) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return;
    console.log("[cron service] Initiating Job")
    cron.schedule(job.cron, async () => {
        const maxTries = 2;
        for (let i = 0; i<= maxTries; i++) {
            try {
                const res = await axios.post(job.targetUrl, JSON.parse(job.payload), {
                    headers: {
                        "Authorization": job.secretKey,
                        "Content-Type": "application/json"
                    }
                });
    
                console.log(`[cron service] Webhook responded with status ${res.status}`);
    
                await prisma.attempt.create({
                    data: {
                        jobId: job.id,
                        payload: job.payload,
                        statusCode: res.status,
                        details: JSON.stringify(res.data)
                    }
                });

                break;
            } catch (err: any) {
                await prisma.attempt.create({
                    data: {
                        jobId: job.id,
                        payload: job.payload,
                        statusCode: err.response?.status || 500,
                        details: err.message
                    }
                });

                if (i < maxTries) {
                    console.log(`[cron service] Retrying in 5 seconds`);
                    await new Promise(res => setTimeout(res, 5000));
                } else {
                    console.error(`[cron service]all attempts failed`);
                    await prisma.job.delete({ where: { id: job.id } });
                }
            }
        }
    });
}