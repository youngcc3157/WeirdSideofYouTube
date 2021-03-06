// Invoke 'strict' JavaScript mode
'use strict';

var mongoose = require('mongoose');
var Video = require('../models/video');
var Counter = require('../models/counters');
var Chance = require('chance');
var chance = new Chance();

// internal function for adding a video to the database
// vid is a string representing the youtube video ID
exports.addVideo = function(vid, callback)
{
    Counter.findByIdAndUpdate('videos', {$inc: { seq: 1} }, {new: true, upsert: true, setDefaultsOnInsert: true}, function(error, counter)   {
        if(error)
            return next(error);
        Video.create({ 'videoID' : vid, '_id': counter.seq }, function(err, vid){
			if(err)
	        	console.log(err);
	        callback(err,vid);
		});
    });
}

// internal function for removing a video by youtube ID
exports.removeVideo = function(vidID)
{
	Video.findOne({'videoID': vidID}, function (error, video){
		var __id = video._id;
		Counter.findById('videos', function(error, counter)
		{
			Video.findOne({'_id': counter.seq}, function (error, _video){
				video.remove();
				Video.create({ 'videoID' : _video.videoID, '_id': __id}, function(err, vid){
					_video.remove();
					counter.seq = counter.seq - 1;
					counter.save();
				});
			});	
		});
	});
}

// internal function for getting a random youtube ID.
// the callback function expects an error as the first argument, and the video ID as the second
exports.randomVideoID = function(callback)
{
	Counter.findById('videos', function (err, count) {
		var rand = chance.integer({min: 1, max: (count.seq-1)});;
		Video.findByIdAndUpdate(rand, {$inc: { views: 1} }, function (err, myDocument) {
			callback(err, myDocument.videoID);
		});
	}); 
};

// Handler for a GET request for a random video.
// sends the client a JSON object with the youtube video ID
exports.getRandomVid = function(req, res) {
	exports.randomVideoID(function(err, vidID)
	{
		res.json({'vidID' : vidID});
	});
};

// handler for a GET request for a range of videos
// sends a JSON object containing the range of youtube video IDs
exports.getVidRange = function(req, res) {
  var start_id = parseInt(req.params.start);
  var end_id = parseInt(req.params.end);
  Counter.findById('videos', function(error, counter)
	{
		var smallestID = 1;
		var largestID = counter.seq;
		if(start_id < smallestID)
    {
      start_id = smallestID;
    }
    if(end_id < start_id)
    {
      end_id = start_id;
    }
    var len = end_id - start_id + 1;
    if(len > 50)
    {
      len = 50;
    }
    Video.find({_id: {$gte: start_id }}, {'videoID':1, 'views':1}).limit(len).lean().exec(function (err, docs) {
    	res.json(docs);
    });
	});
};
