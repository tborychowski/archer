#!/usr/bin/env node

const Msg = require('node-msg');
const chalk = require('chalk');
const {login, network, formatBytes} = require('./lib/archer-client');

async function stats () {
	const loggedIn = await login();
	if (!loggedIn) return;
	const res = await network();
	const sum = res.reduce((p, n) => p + n.bytes, 0);
	const total = formatBytes(sum);
	const table = res.map(i => [chalk.yellow(i.name), i.ip, i.size]);
	table.unshift(['Name', 'IP', 'Size']);
	table.push(['', '', '---------'], ['', '', chalk.cyan(total)]);
	Msg.table(table);
}

async function start () {
	const loggedIn = await login();
	if (!loggedIn) return;
	const res = await network();
	res.sort((a, b) => a.name.localeCompare(b.name));
	const table = res.map(i => [chalk.yellow(i.name), i.ip, chalk.grey(i.mac)]);
	table.unshift(['Name', 'IP', 'Mac']);
	Msg.table(table);
}


start();

