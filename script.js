// HARDCODED OPENAI API KEY HERE
const OPENAI_API_KEY = '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

';

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
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

// Helper function to check if key is set
function getApiKey() {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY_HERE') {
    alert('Please replace "YOUR_OPENAI_API_KEY_HERE" in script.js with your actual OpenAI API key!');
    return null;
  }
  return OPENAI_API_KEY;
}

// Send Audio File/Blob to OpenAI Whisper API
async function transcribeAudioWithWhisper(audioFile) {
  const apiKey = getApiKey();
  if (!apiKey) return;

  statusText.textContent = 'Transcribing with OpenAI Whisper...';

  const formData = new FormData();
  formData.append('file', audioFile);
  formData.append('model', 'whisper-1');
  formData.append('language', sourceLangSelect.value);

  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok) {
      originalSpeechText = data.text;
      outputText.value = originalSpeechText;
      statusText.textContent = 'Transcription complete!';
      showOriginalBtn.style.display = 'none';
    } else {
      statusText.textContent = `Transcription failed: ${data.error?.message || 'Unknown error'}`;
    }
  } catch (error) {
    console.error('Whisper API Error:', error);
    statusText.textContent = 'Error connecting to OpenAI API.';
  }
}

// 1. Live Microphone Recording via MediaRecorder
micBtn.addEventListener('click', async () => {
  if (!isRecording) {
    if (!getApiKey()) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
        await transcribeAudioWithWhisper(audioFile);
        
        // Stop microphone stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      isRecording = true;
      micBtn.classList.add('listening');
      statusText.textContent = 'Recording... Click mic to stop and transcribe';
    } catch (err) {
      alert('Microphone access denied or not supported.');
      console.error(err);
    }
  } else {
    mediaRecorder.stop();
    isRecording = false;
    micBtn.classList.remove('listening');
  }
});

// 2. Upload Audio File
audioFileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('audio/')) {
    alert('Please upload a valid audio file.');
    return;
  }

  await transcribeAudioWithWhisper(file);
});

// 3. Translation using OpenAI Chat Completions API
translateBtn.addEventListener('click', async () => {
  const apiKey = getApiKey();
  if (!apiKey) return;

  const textToTranslate = outputText.value.trim();
  if (!textToTranslate) {
    alert('Please record, upload, or type text to translate!');
    return;
  }

  if (!originalSpeechText) {
    originalSpeechText = textToTranslate;
  }

  const targetLang = targetLangSelect.value;
  statusText.textContent = 'Translating with OpenAI GPT...';

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a translator. Translate the given text directly to ${targetLang}. Preserve tone and formatting without adding explanations.`
          },
          {
            role: 'user',
            content: textToTranslate
          }
        ]
      })
    });

    const data = await response.json();

    if (response.ok) {
      outputText.value = data.choices[0].message.content.trim();
      statusText.textContent = 'Translation complete!';
      showOriginalBtn.style.display = 'inline-block';
    } else {
      statusText.textContent = `Translation failed: ${data.error?.message || 'Unknown error'}`;
    }
  } catch (error) {
    console.error('Translation Error:', error);
    statusText.textContent = 'Error connecting to OpenAI Translation API.';
  }
});

// Revert to original text
showOriginalBtn.addEventListener('click', () => {
  if (originalSpeechText) {
    outputText.value = originalSpeechText;
    showOriginalBtn.style.display = 'none';
    statusText.textContent = 'Original text restored.';
  }
});

// Copy button
copyBtn.addEventListener('click', () => {
  if (outputText.value.trim() !== '') {
    navigator.clipboard.writeText(outputText.value);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => (copyBtn.textContent = 'Copy Text'), 2000);
  }
});
