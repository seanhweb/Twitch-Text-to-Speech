const statusElement = document.querySelector('#status'); 

document.getElementById("listenBtn").addEventListener("click", function(event){
  event.preventDefault()
});

document.getElementById("tipBtn").addEventListener("click", function(event){
  event.preventDefault()
});

function speakMessage(message) {
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.volume = document.querySelector('#volume').value;
  window.speechSynthesis.speak(utterance);
  document.getElementById("audiotrack").pause();
  document.getElementById("audiotrack").currentTime = 0;
}

function speakMessagePolly(message, tags) {
  window.speechSynthesis.cancel(); 
  let uuid = self.crypto.randomUUID();
  const sendme = {
      message: message, 
      id: uuid, 
      user: tags['display-name']
  };
   const http = new XMLHttpRequest(); 
   const url = 'https://wb971sijqi.execute-api.us-west-1.amazonaws.com/speech';
   http.open("POST", url);
   http.setRequestHeader("Content-Type", "application/json");
   http.send(JSON.stringify(sendme));
   http.onreadystatechange = function() {
    if (http.readyState == XMLHttpRequest.DONE) {
        var response = JSON.parse(http.responseText); 
        var audiourl = response.url; 
        document.getElementById("audiotrack").volume = document.querySelector('#volume').value; 
        document.getElementById("audiotrack").src = audiourl; 
        document.getElementById("audiotrack").play();
    }
   } 
}

function writeMessage(tags,message) {
  let div = document.createElement('div'); 
  div.className = "single-message";

  let chatter = document.createElement('span'); 
  chatter.className= "chatter";
  chatter.style.color = tags['color'];
  chatter.textContent = tags['display-name']+': ';

  let chatMessage = document.createElement('span'); 
  chatMessage.className= "messageContent"; 
  chatMessage.textContent = message; 

  div.appendChild(chatter); 
  div.appendChild(chatMessage); 

  document.getElementById("messages").appendChild(div); 
}

function startListening() {
  const channel = document.querySelector("#channelname").value;
  if(isAZ(channel) == false) {
    statusElement.className = "alert alert-danger"; 
    statusElement.textContent = "Please enter a valid channel name."; 
  }
  else {
    const client = new tmi.Client({
      connection: {
        secure: true,
        reconnect: true,
      },
      channels: [channel],
    });

    document.getElementById("listenBtn").textContent = "Listening...";
    document.getElementById("listenBtn").disabled = true; 
    statusElement.className = "alert alert-success"; 

    client.connect().then(() => {
      statusElement.textContent = `Connected to twitch. Listening for messages in ${channel}...`;
    });

    client.on('message', (wat, tags, message, self) => {
      const badges = tags.badges || {};
      const isBroadcaster = badges.broadcaster;
      const isMod = badges.moderator;

      if(document.getElementById('modsonly').checked) {
        if(isBroadcaster || isMod ) {
          writeMessage(tags, message); 
          if(!document.getElementById('hqspeech').checked) {
            speakMessage(message); 
          }
          if(document.getElementById('hqspeech').checked) {
            speakMessagePolly(message,tags); 
          }
        }
      }
      else {
        writeMessage(tags, message); 
        if(!document.getElementById('hqspeech').checked) {
          speakMessage(message); 
        }
        if(document.getElementById('hqspeech').checked) {
          speakMessagePolly(message,tags); 
        }
      }
      console.log(tags); 
    });
  }
}

function startCheckout() {
  var amount = document.querySelector("#tipAmount").value * 100; 

  const sendme = {
    amount: amount
  };

  const http = new XMLHttpRequest(); 
  const url = 'https://dvoiexmle5x3yytqbnix3fwscm0pvpxz.lambda-url.us-west-1.on.aws/';

  http.open("POST", url);
  http.setRequestHeader("Content-Type", "application/json");
  http.send(JSON.stringify(sendme));
  document.getElementById("tipBtn").disabled = true; 
  document.getElementById("tipBtn").innerHTML = '<i class="fa-solid fa-spinner fa-spin-pulse"></i>';
  http.onreadystatechange = function() {
    if (http.readyState == XMLHttpRequest.DONE) {
        var response = JSON.parse(http.responseText); 
        var url = response.url; 
        window.location.href = url; 
    }
  }
}

function volumeChange() {
  var currentVolume = document.querySelector('#volume').value;
  document.getElementById("audiotrack").volume = currentVolume;
}

function isAZ(string) {
  var res = string.match(/^(#)?[a-zA-Z0-9_]{4,25}$/); 
  return (res !== null)
}

function valueCheck() {
  let theValue = document.getElementById('tipAmount');
  if (theValue.value < 0) {
    theValue.value = Math.abs(theValue.value); 
  }
  if(theValue.value <= .50) {
    theValue.value = 1; 
  }
}