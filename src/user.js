Array.prototype.unique = function () {
	var a = this;
	return Array.from(new Set(a));
}

class User {

	constructor(api, options) {
		this.api = api;
		var User = this;
		
		User._options = options;

		switch(User._options.type) {
			case 'external': User.account = new ExternalUsers(User, options.api); break;
			default: User.account = new ExternalUsers(User, options.api);
		}
	}
}

class ExternalUsers {

	constructor(User, options) {
		var ExternalUsers = this;
		ExternalUsers.User = User;
		ExternalUsers.request = ExternalUsers.User.api.modules.request;

		// Setting up default params
		options = options || {};
		options.debug = options.debug || false;
		
		ExternalUsers._options = options;
	}

	getValueViaObjectUri(uri, obj) {
		if(uri.indexOf('.') == -1) {
			return obj[uri];
		} else {
			var uri2 = uri.split('.');
			var key = uri2.shift();
			uri2.join('.');
			var newObj = obj[key];
			return this.getValueViaObjectUri(uri2, newObj);
		}
	}

	insertFieldsIntoUri(fields, uri) {
		var keys = Object.keys(fields);
		for(var i = 0; i<keys.length; i++) {
			var what = '<'+keys[i]+'>';
			var change = fields[keys[i]];
			var re = new RegExp(what, 'g');
			uri = uri.replace(re, change);
		}
		return uri;
	}

	checkOk(result, rules) {
		var ExternalUsers = this;
		var keys = Object.keys(rules);
		var value;
		for(var i = 0; i<keys.length; i++) {
			value = ExternalUsers.getValueViaObjectUri(keys[i], result);
			if(value != rules[keys[i]]) return false;
		}
		return true;
	}

	runCommand(name, fields, callback) {
		var ExternalUsers = this;
		var commandObject = ExternalUsers._options.commands[name];
		var url = ExternalUsers._options.protocol + ExternalUsers._options.host + ':' + ExternalUsers._options.port + commandObject.url;
		var method = commandObject.method || "get";
		var data = {};
		if(url.indexOf('<') >= 0) {
			url = ExternalUsers.insertFieldsIntoUri(fields, url);
		}
		ExternalUsers.request({
			url: url,
			json: true,
			method: method,
			body: fields
		}, function (error, response, body) {
			if(error) {
				console.log(error);
				if(callback) callback(false, error);
			} else {
				var fail_msg = "";
				// Check the OK rule from config
				commandObject.result.ok = commandObject.result.ok || {};
				var requestResult = ExternalUsers.checkOk(body, commandObject.result.ok);
				if(requestResult) {
					ExternalUsers._logged = requestResult;
					// building an object to return
					var returnAray = commandObject.result.return || {};
					var keysReturn = Object.keys(returnAray);
					var returnObject = (keysReturn.length ? {} : null);
					for(var i = 0; i<Object.keys(keysReturn).length; i++) {
						returnObject[keysReturn[i]] = ExternalUsers.getValueViaObjectUri(returnAray[keysReturn[i]], body);
					}
				} else {
					if(commandObject.result.fail_msg) {
						var key = commandObject.result.fail_msg;
						fail_msg = body[key];
					}
				}
				if(returnObject) requestResult = returnObject;
				if(callback) callback(requestResult, fail_msg);
			}
		});
	}
}

module.exports = User;