const encrypt = require('./encrypt');
const req = require('request-promise-native');
const config = require('../config/config.json');
const deviceMap = require('../config/mac-map.json');

let Cookie, stok;


function formatBytes (bytes) {
	if (bytes == 0) return '0 Bytes';
	const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'], i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed()) + ' ' + sizes[i];
}

function getUrl (path) {
	return `${config.baseURL}/cgi-bin/luci/;stok=${stok || ''}${path}`;
}


function post (path, form = {}, raw = false) {
	return req.post(getUrl(path), {
		headers: { 'Content-type': 'application/x-www-form-urlencoded', Cookie },
		form,
		resolveWithFullResponse: raw,
		json: true
	});
}


function login () {
	const loginUrl = '/login?form=login';

	return post(loginUrl, { operation: 'read' })
		.then(res => {
			const params = res && res.data && res.data.password;
			const password = encrypt(config.password, params);
			const username = config.username;
			return post(loginUrl, { operation: 'login', username, password }, true);
		})
		.then(res => {
			stok = res.body.data.stok;
			Cookie = res.headers['set-cookie'][0];
		});
}


function traffic () {
	if (!Cookie) throw new Error('Authentication required!');
	return post('/admin/traffic?form=lists', { operation: 'load' }).then(mapDevices);
}


function devices () {
	return req.post('/admin/dhcps?form=client', { operation: 'load' });
}


function findDeviceByMac (mac) {
	mac = mac.toUpperCase();
	const dev = deviceMap.find(d => d.mac === mac);
	return dev && dev.name;
}


function mapDevices (res) {
	const list = res.data.map(d => {
		const ip = d.ip.split('/')[0];
		const name = findDeviceByMac(d.mac);
		const mac = d.mac;
		const bytes = d.total_byte;
		const size = formatBytes(bytes);
		return { name, ip, size, mac, bytes };
	});
	list.sort((a, b) => b.bytes - a.bytes);
	return list;
}


module.exports = {
	login,
	traffic,
	devices
};
