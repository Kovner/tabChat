var messageArray = [];
var marksArray = [];
var marksCounter = 0;
var filterArray = [];
var filterCounter = 0;
var viz;

$(function() {
	// Start with nothing showing. Then when client connects to socket give
	// an input box for their name
	$("#messages").hide();
	$("#input").hide();
	$("#nameBox").hide();


	var socket = io.connect();

	socket.on('connect', function() {
		$("#connecting").hide();
		var $nameBox = $("#nameBox");
		$nameBox.show();
		$nameBox.focus();
		$nameBox.keypress(function(key) {
			// Check if the hit 'enter' If they did, send the name to the Server
			// and unhide the main UI.
			if(key.which === 13 && $nameBox.val().length > 0) {
				socket.emit('name', $nameBox.val());
				$nameBox.hide();
				$("#messages").show();
				$("#input").show();
				//Put 10 empty message divs inside the message div
				for(var i = 0; i < 10; i++) {
					messageArray[i] = $('<div class="blank"></div>');
					$("#messages").append(messageArray[i]);
				}
				//Load the Tableau viz
				var sheetDiv = document.getElementById("vizDiv");
				var sheetURL = "http://public.tableau.com/views/CerebralSales/Dashboard1?:showVizHome=no";
				var sheetOptions = {
					hideTabs: true,
					hideToolbar: true,
					width: "600px",
					height: "560px",
					onFirstInteractive: function() {
					}
				};
				viz = new tableauSoftware.Viz(sheetDiv, sheetURL, sheetOptions);
				viz.addEventListener('marksselection', function(event) {
					event.getMarksAsync().then(function(marks) {
						if(marks.length > 0) {
							sheet = event.getWorksheet().getName();
							socket.emit('clientMarks', {marks: marks, sheet: sheet});
						}
					});
				});
				viz.addEventListener('filterchange', function(event) {
					var sheet = viz.getWorkbook().getActiveSheet().getWorksheets().get("Profit Map");
					sheet.getFiltersAsync().then(function(filters) {
						var filtersArray = filters[2].getAppliedValues();
						var genreArray = [];
						var i = 0;
						for(i = 0; i < filtersArray.length; i++) {
							genreArray[i] = filtersArray[i].value;
						}
						socket.emit('clientFilter', {genres: genreArray});
					});
				});
			}
		});
	});

	socket.on('serverMessage', function(message) {
		addMessage(message);
	});
	var lastData;
	socket.on('serverMarks', function(data) {
		//Because selecting marks on a new sheet activates the markselection event twice
		//we need to check if we've already seen this selection.
		if(JSON.stringify(data) === JSON.stringify(lastData)) {
			return;
		}

		lastData = data;
		marksArray[marksCounter] = data;
		//SocketIO converted our tableauServer.Mark objects into generic Objects.
		//Let's convert them back to Mark Objects
		var i;
		for(i = 0; i < marksArray[marksCounter].marks.length; i++) {
			var oldMark = marksArray[marksCounter].marks[i];
			var newMark = new tableauSoftware.Mark();
			newMark._impl._collection = oldMark._impl._collection;
			newMark._impl._tupleId = oldMark._impl._tupleId;
			marksArray[marksCounter].marks[i] = newMark;
		}
		var message = data.user + " selected " +
			"<button class='btn btn-link' onclick='selectMarks(" + marksCounter + ")'>" +
			data.marks.length + " marks on " + data.sheet + "</button>";
		marksCounter += 1;
		addMessage(message);
	});
	var lastFilter;
	socket.on('serverFilter', function(data) {
		//Because the filter applies to 2 sheets, this fires twice for every filter.
		//Check if it's the same as the last one.
		if(JSON.stringify(data) === JSON.stringify(lastFilter)) {
			return;
		}
		lastFilter = data;
		filterArray[filterCounter] = data;
		var message = data.user +
			" <button class='btn btn-link' onclick='changeFilter(" + filterCounter + ")'>" +
			" filtered to " + data.genres.length + " genres.</button>";
		filterCounter += 1;
		addMessage(message);
	});

	var $inputBox = $("#input");
	$inputBox.keypress(function(key) {
		//Check if the hit 'enter'
		if(key.which === 13 && $inputBox.val().length > 0) {
			socket.emit('clientMessage', $inputBox.val());
			$inputBox.val('');
		}
	});

	function addMessage(message) {
		//Move all of the message htmls up one then put the new message in the last
		for(var i = 0; i < 9; i++) {
			messageArray[i].html(messageArray[i+1].html());
			if(messageArray[i].html().length > 1) {
				messageArray[i].removeClass("blank").addClass("well well-sm message");
			}
		}
		messageArray[9].html(message);
		messageArray[9].removeClass("blank").addClass("well well-sm message");
	}

});


var selectMarks = function(i) {
	var sheet = viz.getWorkbook().getActiveSheet().getWorksheets().get(marksArray[i].sheet);
	sheet.selectMarksAsync(marksArray[i].marks, "REPLACE");
};

var changeFilter = function(i) {
	var sheet = viz.getWorkbook().getActiveSheet().getWorksheets().get("Profit Map");
	sheet.applyFilterAsync("Genre", filterArray[i].genres, "REPLACE");
};