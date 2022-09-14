const  fetch = require("node-fetch");
const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express()
var cors = require('cors')
const port = 3002

app.use(cors())

var staticToken = '';

app.get('/login', async (req, res) => {
	let data = {
		userName: "acikgoz",
		password: "ta211uuO+",
		computerId: "asd",
		license: "asd"
	};

	await fetch('http://160.75.27.161:3000/api/v1/auth/login', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
		},
		body: JSON.stringify(data),
	})
		.then(response => response.json())
		.then(result => {
			staticToken = result.data.token
			console.log(result);
			res.send('Hello World!')
		});
})

app.get('/data', async (req, res) => {
	console.log(staticToken);
	await fetch('http://160.75.27.161:3000/api/v1/simulations/players?simulationId=1863', {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
			'Authorization': `Bearer ${staticToken}`
		}
	})
		.then(response => response.json())
		.then(result => {
			res.send(result);
		});
})

app.use('/api/v1/',
	createProxyMiddleware({ target: 'http://160.75.27.161:3000', changeOrigin: true })
);

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`)
})