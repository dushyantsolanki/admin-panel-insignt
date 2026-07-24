import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import AiPipelineProgress from "@/models/ai-pipeline-progress";
import { sendToRabbitMQ, AI_PIPELINE_QUEUE } from "@/lib/rabbitmq";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { action, jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    const job = await AiPipelineProgress.findOne({ jobId });
    if (!job) {
      return NextResponse.json({ error: "Pipeline job not found" }, { status: 404 });
    }

    if (action === "stop" || action === "cancel") {
      // 1. Stop / Cancel Active Processing Job
      job.status = "failed";
      job.currentStep = "Cancelled by admin";
      job.error = "Job processing stopped by admin user";
      job.logs.push({
        message: "[Admin Action]: Pipeline processing job stopped by admin user.",
        step: "failed",
        timestamp: new Date(),
      });
      await job.save();

      return NextResponse.json({
        success: true,
        action: "stop",
        jobId,
        message: "Job processing stopped successfully.",
      });
    }

    if (action === "restart" || action === "retry") {
      // 2. Restart / Retry Job (Reset progress and re-push to RabbitMQ)
      job.status = "queued";
      job.progress = 5;
      job.currentStep = "Job re-queued in RabbitMQ by admin";
      job.error = undefined;
      job.logs = [
        {
          message: `[Admin Action]: Job re-queued for topic "${job.topic}".`,
          step: "queued",
          timestamp: new Date(),
        },
      ];
      await job.save();

      // Push payload back to RabbitMQ queue
      const rabbitResult = await sendToRabbitMQ(AI_PIPELINE_QUEUE, {
        jobId: job.jobId,
        topic: job.topic,
        category: job.category,
        createdAt: new Date().toISOString(),
      });

      if (!rabbitResult.success) {
        job.status = "failed";
        job.currentStep = "RabbitMQ container offline on restart";
        job.error = rabbitResult.error || "RabbitMQ service not available";
        job.logs.push({
          message: `[RabbitMQ Error]: Failed re-queuing job: ${rabbitResult.error}`,
          step: "failed",
          timestamp: new Date(),
        });
        await job.save();

        return NextResponse.json(
          {
            success: false,
            offline: true,
            error: rabbitResult.error || "RabbitMQ service offline",
          },
          { status: 503 }
        );
      }

      return NextResponse.json({
        success: true,
        action: "restart",
        jobId,
        message: "Job restarted and re-queued successfully.",
      });
    }

    return NextResponse.json({ error: "Invalid action. Supported: stop, restart" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed executing pipeline job action" },
      { status: 500 }
    );
  }
}
