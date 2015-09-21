
// .zip reader
(function(obj) {

	var requestFileSystem = obj.webkitRequestFileSystem || obj.mozRequestFileSystem || obj.requestFileSystem;

	function onerror(message)
	{
		alert(message);
	}

	function createTempFile(callback)
	{
		var tmpFilename = "tmp.dat";
		
		requestFileSystem(TEMPORARY, 4 * 1024 * 1024 * 1024, function(filesystem)
		{
			function create() { filesystem.root.getFile(tmpFilename, { create : true }, function(zipFile) { callback(zipFile); }); }
			
			filesystem.root.getFile(tmpFilename, null, function(entry) { entry.remove(create, create); }, create);
		});
	}

	var model = (function()
	{
		var URL = obj.webkitURL || obj.mozURL || obj.URL;

		return
		{
			getEntries : function(file, onend) { zip.createReader(new zip.BlobReader(file), function(zipReader) { zipReader.getEntries(onend); }, onerror); },
			
			getEntryFile : function(entry, creationMethod, onend, onprogress)
			{
				var writer, zipFileEntry;
				
				function getData()
				{
					entry.getData(writer, function(blob) {
						var blobURL = creationMethod == "Blob" ? URL.createObjectURL(blob) : zipFileEntry.toURL();
						onend(blobURL);
					}, onprogress);
				}

				if (creationMethod == "Blob")
				{
					writer = new zip.BlobWriter();
					getData();
				}
				else
				{
					createTempFile(function(fileEntry)
					{
						zipFileEntry = fileEntry;
						writer = new zip.FileWriter(zipFileEntry);
						getData();
					});
				}
			}
		};
	})();

	(function() {
		var fileInput = document.getElementById("file-input");
		var unzipProgress = document.createElement("progress");
		var fileList = document.getElementById("file-list");
		var creationMethodInput = document.getElementById("creation-method-input");

		function download(entry, li, a) {
			model.getEntryFile(entry, creationMethodInput.value, function(blobURL) {
				var clickEvent = document.createEvent("MouseEvent");
				if (unzipProgress.parentNode)
					unzipProgress.parentNode.removeChild(unzipProgress);
				unzipProgress.value = 0;
				unzipProgress.max = 0;
				clickEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
				a.href = blobURL;
				a.download = entry.filename;
				a.dispatchEvent(clickEvent);
			}, function(current, total) {
				unzipProgress.value = current;
				unzipProgress.max = total;
				li.appendChild(unzipProgress);
			});
		}

		if (typeof requestFileSystem == "undefined")
			creationMethodInput.options.length = 1;
		fileInput.addEventListener('change', function() {
			fileInput.disabled = true;
			model.getEntries(fileInput.files[0], function(entries) {
				fileList.innerHTML = "";
				entries.forEach(function(entry) {
					var li = document.createElement("li");
					var a = document.createElement("a");
					a.textContent = entry.filename;
					a.href = "#";
					a.addEventListener("click", function(event) {
						if (!a.download) {
							download(entry, li, a);
							event.preventDefault();
							return false;
						}
					}, false);
					li.appendChild(a);
					fileList.appendChild(li);
				});
			});
		}, false);
	})();

})(this);


// .zip writer
(function(obj) {

	var requestFileSystem = obj.webkitRequestFileSystem || obj.mozRequestFileSystem || obj.requestFileSystem;

	function onerror(message) {
		alert(message);
	}

	function createTempFile(callback) {
		var tmpFilename = "tmp.zip";
		requestFileSystem(TEMPORARY, 4 * 1024 * 1024 * 1024, function(filesystem) {
			function create() {
				filesystem.root.getFile(tmpFilename, {
					create : true
				}, function(zipFile) {
					callback(zipFile);
				});
			}

			filesystem.root.getFile(tmpFilename, null, function(entry) {
				entry.remove(create, create);
			}, create);
		});
	}

	var model = (function() {
		var zipFileEntry, zipWriter, writer, creationMethod, URL = obj.webkitURL || obj.mozURL || obj.URL;

		return {
			setCreationMethod : function(method) {
				creationMethod = method;
			},
			addFiles : function addFiles(files, oninit, onadd, onprogress, onend) {
				var addIndex = 0;

				function nextFile() {
					var file = files[addIndex];
					onadd(file);
					zipWriter.add(file.name, new zip.BlobReader(file), function() {
						addIndex++;
						if (addIndex < files.length)
							nextFile();
						else
							onend();
					}, onprogress);
				}

				function createZipWriter() {
					zip.createWriter(writer, function(writer) {
						zipWriter = writer;
						oninit();
						nextFile();
					}, onerror);
				}

				if (zipWriter)
					nextFile();
				else if (creationMethod == "Blob") {
					writer = new zip.BlobWriter();
					createZipWriter();
				} else {
					createTempFile(function(fileEntry) {
						zipFileEntry = fileEntry;
						writer = new zip.FileWriter(zipFileEntry);
						createZipWriter();
					});
				}
			},
			getBlobURL : function(callback) {
				zipWriter.close(function(blob) {
					var blobURL = creationMethod == "Blob" ? URL.createObjectURL(blob) : zipFileEntry.toURL();
					callback(blobURL);
					zipWriter = null;
				});
			},
			getBlob : function(callback) {
				zipWriter.close(callback);
			}
		};
	})();

	(function() {
		var fileInput = document.getElementById("file-input");
		var zipProgress = document.createElement("progress");
		var downloadButton = document.getElementById("download-button");
		var fileList = document.getElementById("file-list");
		var filenameInput = document.getElementById("filename-input");
		var creationMethodInput = document.getElementById("creation-method-input");
		if (typeof requestFileSystem == "undefined")
			creationMethodInput.options.length = 1;
		model.setCreationMethod(creationMethodInput.value);
		fileInput.addEventListener('change', function() {
			fileInput.disabled = true;
			creationMethodInput.disabled = true;
			model.addFiles(fileInput.files, function() {
			}, function(file) {
				var li = document.createElement("li");
				zipProgress.value = 0;
				zipProgress.max = 0;
				li.textContent = file.name;
				li.appendChild(zipProgress);
				fileList.appendChild(li);
			}, function(current, total) {
				zipProgress.value = current;
				zipProgress.max = total;
			}, function() {
				if (zipProgress.parentNode)
					zipProgress.parentNode.removeChild(zipProgress);
				fileInput.value = "";
				fileInput.disabled = false;
			});
		}, false);
		creationMethodInput.addEventListener('change', function() {
			model.setCreationMethod(creationMethodInput.value);
		}, false);
		downloadButton.addEventListener("click", function(event) {
			var target = event.target, entry;
			if (!downloadButton.download) {
				if (typeof navigator.msSaveBlob == "function") {
					model.getBlob(function(blob) {
						navigator.msSaveBlob(blob, filenameInput.value);
					});
				} else {
					model.getBlobURL(function(blobURL) {
						var clickEvent;
						clickEvent = document.createEvent("MouseEvent");
						clickEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
						downloadButton.href = blobURL;
						downloadButton.download = filenameInput.value;
						downloadButton.dispatchEvent(clickEvent);
						creationMethodInput.disabled = false;
						fileList.innerHTML = "";
					});
					event.preventDefault();
					return false;
				}
			}
		}, false);

	})();

})(this);

