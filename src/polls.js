"use strict";

Array.prototype.unique = function () {
	var a = this;
	return Array.from(new Set(a));
}

class PollsAPI {

	constructor(options) {
		var PollsAPI = this;

		PollsAPI.modules = {
			request: require('request')
		};

		// Setting up default params
		options = options || {};
		options.debug = options.debug || false;
		options.port = options.port || 3001;
		options.host = options.host || "localhost";
		// Setting up database params
		options.db = options.db || {};
		options.db.type = options.db.type || 'mongodb';
		options.db.host = options.db.host || 'localhost';
		options.db.username = options.db.username || 'root';
		options.db.password = options.db.password || '';
		options.db.table_prefix = options.db.table_prefix || 'poll';
		// Setting accounting database params
		options.accounting = options.accounting || {};
		PollsAPI._options = options;

		// Include DB library
		var PollsDB = require('./db');

		// Include User library
		var PollsUser = require('./user');

		PollsAPI.db = new PollsDB(PollsAPI, options.db);
		PollsAPI.user = new PollsUser(PollsAPI, options.accounting);
	}

	debug(msg) {
		if(this._options.debug) {
			console.log(msg);
		}
	}

	init(callback) {
		var PollsAPI = this;
		try {
			// Include express library
			var express = require('express');
			var api = new express();
		} catch(e) {
			this.debug('Error: Module "express" not found. Use `npm install express` command to fix this problem');
			process.exit(1);
		}
		try {
			api.listen(PollsAPI._options.port, PollsAPI._options.host);
			PollsAPI.api = api;
			this.debug("Express is now listenning port "+PollsAPI._options.port);
		} catch(e) {
			this.debug('Error: Module "express" can\'t open port '+PollsAPI._options.port);
			process.exit(1);
		}

		PollsAPI.db.connect(callback);
	}
}

module.exports.PollsAPI = PollsAPI;