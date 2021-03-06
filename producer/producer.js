'use strict'

const Kafka = require('node-rdkafka')
require('dotenv').config()
const express = require('express')
const app = express()

const {
	BOOTSTRAP_SERVERS,
	TOPIC,
	PARTITIONS,
  REPLICATION_FACTOR,
  PORT
} = process.env

const ERR_TOPIC_ALREADY_EXISTS = 36

app.post('/produce', (req, res) => {
  const route = req.route
  console.log({route})
  produceExample()
    .then(() => {
      res.send("10 messages produced")
    })
    .catch((err) => {
      console.error(`Something went wrong:\n${err}`)
      res.status(500)
      res.send(`Something went wrong:\n${err}`)
    })
})

app.listen(PORT, () => console.log(`Listening on port ${PORT}`))

function ensureTopicExists() {
  const adminClient = Kafka.AdminClient.create({
    'bootstrap.servers': BOOTSTRAP_SERVERS
  })

  return new Promise((resolve, reject) => {
    adminClient.createTopic({
      topic: TOPIC,
      num_partitions: parseInt(PARTITIONS),
      replication_factor: parseInt(REPLICATION_FACTOR)
    }, (err) => {
      if (!err) {
        console.log(`Created topic ${TOPIC}`)
        return resolve()
      }

      if (err.code === ERR_TOPIC_ALREADY_EXISTS) {
        return resolve()
      }

      return reject(err)
    })
  })
}

function createProducer(onDeliveryReport) {
  const producer = new Kafka.Producer({
		'bootstrap.servers': BOOTSTRAP_SERVERS,
		dr_msg_cb: true
  })

  return new Promise((resolve, reject) => {
    producer
      .on('ready', () => resolve(producer))
      .on('delivery-report', onDeliveryReport)
      .on('event.error', (err) => {
        console.warn('event.error', err)
        reject(err)
      })
    producer.connect()
  })
}

async function produceExample() {
  await ensureTopicExists()

  const producer = await createProducer((err, report) => {
    if (err) {
      console.warn('Error producing', err)
    } else {
      const {topic, partition, value} = report
      console.log(`Successfully produced record to topic "${topic}" partition ${partition} ${value}`)
    }
  })

  for (let idx = 0; idx < 10; ++idx) {
    const key = 'ross'
    const value = Buffer.from(JSON.stringify({ count: idx }))
    producer.produce(TOPIC, -1, value, key)
  }

  producer.flush(10000, () => {
    producer.disconnect()
  })
}

