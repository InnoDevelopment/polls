var PollsAPI = require('./../src/polls').PollsAPI;
var params = require('./config.json');

var Polls = new PollsAPI(params);

function queryProcess(Polls) {
	var api = Polls.api;
	api.get('/', function(request, response) {

		/* For MongoDB */
		var pollsCollection = Polls.db.connection.collection('polls');

		response.json({
			data: "rows"
		});

		/* For MySQL */
		// Polls.db.connection.query('SELECT user_name FROM user;', function(err, rows) {
		// 	response.json({
		// 		data: rows
		// 	});
		// });
	});
}

Polls.init(function() {
	console.log("API is ready to use!");
	queryProcess(Polls);
});