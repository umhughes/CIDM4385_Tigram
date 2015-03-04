var args = arguments[0] || {};

//this captures the event
OS_IOS && $.cameraButton.addEventListener("click", function(_event) {
	$.cameraButtonClicked(_event);
});

//event handlers

/*
 * In this code, we retrieve a picture and the event.media object holding the picture
 * taken by the user.  We need to place the image into a table view according to the wireframes
 * we worked up.  We do this by adding items to a row, then inserting the row into the table view
 *
 * see: http://docs.appcelerator.com/titanium/latest/#!/guide/TableViews
 */
$.cameraButtonClicked = function(_event) {
	alert("user clicked the camera button");

	var photoSource = Titanium.Media.getIsCameraSupported() ? Titanium.Media.showCamera : Titanium.Media.openPhotoGallery;

	//photosource is now a variable representing one of the methods above:
	//Titanium.Media.showCamera OR Titanium.Media.openPhotoGallery
	//the constructed object is the expected argument to that method
	//thus, the code below is a call to that method
	photoSource({
		success : function(event) {
			//seonc argument is the callback
			processImage(event.media, function(processResponse) {

				if(processResponse.success){
					//create a row
					var row = Alloy.createController("feedRow", processResponse.model);
	
					//add the controller view, which is a row to the table
					if ($.feedTable.getData().length === 0) {
						$.feedTable.setData([]);
						$.feedTable.appendRow(row.getView(), true);
					} else {
						$.feedTable.insertRowBefore(0, row.getView(), true);
					}
	
					//photoObject = photoResp;					
				} else {
					alert('Error saving photo ' + processResponse.message);					
				}

			});
		},
		cancel : function() {
			//called when the user cancels taking a picture
		},
		error : function(error) {
			//display alert on error
			if (error.code == Titanium.Media.NO_CAMERA) {
				alert("Please run this test on a device");
			} else {
				alert("Unexpected error" + error.code);
			}
		},
		saveToPhotoGallery : false,
		allowEditing : true,
		//only allow for photos, no video
		mediaTypes : [Ti.Media.MEDIA_TYPE_PHOTO]
	});
};

/*
function processImage(_mediaObject, _callback){
//we are not yet integrating with ACS, so we fake it
var photoObject = {
image: _mediaObject,
title: "Sample Photo " + new Date()
};
//return the object to the caller
_callback(photoObject);
}*/

/**
 *
 * @param {Object} _mediaObject object from the camera
 * @param {Function} _callback where to call when the function is completed
 */
function processImage(_mediaObject, _callback) {
	var parameters = {
		"photo" : _mediaObject,
		"title" : "Sample Photo " + new Date(),
		"photo_sizes[preview]" : "200x200#",
		"photo_sizes[iphone]" : "320x320#",
		// We need this since we are showing the image immediately
		"photo_sync_sizes[]" : "preview"
	};

	var photo = Alloy.createModel('Photo', parameters);

	photo.save({}, {
		success : function(_model, _response) { 
			Ti.API.debug('success: ' + _model.toJSON());
			_callback({
				model : _model,
				message : null,
				success : true
			});
		},
		error : function(e) {
			
			Ti.API.error('error: ' + e.message);
			_callback({
				model : parameters,
				message : e.message,
				success : false
			});
		}
	});
}


/**
 * Loads photos from ACS
 */
function loadPhotos() {
	var rows = [];

	// creates or gets the global instance of photo collection
	var photos = Alloy.Collections.photo || Alloy.Collections.instance("Photo");

	// be sure we ignore profile photos;
	var where = {
		title : {
			"$exists" : true
		}
	};

	//this is a method in the model - from backbone.js
	photos.fetch({
		data : {
			order : '-created_at',
			where : where
		},
		success : function(model, response) {
			photos.each(function(photo) {
				var photoRow = Alloy.createController("feedRow", photo);
				rows.push(photoRow.getView());
			});
			$.feedTable.data = rows;
			Ti.API.info(JSON.stringify(data));
		},
		error : function(error) {
			alert('Error loading Feed ' + error.message);
			Ti.API.error(JSON.stringify(error));
		}
	});
}

//load photos on startup
$.initialize = function() {
  loadPhotos();
};