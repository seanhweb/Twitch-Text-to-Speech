document.getElementById("listenBtn").addEventListener("click", function(event){
  event.preventDefault()
});

let isListening = false;
let twitchClient = null;

class Validator {
  /*
    * Determines whether the channel name is valid
    * param string is the channel name
  */
  isAZ(string) {
    var res = string.match(/^(#)?[a-zA-Z0-9_]{4,25}$/); 
    return (res !== null)
  }
  isLink(string) { 
    var LINK_DETECTION_REGEX = string.match(/(([a-z]+:\/\/)?(([a-z0-9\-]+\.)+([a-z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel|local|internal))(:[0-9]{1,5})?(\/[a-z0-9_\-\.~]+)*(\/([a-z0-9_\-\.]*)(\?[a-z0-9+_\-\.%=&amp;]*)?)?(#[a-zA-Z0-9!$&'()*+.=-_~:@/?]*)?)(\s+|$)/gi);
    return (LINK_DETECTION_REGEX !== null)
  }
}



class TTS {
  /*
    * On Construct
    * Write message
  */
  constructor(message, tags) {
    this.speak(message, tags, this.speechType(), this.announceFlag());
    this.write(message, tags); 
  }
  speechType() {
    return 'browser';
  }
  /*
    * Speaks a message
    * param message is the tmi.js twitch message
    * param tags are the tags sent through tmi.js
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
    twitchClient = new tmi.Client({
      connection: {
        secure: true,
        reconnect: true,
      },
      channels: [channel],
    });

    document.getElementById("listenBtn").textContent = "Stop Listening";
    document.getElementById("listenBtn").disabled = false; 
    isListening = true;
    statusElement.className = "alert alert-success"; 

    twitchClient.connect().then(() => {
      statusElement.textContent = `Connected to twitch. Listening for messages in ${channel}...`;
    });

    twitchClient.on('message', (wat, tags, message, self) => {
      manageOptions(tags, message);
    });
  }
}

function manageOptions(tags, message) {
  var validator = new Validator; 
  const badges = tags.badges || {};
  const isBroadcaster = badges.broadcaster;
  const isMod = badges.moderator;

  const excludedchatterstextarea = document.getElementById('excluded-chatters');
  var lines = excludedchatterstextarea.value.split('\n');
  var lines = lines.map(line => line.toLowerCase());

  if(validator.isLink(message) == true) { 
    return; 
  }
  if(document.getElementById('nocommands').checked && message.startsWith("!")) {
    return;
  }
  if(document.getElementById('modsonly').checked) {
    if(!badges.moderator) {
      return;
    }
    else {
      new TTS(message, tags);
      return;
    }
  }
  if(document.getElementById('taggedOnly').checked) {
    const channel = document.querySelector("#channelname").value.replace(/^#/, '').toLowerCase();
    if (!message.toLowerCase().includes(`@${channel}`)) {
      return;
    }
    else {
      new TTS(message, tags); 
      return;
    }
  }
  if(document.getElementById('exclude-toggle').checked) {
    if(lines.includes(tags['display-name'].toLowerCase())) {
      return;
    }
    else {
      new TTS(message, tags);
      return;
    }
  }
  else {
    new TTS(message, tags); 
    return;
  }
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

/*
  If the checkbox is selected to exclude chatters, show the options for it.
*/
document.getElementById("exclude-toggle").addEventListener("change", function() {
  var options = document.getElementById('exclude-options');
  if(this.checked == true) {
    options.classList.remove('d-none');
  }
  if(this.checked == false) {
    options.classList.add('d-none');
  }
});

document.getElementById("listenBtn").addEventListener("click", function(event){
  event.preventDefault();
  if (!isListening) {
    startListening();
  } else {
    stopListening();
  }
});

/*
  Fills in the excluded chatters list with a predefined list of known moderation bots
*/
function fillInBots() {
  var excludedChatters = document.getElementById("excluded-chatters");
  excludedChatters.value = "Nightbot\nMoobot\nStreamElements\nStreamlabs\nFossabot";
}

window.onload = function() {
  populateVoiceList();
};

function stopListening() {
  if (twitchClient) {
    twitchClient.disconnect();
    twitchClient = null;
  }
  isListening = false;
  document.getElementById("listenBtn").textContent = "Start Listening";
  document.getElementById("listenBtn").disabled = false;
  document.querySelector('#status').className = "alert alert-info";
  document.querySelector('#status').textContent = "Waiting for channel name...";
}
