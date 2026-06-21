import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Subscriber from "@/models/subscriber";
import Campaign from "@/models/campaign";
import { verifyToken } from "@/lib/jwt";
import { getTransporter, getNewsletterTemplate, SMTP_FROM } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Authenticate admin user
    const token = req.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.subject || !body.content) {
      return NextResponse.json({ error: "Subject and content are required" }, { status: 400 });
    }

    // Determine unsubscribe URL base
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
    const unsubscribeBaseUrl = `${apiUrl}/subscribers/unsubscribe`;
    const transporter = getTransporter();

    // Check if it's a test email dispatch
    if (body.testEmail) {
      const testUnsubscribeUrl = `${unsubscribeBaseUrl}?token=test-token`;
      const testEmailHtml = getNewsletterTemplate(body.content, testUnsubscribeUrl);

      await transporter.sendMail({
        from: SMTP_FROM,
        to: body.testEmail,
        subject: `${body.subject}`,
        html: testEmailHtml,
      });

      return NextResponse.json({
        success: true,
        message: `Test email successfully sent to ${body.testEmail}`,
      });
    }

    // Fetch active subscribers
    const activeSubscribers = await Subscriber.find({ status: "active" });

    if (activeSubscribers.length === 0) {
      return NextResponse.json({ error: "No active subscribers to send to." }, { status: 400 });
    }

    // Create a new campaign log entry in DB
    const campaign = new Campaign({
      subject: body.subject,
      content: body.content,
      recipientCount: activeSubscribers.length,
      status: "sending",
      sentBy: decoded.name || decoded.email || "Admin",
    });
    await campaign.save();

    let sentCount = 0;
    let failedCount = 0;

    // Send emails (for small/medium lists, a loop works well; in production, you'd queue this)
    for (const sub of activeSubscribers) {
      try {
        const unsubscribeUrl = `${unsubscribeBaseUrl}?token=${sub.token}`;
        const emailHtml = getNewsletterTemplate(body.content, unsubscribeUrl);

        await transporter.sendMail({
          from: SMTP_FROM,
          to: sub.email,
          subject: body.subject,
          html: emailHtml,
        });

        sentCount++;
      } catch (err) {
        console.error(`[Mailer] Failed to send email to ${sub.email}:`, err);
        failedCount++;
      }
    }

    // Update campaign status
    campaign.status = failedCount === activeSubscribers.length ? "failed" : "sent";
    campaign.recipientCount = sentCount;
    campaign.sentAt = new Date();
    await campaign.save();

    return NextResponse.json({
      success: true,
      campaign,
      summary: {
        total: activeSubscribers.length,
        sent: sentCount,
        failed: failedCount,
      },
    });
  } catch (error: any) {
    console.error("[Newsletter API] Error sending newsletter:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
