import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import AiPipelineProgress from "@/models/ai-pipeline-progress";
import Author from "@/models/author";
import { sendToRabbitMQ, AI_PIPELINE_QUEUE } from "@/lib/rabbitmq";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const topic = (body.topic || "").trim();
    const category = (body.category || "General").trim();
    const keywords = Array.isArray(body.keywords) ? body.keywords : [];
    let authorId = body.authorId || body.author || null;

    if (!topic) {
      return NextResponse.json({ error: "Topic is required for AI generation" }, { status: 400 });
    }

    if (!authorId) {
      const defaultAuthor = await Author.findOne({ status: "active" }) || await Author.findOne();
      if (defaultAuthor) {
        authorId = defaultAuthor._id.toString();
      }
    }

    const jobId = `job-ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 1. Save initial queued progress job in MongoDB
    const progressDoc = await AiPipelineProgress.create({
      jobId,
      topic,
      category,
      status: "queued",
      progress: 5,
      currentStep: "Job created in MongoDB queue tracking",
      logs: [
        {
          message: `AI Pipeline job created for topic: "${topic}"`,
          step: "queued",
          timestamp: new Date(),
        },
      ],
    });

    // 2. Push message to RabbitMQ queue
    const rabbitResult = await sendToRabbitMQ(AI_PIPELINE_QUEUE, {
      jobId,
      topic,
      category,
      keywords,
      authorId,
      createdAt: new Date().toISOString(),
    });

    if (!rabbitResult.success) {
      // Update progress doc to alert that RabbitMQ service is unavailable
      progressDoc.status = "failed";
      progressDoc.currentStep = "RabbitMQ container is offline or unavailable";
      progressDoc.error = rabbitResult.error || "RabbitMQ service not available";
      progressDoc.logs.push({
        message: `RabbitMQ push failed: ${rabbitResult.error}`,
        step: "failed",
        timestamp: new Date(),
      });
      await progressDoc.save();

      return NextResponse.json(
        {
          success: false,
          offline: true,
          jobId,
          progress: progressDoc,
          error: "RabbitMQ / CloudAMQP service is offline or unreachable. Please check connection parameters.",
        },
        { status: 503 }
      );
    }

    // Update log for successful queue push
    progressDoc.logs.push({
      message: `Job message successfully pushed to RabbitMQ queue (${AI_PIPELINE_QUEUE})`,
      step: "queued",
      timestamp: new Date(),
    });
    await progressDoc.save();

    return NextResponse.json({
      success: true,
      jobId,
      progress: progressDoc,
      message: "AI Blog Generation job queued successfully!",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to trigger AI pipeline job" },
      { status: 500 }
    );
  }
}
