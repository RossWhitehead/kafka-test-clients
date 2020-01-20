'use strict'

const Kafka = require('node-rdkafka')
require('dotenv').config()

const {
  BOOTSTRAP_SERVERS,
  TOPIC
} = process.env

function createConsumer(onData) {
	const consumer = new Kafka.KafkaConsumer(
		{
			'bootstrap.servers': BOOTSTRAP_SERVERS,
			'group.id': 'node-example-group-1'
		},
		{
			'auto.offset.reset': 'earliest'
		}
	)

	return new Promise((resolve, reject) => {
		consumer.on('ready', () => resolve(consumer)).on('data', onData)
		consumer.connect()
	})
}

async function consumerExample() {
	console.log(`Consuming records from ${TOPIC}`)

	let seen = 0

	const consumer = await createConsumer(
		({ key, value, partition, offset }) => {
			console.log(
				`Consumed record with key ${key} and value ${value} of partition ${partition} @ offset ${offset}. Updated total count to ${++seen}`
			)
		}
	)

	consumer.subscribe([TOPIC])
	consumer.consume()

	process.on('SIGINT', () => {
		console.log('\nDisconnecting consumer ...')
		consumer.disconnect()
	})
}

consumerExample().catch(err => {
	console.error(`Something went wrong:\n${err}`)
	process.exit(1)
})
