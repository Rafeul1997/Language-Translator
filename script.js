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

let originalSpeechText = '';

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
      // Set speech engine language from source dropdown
      const sourceLangCode = sourceLangSelect.value.split('|')[0];
      recognition.lang = sourceLangCode;
      
      // Hide original toggle button when starting a new session
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
    statusText.textContent = 'Click mic to start speaking';
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
    
    // Store original speech and display it
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
      alert('Please speak or type some text first!');
      return;
    }

    // Save original before translating
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
        showOriginalBtn.style.display = 'inline-block'; // Show button to revert
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
