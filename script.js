// ================================
// Speech & Translator JavaScript
// ================================


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




// Variables

let recognition;

let originalText = "";




// ================================
// Speech Recognition
// ================================


if ("webkitSpeechRecognition" in window ||
    "SpeechRecognition" in window) {


    const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;



    recognition = new SpeechRecognition();



    recognition.continuous = false;

    recognition.interimResults = true;



    recognition.onstart = function(){

        statusText.innerHTML =
        "Listening...";

        micBtn.classList.add("listening");

    };



    recognition.onresult = function(event){


        let text = "";


        for(
        let i=event.resultIndex;
        i<event.results.length;
        i++
        ){

            text +=
            event.results[i][0].transcript;

        }



        outputText.value = text;

    };



    recognition.onerror=function(event){

        statusText.innerHTML =
        "Error: "+event.error;

    };



    recognition.onend=function(){

        statusText.innerHTML =
        "Click microphone to start";


        micBtn.classList.remove("listening");

    };


}

else{


    alert(
    "Speech recognition not supported"
    );


}



// Start microphone

micBtn.onclick=function(){


    if(recognition){


        let lang =
        sourceLangSelect.value.split("|")[0];


        recognition.lang = lang;


        recognition.start();

    }

};






// ================================
// Translation
// ================================


translateBtn.onclick = async function(){


let text = outputText.value.trim();



if(text===""){

alert("Enter text first");

return;

}



originalText = text;



let target =
targetLangSelect.value;



outputText.value =
"Translating...";



try{


let response =
await fetch(
"https://libretranslate.de/translate",
{

method:"POST",

headers:{

"Content-Type":
"application/json"

},


body:JSON.stringify({

q:text,

source:
sourceLangSelect.value.split("|")[1],

target:target,

format:"text"


})


});




let data =
await response.json();



outputText.value =
data.translatedText;



showOriginalBtn.style.display =
"inline-block";



}



catch(error){


outputText.value =
"Translation failed";


console.log(error);


}



};






// ================================
// Show Original Text
// ================================


showOriginalBtn.onclick=function(){


outputText.value =
originalText;


};






// ================================
// Copy Button
// ================================


copyBtn.onclick=function(){


navigator.clipboard.writeText(
outputText.value
);


copyBtn.innerHTML =
"Copied ✓";


setTimeout(()=>{

copyBtn.innerHTML="Copy";

},1500);


};







// ================================
// Audio Upload
// ================================


uploadAudioBtn.onclick=function(){


audioFile.click();


};





audioFile.onchange=function(){


let file =
audioFile.files[0];



if(file){


let url =
URL.createObjectURL(file);



audioPreview.src=url;


audioPreview.style.display =
"block";


}


};





// ================================
// Keyboard Shortcut
// Ctrl + Enter Translate
// ================================


outputText.addEventListener(
"keydown",
function(e){


if(e.ctrlKey && e.key==="Enter"){

translateBtn.click();

}


});
