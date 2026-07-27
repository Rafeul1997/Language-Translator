// Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const micBtn = document.getElementById('micBtn');
const statusText = document.getElementById('statusText');
const outputText = document.getElementById('outputText');
const copyBtn = document.getElementById('copyBtn');
const translateBtn = document.getElementById('translateBtn');
const langSelect = document.getElementById('langSelect');

if (!SpeechRecognition) {
  statusText.textContent = 'Web Speech API is not supported in this browser. Use Chrome or Edge.';
  micBtn.disabled = true;
} else {
  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US'; // Listening language defaults to English

  let isListening = false;
  let finalTranscript = '';

  // Toggle Mic
  micBtn.addEventListener('click', () => {
    if (!isListening) {
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
    outputText.value = finalTranscript + interimTranscript;
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

  // Translation Functionality (Using free MyMemory API)
  translateBtn.addEventListener('click', async () => {
    const textToTranslate = outputText.value.trim();
    
    if (!textToTranslate) {
      alert('Please speak or type some text first!');
      return;
    }

    // Get selected target language code (e.g., 'es')
    const selectedValue = langSelect.value;
    const targetLangCode = selectedValue.split('|')[1];

    statusText.textContent = 'Translating...';
    
    try {
      const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=en|${targetLangCode}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.responseData) {
        outputText.value = data.responseData.translatedText;
        statusText.textContent = 'Translation complete!';
      } else {
        statusText.textContent = 'Translation failed. Try again.';
      }
    } catch (error) {
      console.error('Translation error:', error);
      statusText.textContent = 'Error fetching translation.';
    }
  });
}
