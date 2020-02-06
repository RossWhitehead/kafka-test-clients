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
	let seen = 0
	console.log(`\nCreating consumer ...`)
	const consumer = await createConsumer(
		({ key, value, partition, offset }) => {
			console.log(
				`Consumed record with key ${key} and value ${value} of partition ${partition} @ offset ${offset}. Updated total count to ${++seen}`
			)
		}
	)

	console.log(`\nSubscribing to ${TOPIC} ...`)
	consumer.subscribe([TOPIC])
	console.log(`\nConsuming ...`)
	consumer.consume()

	process.on('SIGINT', () => {
		console.log('\nDisconnecting consumer ...')
		consumer.disconnect()
	})
}

consumerExample()
	.then(() => {
		console.log(`\nConnected.`)
	})
  .catch (err => {
	console.error(`Something went wrong:\n${err}`)
	process.exit(1)
})
