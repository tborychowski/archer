#!/usr/bin/env node

const Msg = require('node-msg');
const {login, traffic, formatBytes} = require('./lib/archer-client');

login()
	.then(traffic)
	.then(res => {
		const sum = res.reduce((p, n) => p + n.bytes, 0);
		const total = formatBytes(sum);
		const table = res.map(i => [i.name, i.ip, i.size]);
		table.unshift(['Name', 'IP', 'Size']);
		table.push(['', '', '---------'], ['', '', total]);
		Msg.table(table);
	});

