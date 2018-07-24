#!/usr/bin/env node

const Msg = require('node-msg');
const chalk = require('chalk');
const {login, traffic, formatBytes} = require('./lib/archer-client');

async function start () {
	const loggedIn = await login();
	if (!loggedIn) return;

	const res = await traffic();
	const sum = res.reduce((p, n) => p + n.bytes, 0);
	const total = formatBytes(sum);
	const table = res.map(i => [chalk.yellow(i.name), chalk.grey(i.ip), i.size]);
	table.unshift(['Name', 'IP', 'Size']);
	table.push(['', '', '---------'], ['', '', chalk.cyan(total)]);
	Msg.table(table);
}


start();

