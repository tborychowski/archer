const Msg = require('node-msg');
const {login, traffic} = require('./lib/archer-client');

login()
	.then(traffic)
	.then(res => {
		const table = res.map(i => [i.name, i.ip, i.size]);
		table.unshift(['Name', 'IP', 'Size']);
		Msg.table(table);
	});

