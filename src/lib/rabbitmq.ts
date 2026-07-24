import amqp from "amqplib";

// AMQP protocol always runs on port 5672 (even if management UI is on 8080)
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";
export const AI_PIPELINE_QUEUE = "ai_blog_generation_queue";

export interface RabbitMQSendResult {
  success: boolean;
  offline?: boolean;
  error?: string;
}

export async function sendToRabbitMQ(
  queueName: string,
  payload: Record<string, any>
): Promise<RabbitMQSendResult> {
  let connection: any = null;
  let channel: any = null;

  try {
    // Attempt connection with a strict timeout so API calls don't hang if RabbitMQ is offline
    const connectionPromise = amqp.connect(RABBITMQ_URL);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("RabbitMQ connection timeout (service offline)")), 2000)
    );

    connection = await Promise.race([connectionPromise, timeoutPromise]);
    channel = await connection.createChannel();

    await channel.assertQueue(queueName, { durable: true });

    const messageBuffer = Buffer.from(JSON.stringify(payload));
    const sent = channel.sendToQueue(queueName, messageBuffer, { persistent: true });

    if (channel) await channel.close();
    if (connection) await connection.close();

    return { success: sent };
  } catch (err: any) {
    // Graceful offline handling: close connections if open
    try {
      if (channel) await channel.close();
      if (connection) await connection.close();
    } catch {
      // Silently ignore cleanup errors
    }

    console.warn(`[RabbitMQ Notice]: Unable to push to queue '${queueName}':`, err.message);
    return {
      success: false,
      offline: true,
      error: err.message || "RabbitMQ Docker container is not available or offline",
    };
  }
}
