import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import AiPipelineProgress from "@/models/ai-pipeline-progress";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    if (jobId) {
      const job = await AiPipelineProgress.findOne({ jobId }).populate("postId", "title slug status");
      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      return NextResponse.json({ job });
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10")));
    const search = (searchParams.get("search") || "").trim();
    const statusFilter = (searchParams.get("status") || "all").trim();

    // Construct Mongoose filter query
    const filterQuery: any = {};

    if (search) {
      filterQuery.$or = [
        { topic: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { jobId: { $regex: search, $options: "i" } },
        { currentStep: { $regex: search, $options: "i" } },
      ];
    }

    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "processing") {
        filterQuery.status = { $in: ["processing", "generating_outline", "writing_content", "generating_seo"] };
      } else {
        filterQuery.status = statusFilter;
      }
    }

    const skip = (page - 1) * limit;

    const totalJobs = await AiPipelineProgress.countDocuments(filterQuery);
    const jobs = await AiPipelineProgress.find(filterQuery)
      .populate("postId", "title slug status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const activeCount = await AiPipelineProgress.countDocuments({
      status: { $in: ["queued", "processing", "generating_outline", "writing_content", "generating_seo"] },
    });
    const completedCount = await AiPipelineProgress.countDocuments({ status: "completed" });
    const failedCount = await AiPipelineProgress.countDocuments({ status: "failed" });
    const overallTotalCount = await AiPipelineProgress.countDocuments({});

    const totalPages = Math.ceil(totalJobs / limit) || 1;

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total: totalJobs,
        totalPages,
      },
      stats: {
        active: activeCount,
        completed: completedCount,
        failed: failedCount,
        total: overallTotalCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch AI pipeline progress" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");
    const clearAll = searchParams.get("clearAll") === "true";

    if (clearAll) {
      const res = await AiPipelineProgress.deleteMany({});
      return NextResponse.json({ success: true, deletedCount: res.deletedCount });
    }

    if (jobId) {
      const deletedJob = await AiPipelineProgress.findOneAndDelete({ jobId });
      if (!deletedJob) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, jobId });
    }

    return NextResponse.json({ error: "Specify jobId or clearAll=true" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete AI pipeline job" },
      { status: 500 }
    );
  }
}

