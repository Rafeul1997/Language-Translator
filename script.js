// Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const micBtn = document.getElementById('micBtn');
const statusText = document.getElementById('statusText');
const outputText = document.getElementById('outputText');

const copyBtn = document.getElementById('copyBtn');
const translateBtn = document.getElementById('translateBtn');
const showOriginalBtn = document.getElementById('showOriginalBtn');

const sourceLangSelect = document.getElementById('sourceLangSelect');
const targetLangSelect = document.getElementById('targetLangSelect');
const audioFileInput = document.getElementById('audioFileInput');

let originalSpeechText = '';
const validExtensions = ['mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac', 'webm'];

// File Upload Handler
audioFileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const fileExtension = file.name.split('.').pop().toLowerCase();

  // Validate extension
  if (!validExtensions.includes(fileExtension)) {
    alert('Only audio files (.mp3, .wav, .m4a, .ogg, .flac, .aac) can be uploaded!');
    event.target.value = ''; // Reset input
    return;
  }

  statusText.textContent = `Loaded audio: ${file.name}`;

  // Process uploaded audio
  processAudioFile(file);
});

function processAudioFile(file) {
  // Create object URL to stream the audio through browser speech recognition
  const audioUrl = URL.createObjectURL(file);
  const audio = new Audio(audioUrl);

  showOriginalBtn.style.display = 'none';

  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = sourceLangSelect.value.split('|')[0];

    statusText.textContent = 'Transcribing uploaded audio...';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        originalSpeechText = finalTranscript;
        outputText.value = originalSpeechText;
      }
    };

    recognition.onend = () => {
      statusText.textContent = 'Audio transcription complete!';
    };

    recognition.onerror = () => {
      statusText.textContent = 'File loaded. Play audio via mic to transcribe.';
    };

    try {
      recognition.start();
      audio.play();
    } catch (e) {
      statusText.textContent = `File ready: ${file.name}`;
    }
  } else {
    statusText.textContent = `Loaded audio: ${file.name}`;
  }
}

if (!SpeechRecognition) {
  statusText.textContent = 'Web Speech API is not supported in this browser. Use Chrome or Edge.';
  micBtn.disabled = true;
} else {
  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = true;

  let isListening = false;
  let finalTranscript = '';

  // Toggle Mic
  micBtn.addEventListener('click', () => {
    if (!isListening) {
      const sourceLangCode = sourceLangSelect.value.split('|')[0];
      recognition.lang = sourceLangCode;
      
      showOriginalBtn.style.display = 'none';
      recognition.start();
    } else {
      recognition.stop();
    }
  });

  recognition.onstart = () => {
    isListening = true;
    micBtn.classList.add('listening');
    statusText.textContent = 'Listening... Click mic to stop';
  };

  recognition.onend = () => {
    isListening = false;
    micBtn.classList.remove('listening');
    statusText.textContent = 'Click mic or upload audio to transcribe';
  };

  recognition.onresult = (event) => {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }
    
    originalSpeechText = finalTranscript + interimTranscript;
    outputText.value = originalSpeechText;
  };

  recognition.onerror = (event) => {
    statusText.textContent = `Error: ${event.error}`;
    micBtn.classList.remove('listening');
    isListening = false;
  };

  // Copy to Clipboard
  copyBtn.addEventListener('click', () => {
    if (outputText.value.trim() !== '') {
      navigator.clipboard.writeText(outputText.value);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => (copyBtn.textContent = 'Copy Text'), 2000);
    }
  });

  // Translate Functionality
  translateBtn.addEventListener('click', async () => {
    const textToTranslate = outputText.value.trim();
    
    if (!textToTranslate) {
      alert('Please speak or upload audio first!');
      return;
    }

    if (!originalSpeechText) {
      originalSpeechText = textToTranslate;
    }

    const sourceLangCode = sourceLangSelect.value.split('|')[1];
    const targetLangCode = targetLangSelect.value;

    statusText.textContent = 'Translating...';
    
    try {
      const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=${sourceLangCode}|${targetLangCode}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.responseData) {
        outputText.value = data.responseData.translatedText;
        statusText.textContent = 'Translation complete!';
        showOriginalBtn.style.display = 'inline-block';
      } else {
        statusText.textContent = 'Translation failed. Try again.';
      }
    } catch (error) {
      console.error('Translation error:', error);
      statusText.textContent = 'Error fetching translation.';
    }
  });

  // Revert back to original transcript
  showOriginalBtn.addEventListener('click', () => {
    if (originalSpeechText) {
      outputText.value = originalSpeechText;
      showOriginalBtn.style.display = 'none';
      statusText.textContent = 'Original text restored.';
    }
  });
}
