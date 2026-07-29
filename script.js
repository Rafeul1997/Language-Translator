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

// Allowed audio extensions
const validExtensions = ['mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac', 'webm'];

// OPENAI API KEY (Replace with your newly generated OpenAI Key)
const OPENAI_API_KEY = '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

';

// File Upload Handler
audioFileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const fileExtension = file.name.split('.').pop().toLowerCase();

  // Validate extension
  if (!validExtensions.includes(fileExtension)) {
    alert('Invalid file format! Only audio files (.mp3, .wav, .m4a, .ogg, .flac) can be uploaded.');
    event.target.value = ''; // Reset input
    return;
  }

  // Process and transcribe uploaded audio file using Whisper API
  transcribeAudioFile(file);
});

async function transcribeAudioFile(file) {
  statusText.textContent = `Transcribing ${file.name}...`;
  showOriginalBtn.style.display = 'none';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('model', 'whisper-1');

  // Optional: Pass language code to improve accuracy
  const sourceLang = sourceLangSelect.value.split('|')[1];
  formData.append('language', sourceLang);

  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: formData
    });

    const data = await response.json();

    if (data.text) {
      originalSpeechText = data.text;
      outputText.value = originalSpeechText;
      statusText.textContent = 'Audio transcription complete!';
    } else {
      console.error('Whisper API Error:', data);
      statusText.textContent = 'Transcription failed. Check API key or file format.';
    }
  } catch (error) {
    console.error('API Request Error:', error);
    statusText.textContent = 'Error connecting to transcription service.';
  }
}

// Microphone / Web Speech Setup
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
      alert('Please speak or upload an audio file first!');
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
