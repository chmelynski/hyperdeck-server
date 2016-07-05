<html>
<body>

<label for="inputFile">Select a ZIP File:</label>
<input id="inputFile" type="file" onchange="inputFile_Changed()"></input><br />

<label for="ulFilesContained">Files contained in ZIP file:</label><br />
<ul id="ulFilesContained"></ul><br />

<label for="textAreaFileSelectedAsText">File Selected as Text:</label><br />
<textarea id="textAreaFileSelectedAsText" rows="8"></textarea><br />

<script type="text/javascript" src="jszip.js"></script>

<script type="text/javascript" >

function inputFile_Changed()
{
	var inputFile = document.getElementById("inputFile");
	var zipFileToLoad = inputFile.files[0];

	var fileReader = new FileReader();

	fileReader.onload = function(fileLoadedEvent) 
	{
		var zipFileLoaded = new JSZip(fileLoadedEvent.target.result);

		var ulFilesContained = document.getElementById("ulFilesContained");

		for (var nameOfFileContainedInZipFile in zipFileLoaded.files)
		{
			var fileContainedInZipFile = zipFileLoaded.files[nameOfFileContainedInZipFile];

			var linkFileContained = document.createElement("a");
			linkFileContained.innerHTML = nameOfFileContainedInZipFile;
			linkFileContained.href = "#";
			linkFileContained.file = fileContainedInZipFile;
			linkFileContained.onclick = displayFileAsText;
			
			var liFileContained = document.createElement("li");
			liFileContained.appendChild(linkFileContained);
			
			ulFilesContained.appendChild(liFileContained);
		}

	};

	fileReader.readAsArrayBuffer(zipFileToLoad);
}

function displayFileAsText(event)
{
	var textAreaFileSelectedAsText = document.getElementById("textAreaFileSelectedAsText");
	textAreaFileSelectedAsText.innerHTML = event.target.file.asText();
}

</script>
</body>
</html>

