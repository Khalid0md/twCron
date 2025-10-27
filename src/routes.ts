import express, { Request, Response } from 'express';
import { prisma } from "./prisma";
import { scheduleJob } from "./cronScheduler";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

router.post("/createJob", async (req: Request<{}, {}, CronService.CreateJobBody>, res: Response) => {
    const { targetUrl, payload, cron, secretKey } = req.body;
    console.log("[router] /createJob called with:", req.body);
    if (secretKey !== process.env.SECRETKEY) {
      console.log(`[Unathorized] Invalid secret key provided`);
      return res.status(403).json({ error: "403: Invalid secret key" });
    }
    if (!targetUrl || !payload || !cron) {
      return res.status(400).json({ error: "missing required fields" });
    }

    const job = await prisma.job.create({
        data: {
            targetUrl,
            payload: JSON.stringify(payload),
            cron,
            secretKey
        }
    });

    await scheduleJob(job.id);
    res.json({ jobId: job.id });
});

router.get('/job/:jobId', async (req: Request<CronService.JobDetailsParams>, res: Response) => {
    console.log("[router] /job/:jobId called with:", req.body);
    try {
      const { jobId } = req.params;

      const job = await prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        return res.status(404).json({ error: 'job not found' });
      }

      res.json(job);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'server error' });
    }
  }
);

router.get( '/job/:jobId/attempts', async (req: Request<CronService.JobDetailsParams>, res: Response) => {
    console.log("[router] /job/:jobId/attempts called with:", req.body);
    try {
      const { jobId } = req.params;

      const attempts = await prisma.attempt.findMany({
        where: { jobId },
      });

      res.json(attempts);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;