var sandbox = window.location.protocol + "//";
chunks = window.location.hostname.split('.');
if (chunks[0] == "www") {
  chunks[0] = "sandbox";
} else {
  chunks[0] = "griddl-" + chunks[0];
}
sandbox += chunks.join('.');

window.addEventListener('message', receiveMessage, false);

$(document).ready(function() {

  text = $('#frce').text();
  message = {'text': text, 'action': 'load'}
  $('iframe').load(function() {
    document.getElementById('results').contentWindow.postMessage(message, sandbox);
  });

});


function receiveMessage(event) {
  var origin = event.origin || event.originalEvent.origin;
  if (origin !== sandbox) {
    return false;
  }

  data = event.data
  if (data.action) {
    switch (data.action) {
      case 'save':
        save_passthru(data);
        break;
      case 'save_as':
        save_as_passthru(data);
        break;
      case 'nav':
        window.location.pathname = data.uri;
        break;
      case 'markDirty':
        $('title').text('*' + $('title').text());
        break;
      case 'markClean':
        $('title').text($('title').text().substring(1));
        break;
      case 'link':
        window.open(data.href, '_blank');
        break;
      default:
        jslog('problem in playground: ', data);
    }
  }
}


function save_as_passthru(payload) {
  $form = $('#saveAsForm');
  $form.find('#saveAsFormTextInput').val(payload.text);

  if (!validateName(payload.newname)) {
    return false;
  }
  
  $form.find("[name='newname']").val(payload.newname);

  $.post('/saveas',
         $form.serialize(),
         function(response) {
           if (response.success) {
             // processing happens on both sides of sandbox lol woof
             path = window.location.pathname
             newpath = path.slice(0, path.lastIndexOf('/')+1) + payload.newname;
             history.replaceState('workbook-rename', 'Renamed workbook', newpath);
             if (!response.redirect) {
               message = {'action': 'resolve', 'deferred': payload.deferred, 'success': true}
               $('iframe')[0].contentWindow.postMessage(message, sandbox);
             }
           } else {
             $.alert('Something went wrong. Please try again later.');
             $('iframe')[0].contentWindow.postMessage({'action': 'modal_close'}, sandbox);
           }
         },
         'json'
        );
}


function save_passthru(payload) {
  $form = $('#saveForm');
  $form.find("#saveFormTextInput").val(payload.text);
  $.post("/save",
         $form.serialize(),
         function(response) {
           if (response.success) {
             message = {'action': 'resolve', 'deferred': payload.deferred, 'success': true};
             $('iframe')[0].contentWindow.postMessage(message, sandbox);
           } else {
             $.alert(response.message);
           }
         },
         'json'
         );
}


function getSignedRequest(text, filename) {
	
  // filename needs to have a 'workbooks/' prefix
  
	var xhr = new XMLHttpRequest();
	xhr.open('GET', '/sign_s3?file_name=' + filename + '&file_type=text/plain');
	
	xhr.onreadystatechange = function() {
		
		if (xhr.readyState === 4)
		{
			if (xhr.status === 200)
			{
				console.log(xhr.responseText);
				var response = JSON.parse(xhr.responseText);
        			var blob = new Blob([text], {type:'text/plain'});
				uploadFile(blob, response);
			}
			else
			{
				console.log(xhr.responseText);
			}
		}
	};
	
	xhr.send();
}
function uploadFile(blob, s3Data) {
	
	// presigned_post = s3.generate_presigned_post(
	//   Bucket = S3_BUCKET,
	//   Key = file_name,
	//   Fields = {"acl": "public-read", "Content-Type": file_type},
	//   Conditions = [
	//     {"acl": "public-read"},
	//     {"Content-Type": file_type}
	//   ],
	//   ExpiresIn = 3600
	// )
	// 
	// s3Data = json.dumps({
	//   'data': presigned_post,
	//   'url': 'https://%s.s3.amazonaws.com/%s' % (S3_BUCKET, file_name)
	// })
	
	var xhr = new XMLHttpRequest();
	xhr.open('POST', s3Data.url);
	
	var postData = new FormData();
	for (key in s3Data.data) { postData.append(key, s3Data.data[key]); }
	postData.append('file', blob);
	
	xhr.onreadystatechange = function() {
		
		if (xhr.readyState === 4)
		{
			if (xhr.status === 200 || xhr.status === 204)
			{
				console.log(xhr.responseText);
			}
			else
			{
				console.log(xhr.responseText);
			}
		}
	};
	
	xhr.send(postData);
}


