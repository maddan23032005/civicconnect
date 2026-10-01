import { Kafka, logLevel } from "kafkajs";
import { env } from "./env.js";

function client(clientId) {
  return new Kafka({
    clientId,
    brokers: [env.kafka.broker],
    ssl: env.kafka.ssl,
    sasl: {
      mechanism: env.kafka.mechanism,
      username: env.kafka.username,
      password: env.kafka.password,
    },
    connectionTimeout: 10000,
    requestTimeout: 30000,
    retry: { initialRetryTime: 300, retries: 8 },
    logLevel: logLevel.ERROR,
  });
}

export function createProducer(serviceName, log, metrics) {
  const producer = client(`${serviceName}-producer`).producer({
    allowAutoTopicCreation: false,
    idempotent: true,
  });

  let connected = false;

  return {
    async connect() {
      try {
        await producer.connect();
        connected = true;
        log.info("Kafka producer connected");
      } catch (err) {
        log.error({ err: err.message }, "Kafka producer failed to connect — events will be skipped");
      }
    },

    async publish(topic, payload, key = null) {
      if (!connected) {
        log.warn({ topic }, "Kafka offline, event dropped");
        return false;
      }
      try {
        await producer.send({
          topic,
          messages: [{
            key: key ? String(key) : null,
            value: JSON.stringify({
              ...payload,
              _meta: { service: serviceName, publishedAt: new Date().toISOString() },
            }),
          }],
        });
        metrics?.kafkaPublished.inc({ topic });
        log.debug({ topic }, "Event published");
        return true;
      } catch (err) {
        log.error({ err: err.message, topic }, "Kafka publish failed");
        return false;
      }
    },

    async disconnect() {
      if (connected) await producer.disconnect();
    },

    isConnected: () => connected,
  };
}

export function createConsumer(serviceName, groupId, log, metrics) {
  const consumer = client(`${serviceName}-consumer`).consumer({
    groupId,
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
  });

  return {
    async start(topics, handler) {
      try {
        await consumer.connect();
        for (const topic of topics) {
          await consumer.subscribe({ topic, fromBeginning: false });
        }
        log.info({ topics, groupId }, "Kafka consumer subscribed");

        await consumer.run({
          eachMessage: async ({ topic, partition, message }) => {
            try {
              const payload = JSON.parse(message.value.toString());
              metrics?.kafkaConsumed.inc({ topic });
              await handler(topic, payload, { partition, offset: message.offset });
            } catch (err) {
              log.error({ err: err.message, topic }, "Message handler failed");
            }
          },
        });
      } catch (err) {
        log.error({ err: err.message }, "Kafka consumer failed to start");
      }
    },

    async stop() {
      await consumer.disconnect();
    },
  };
}

export const TOPICS = env.kafka.topics;
