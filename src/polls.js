"use strict";

Array.prototype.unique = function () {
	var a = this;
	return Array.from(new Set(a));
}

class PollsAPI {

	constructor(options) {
		var PollsAPI = this;

		// Setting up default params
		options = options || {};
		options.port = options.port || 3001;
		options.db = options.db || {};
		options.db.type = options.db.type || 'mongodb';
		options.db.host = options.db.host || 'localhost';
		options.db.username = options.db.username || 'root';
		options.db.password = options.db.password || '';
		PollsAPI._options = options;

		// Include DB library
		var PollsDB = require('./db');

		PollsAPI.db = new PollsDB(PollsAPI, options.db);
	}

	init(callback) {
		var PollsAPI = this;
		try {
			// Include express library
			var express = require('express');
			var api = new express();
		} catch(e) {
			console.log('Error: Module "express" not found. Use `npm install express` command to fix this problem');
			process.exit(1);
		}
		try {
			api.listen(PollsAPI._options.port);
			PollsAPI.api = api;
			console.log("Express is now listenning port "+PollsAPI._options.port);
		} catch(e) {
			console.log('Error: Module "express" can\'t open port '+PollsAPI._options.port);
			process.exit(1);
		}

		PollsAPI.db.connect(callback);
	}
}

module.exports.PollsAPI = PollsAPI;