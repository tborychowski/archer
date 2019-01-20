#!/usr/bin/env node

const fs = require('fs');
const Msg = require('node-msg');
const chalk = require('chalk');
const {login, traffic} = require('./lib/archer-client');

const sortByName =  (a, b) => (''  + a.name).localeCompare('' + b.name);
const sortByIp =  (a, b) => (+a.ip.split('.').pop()) - (+b.ip.split('.').pop());


function saveToFile (data) {
	// data.sort(sortByIp);
	data.sort(sortByName);
	fs.writeFileSync('network.json', JSON.stringify(data, null, '    '));
}

function writeToConsole (data) {
	data.sort(sortByName);
	const table = data.map(i => [chalk.yellow(i.name), i.ip, chalk.grey(i.mac), i.size]);
	table.unshift(['Name', 'IP', 'Mac', 'Traffic']);
	Msg.table(table);
}

async function start () {
	const loggedIn = await login();
	if (!loggedIn) return;
	const res = await traffic();
	saveToFile(res);
	writeToConsole(res);
}


start();

