var database = require('./config/db');
var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var api = require('./controllers/api');

mongoose.connect(database.url);
var Video = require('./models/video');

MongoClient.connect('mongodb://localhost/test', function(err, db) {
	db.collection('videos').find({}).forEach(function(doc) {
		console.log(doc["_id"]);
		api.addVideo(doc["vidID"], function(err, vid){
		if(err)
	    	console.log(err);
		else
			console.log('Video with ID ' + doc["vidID"] + ' submitted: ' + vid);
		});
	});
});