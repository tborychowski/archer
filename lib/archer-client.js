const chalk = require('chalk');
const req = require('request-promise-native');
const encrypt = require('./encrypt');
const config = require('../config.json');

let Cookie, stok;

const getUrl = path => `${config.baseURL}/cgi-bin/luci/;stok=${stok || ''}${path}`;
const error = msg => console.error('\n', chalk.red('Error: '), msg);

function formatBytes (bytes) {
	if (bytes == 0) return '0 Bytes';
	const k = 1024,
		sizes = ['Bytes', 'KB', 'MB', 'GB'],
		i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed()) + ' ' + sizes[i];
}

function post (path, form = {}, resolveWithFullResponse = false) {
	return req
		.post(getUrl(path), {
			headers: { 'Content-type': 'application/x-www-form-urlencoded', Cookie },
			form,
			resolveWithFullResponse,
			timeout: 3000,
			json: true,
		})
		.catch(() => {});
}

async function login () {
	const loginUrl = '/login?form=login';

	const res = await post(loginUrl, { operation: 'read' });
	if (!res) {
		error('Archer router not reachable.');
		return false;
	}

	const params = res && res.data && res.data.password;
	const password = encrypt(config.password, params);
	const username = config.username;

	const loginRes = await post(loginUrl, { operation: 'login', username, password }, true);
	if (!loginRes) {
		error('Login problem. Check username and password in config.');
		return false;
	}

	stok = loginRes.body.data.stok;
	Cookie = loginRes.headers['set-cookie'][0];
	return true;
}

function _traffic () {
	return post('/admin/traffic?form=lists', { operation: 'load' })
		.then(res  => res.data)
		.then(groupDevices);
}

function traffic () {
	if (Cookie) return _traffic().then(mapDevices);
}


function _network () {
	return post('/admin/dhcps?form=client', { operation: 'load' }).then(res  => res.data);
}

function network () {
	if (Cookie)	return _network().then(mapDevices);
}


function all () {
	return Promise.all([_network(), _traffic()]).then(mergeLists2).then(mapDevices);
}

// function devices () {
// 	if (Cookie) return req.post('/admin/dhcps?form=client', { operation: 'load' });
// }

function findDeviceByMac (mac) {
	mac = mac.toUpperCase();
	const dev = config.devicemap.find(d => d.mac === mac);
	return dev || {};
}

function mergeLists ([netList, trafficList]) {
	return netList.map(item => {
		const mac = item.macaddr.toLowerCase();
		const items = trafficList.filter(ti => ti.mac === mac);
		if (items.length > 1) {
			items[0].total_byte = items.reduce((p, c) => p += c.total_byte, 0);
		}
		if (items.length) item.total_byte = items[0].total_byte;
		return item;
	});
}

function mergeLists2 ([netList, trafficList]) {
	return trafficList.map(item => {
		const mac = item.mac.toUpperCase();
		const items = netList.filter(ti => ti.macaddr === mac);
		if (items.length) item.leasetime = items[0].leasetime;
		return item;
	});
}

function mapDevices (list) {
	list = list.map(d => {
		const ip = (d.ip || d.ipaddr).split('/')[0];
		const dev = findDeviceByMac(d.mac || d.macaddr);
		const name = dev.name || 'unknown device';
		const icon = dev.icon;
		const mac = d.mac || d.macaddr;
		const bytes = d.total_byte || 0;
		const size = formatBytes(bytes);
		const time = d.leasetime || '-';
		return { name, ip, size, mac, bytes, time, icon };
	});
	list.sort((a, b) => b.bytes - a.bytes);
	return list;
}

function groupDevices (list) {
	const newList = [];
	let macs = list.map(item => item.mac);
	macs = [...new Set(macs)];		// unique
	macs.forEach(mac  => {
		const items = list.filter(item => item.mac === mac);
		if (items.length > 1) {
			items[0].total_byte = items.reduce((p, c) => p += c.total_byte, 0);
		}
		newList.push(items[0]);
	});
	return newList;
}


module.exports = {
	login,
	network,
	traffic,
	all,
	// devices,
	// formatBytes,
};
