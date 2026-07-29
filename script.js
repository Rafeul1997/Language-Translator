// ==========================================
// Speech To Text + OpenAI Translator
// ==========================================


// OpenAI API Key
const OPENAI_API_KEY = "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

";


// Elements

const micBtn = document.getElementById("micBtn");
const statusText = document.getElementById("statusText");

const outputText = document.getElementById("outputText");

const translateBtn = document.getElementById("translateBtn");
const showOriginalBtn = document.getElementById("showOriginalBtn");

const copyBtn = document.getElementById("copyBtn");

const sourceLangSelect =
document.getElementById("sourceLangSelect");

const targetLangSelect =
document.getElementById("targetLangSelect");

const uploadAudioBtn =
document.getElementById("uploadAudioBtn");

const audioFile =
document.getElementById("audioFile");

const audioPreview =
document.getElementById("audioPreview");



let originalText = "";




// ==========================================
// LIVE SPEECH TO TEXT
// ==========================================


let recognition;


if(
window.SpeechRecognition ||
window.webkitSpeechRecognition
){


const SpeechRecognition =
window.SpeechRecognition ||
window.webkitSpeechRecognition;



recognition = new SpeechRecognition();


recognition.continuous = false;

recognition.interimResults = true;



recognition.onstart=function(){


statusText.innerHTML =
"Listening...";


micBtn.classList.add(
"listening"
);


};




recognition.onresult=function(event){


let text="";


for(
let i=event.resultIndex;
i<event.results.length;
i++
){

text +=
event.results[i][0].transcript;


}


outputText.value=text;


};




recognition.onerror=function(event){


statusText.innerHTML =
"Error : "+event.error;


};



recognition.onend=function(){


statusText.innerHTML =
"Click microphone to start";


micBtn.classList.remove(
"listening"
);


};



}



else{


alert(
"Speech Recognition not supported"
);


}





micBtn.onclick=function(){


if(recognition){


let lang =
sourceLangSelect.value
.split("|")[0];


recognition.lang=lang;


recognition.start();


}


};






// ==========================================
// OPENAI GPT TRANSLATION
// ==========================================


translateBtn.onclick=function(){


let text =
outputText.value.trim();



if(text===""){

alert(
"Enter text first"
);

return;

}



originalText=text;



let targetLanguage =
targetLangSelect.options[
targetLangSelect.selectedIndex
].text;



translateText(
text,
targetLanguage
);



};





async function translateText(
text,
language
){



outputText.value =
"Translating...";



try{


let response =
await fetch(
"https://api.openai.com/v1/chat/completions",
{


method:"POST",


headers:{


"Content-Type":
"application/json",


"Authorization":
"Bearer "+OPENAI_API_KEY


},


body:JSON.stringify({


model:"gpt-4.1-mini",


messages:[


{


role:"system",


content:
"You are a professional translator."


},


{


role:"user",


content:
`Translate this into ${language}:\n\n${text}`


}


]


})


});



let data =
await response.json();



outputText.value =
data.choices[0]
.message
.content;



showOriginalBtn.style.display =
"inline-block";



}



catch(error){


outputText.value =
"Translation Error : "+error;


}


}








// ==========================================
// SHOW ORIGINAL
// ==========================================


showOriginalBtn.onclick=function(){


outputText.value =
originalText;


};







// ==========================================
// COPY BUTTON
// ==========================================


copyBtn.onclick=function(){


navigator.clipboard.writeText(
outputText.value
);



copyBtn.innerHTML =
"Copied ✓";



setTimeout(()=>{


copyBtn.innerHTML =
"Copy";


},1500);



};








// ==========================================
// AUDIO UPLOAD
// OPENAI WHISPER SPEECH TO TEXT
// ==========================================


uploadAudioBtn.onclick=function(){


audioFile.click();


};





audioFile.onchange=function(){


let file =
audioFile.files[0];


if(!file)
return;



// Audio Preview

let url =
URL.createObjectURL(file);


audioPreview.src=url;

audioPreview.style.display =
"block";



// Send to Whisper

speechToText(file);



};








async function speechToText(file){


outputText.value =
"Converting speech...";



let formData =
new FormData();



formData.append(
"file",
file
);



formData.append(
"model",
"whisper-1"
);



try{


let response =
await fetch(
"https://api.openai.com/v1/audio/transcriptions",
{


method:"POST",


headers:{


"Authorization":
"Bearer "+OPENAI_API_KEY


},


body:formData


});



let data =
await response.json();



outputText.value =
data.text;



}


catch(error){


outputText.value =
"Speech Error : "+error;


}



}






// ==========================================
// CTRL + ENTER TRANSLATE
// ==========================================


outputText.addEventListener(
"keydown",
function(e){


if(
e.ctrlKey &&
e.key==="Enter"
){

translateBtn.click();

}


});
