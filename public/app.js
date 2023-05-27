document.getElementById("listenBtn").addEventListener("click", function(event){
  event.preventDefault()
});

document.getElementById("tipBtn").addEventListener("click", function(event){
  event.preventDefault()
});


class Validator {
  /*
    * Determines whether the channel name is valid
    * param string is the channel name
  */
  isAZ(string) {
    var res = string.match(/^(#)?[a-zA-Z0-9_]{4,25}$/); 
    return (res !== null)
  }
}

class Tip {
  /*
    * Checks the value in the "Tip" section and makes sure it is a minimum of $1. 
    * Also makes sure the value is not negative
    * Stripe does not allow less than 50c. 
  */
  valueCheck() {
    let theValue = document.getElementById('tipAmount');
    if (theValue.value < 0) {
      theValue.value = Math.abs(theValue.value); 
    }
    if(theValue.value <= .50) {
      theValue.value = 1; 
    }
  }
  startCheckout() {
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
}

class TTS {
  /*
    * On Construct
    * Speak message, determine whether polly is checked 
    * Write message regardless
  */
  constructor(message, tags) {
    this.speak(message, tags, this.speechType(), this.announceFlag());
    this.write(message, tags); 
  }
  /*
    * Determines whether to use Polly or browser based speech
  */
  speechType() {
    if(!document.getElementById('hqspeech').checked) {
      return 'browser';
    }
    if(document.getElementById('hqspeech').checked) {
      return 'polly';
    }
  }
  /*
    * Speaks a message
    * param message is the tmi.js twitch message
    * param tags are the tags sent through tmi.js
    * param type is speaking through polly or browser based
  */
  announceFlag() {
    if(document.getElementById('announcechatter').checked) {
      return true; 
    }
    if(!document.getElementById('announcechatter').checked) {
      return false; 
    }    
  }

  speak(message, tags, type, announceflag) {
    if(type == 'browser') {
      if(announceflag == true) {
        var chatter = tags['display-name']; 
        message = chatter+" says "+message;
      }
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.volume = document.querySelector('#volume').value;

      const voices = speechSynthesis.getVoices();
      var voiceSelect = document.getElementById('voiceSelect');
      const selectedOption = voiceSelect.selectedOptions[0].getAttribute("data-name");
      for (let i = 0; i < voices.length; i++) {
        if (voices[i].name === selectedOption) {
          utterance.voice = voices[i];
        }
      }

      window.speechSynthesis.speak(utterance);
      document.getElementById("audiotrack").pause();
      document.getElementById("audiotrack").currentTime = 0;
    }
    if(type == 'polly') {
      if(announceflag == true) {
        var chatter = tags['display-name']; 
        message = chatter+" says "+message;
      }      
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
  }
  /*
    * write a message to the browser
    * param message is the tmi.js twitch message
    * param tags are the tags sent through tmi.js
  */
  write(message, tags) {
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
}
  /*
    * Starts routing the request
    * Validates the channel name 
    * if valid, starts listening for messages
  */
function startListening() {
  var validator = new Validator;
  const statusElement = document.querySelector('#status'); 
  const channel = document.querySelector("#channelname").value;
  if(validator.isAZ(channel) == false) {
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
          new TTS(message, tags);
        }
      }
      else {
        new TTS(message, tags); 
      }
    });
  }
}

/*
  * Changes the volume of Polly speech. 
*/
function volumeChange() {
  var currentVolume = document.querySelector('#volume').value;
  document.getElementById("audiotrack").volume = currentVolume;
}
/*
  * Starts stripe checkout
*/
function startCheckout() {
  var tipHandler = new Tip; 
  tipHandler.startCheckout(); 
}
/*
  * Checks the Tip value
*/
function valueCheck() {
  var tipHandler = new Tip; 
  tipHandler.valueCheck(); 
}

function populateVoiceList() {
  if (typeof speechSynthesis === "undefined") {
    return;
  }
  const voices = speechSynthesis.getVoices();
  for (let i = 0; i < voices.length; i++) {
    const option = document.createElement("option");
    option.textContent = `${voices[i].name} (${voices[i].lang})`;

    option.setAttribute("data-lang", voices[i].lang);
    option.setAttribute("data-name", voices[i].name);
    document.getElementById("voiceSelect").appendChild(option);
  }
}

function exportSettings() {
  var channelName = document.querySelector("#channelname").value;
  document.getElementById('settingsURL').value = "https://twitchtts.net?channelname="+channelName;
  if(channelName == "") {
    alert("You do not have a channel name entered. Please enter a channel name to generate a URL.");
    document.getElementById('settingsURL').value = "";
  }
}

function copyURL() {
  var copyText = document.getElementById('settingsURL');
  copyText.select(); 
  navigator.clipboard.writeText(copyText.value);
  alert("Copied URL to clipboard.");
}

function skipMessage() {
  //stops Polly Speech
  document.getElementById("audiotrack").pause();
  document.getElementById("audiotrack").currentTime = 0;

  //stops Browser speech
  window.speechSynthesis.cancel();
}

/*
  * If Channel Name is in the URL, autostart listening
*/

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
if(urlParams.get('channelname') !== null) {
  document.querySelector("#channelname").value = urlParams.get('channelname');
  document.getElementById("hqspeech").checked = true;
  startListening();
};

window.speechSynthesis.onvoiceschanged = function() {
  populateVoiceList();
}
