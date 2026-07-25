import amqp from "amqplib";

// AMQP protocol / CloudAMQP connection URL
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
    // Attempt connection with timeout (8s to support CloudAMQP SSL/TLS handshake over WAN)
    const connectionPromise = amqp.connect(RABBITMQ_URL);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("RabbitMQ / CloudAMQP connection timeout (broker offline or unreachable)")), 8000)
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
      error: err.message || "RabbitMQ / CloudAMQP service is offline or unreachable",
    };
  }
}
