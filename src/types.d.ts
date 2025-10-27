declare namespace CronService {
  interface CreateJobBody {
    targetUrl: string;
    payload: Record<string, any>;
    cron: string;
    secretKey: string;
  }

  interface Job {
    id: string;
    targetUrl: string;
    payload: string;
    cron: string;
    secretKey: string;
    createdAt: Date;
    nextRequestAt: Date | null;
  }

  interface Attempt {
    id: string;
    jobId: string;
    attemptedAt: Date;
    payload: string;
    statusCode: number;
    details: string;
  }

  interface JobDetailsParams {
    jobId: string;
  }
}
