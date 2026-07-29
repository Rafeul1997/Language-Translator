let mediaRecorder;
let audioChunks = [];
let activeAudioBlob = null;

// ⚠️ PASTE YOUR OPENAI API KEY HERE FOR TESTING
// Note: Exposing keys client-side is visible to the public if your GitHub repo is public.
const OPENAI_API_KEY = "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

"; 

// --- OPTION 1: LIVE RECORDING LOGIC ---
async function startRecording() {
  audioChunks = [];
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      activeAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      setupAudioPreview(activeAudioBlob);
      
      // Automatically transcribe audio via OpenAI Whisper API
      await transcribeAudio(activeAudioBlob);
    };

    mediaRecorder.start();
    document.getElementById('recordBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;
    document.getElementById('sourceText').value = "Recording audio live...";
  } catch (error) {
    console.error("Microphone access error:", error);
    alert("Could not access microphone. Please check browser permissions.");
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop()); // Turn off hardware mic light
    document.getElementById('recordBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
  }
}

// --- OPTION 2: FILE UPLOAD LOGIC ---
async function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  activeAudioBlob = file;
  setupAudioPreview(file);
  
  // Automatically transcribe uploaded audio via OpenAI Whisper API
  await transcribeAudio(file);
}

// --- SHARED AUDIO PREVIEW HELPER ---
function setupAudioPreview(blobOrFile) {
  const audioUrl = URL.createObjectURL(blobOrFile);
  const audioPlayback = document.getElementById('audioPlayback');
  audioPlayback.src = audioUrl;
  document.getElementById('playbackContainer').style.display = 'block';
}

// --- OPENAI WHISPER STT FUNCTION ---
async function transcribeAudio(audioBlob) {
  if (!OPENAI_API_KEY || OPENAI_API_KEY.includes("YOUR_OPENAI_API_KEY")) {
    alert("Please add your OpenAI API key in script.js");
    return;
  }

  document.getElementById('sourceText').value = "Transcribing audio with OpenAI Whisper...";

  const formData = new FormData();
  formData.append("file", audioBlob, "audio.webm");
  formData.append("model", "whisper-1");

  try {
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: formData
    });

    const data = await response.json();
    if (data.text) {
      document.getElementById('sourceText').value = data.text;
    } else {
      document.getElementById('sourceText').value = "[Transcription failed]";
      console.error(data);
    }
  } catch (error) {
    console.error("Whisper API error:", error);
    document.getElementById('sourceText').value = "[Error connecting to Whisper API]";
  }
}

// --- OPENAI CHAT/TRANSLATION FUNCTION ---
async function handleTranslation() {
  const text = document.getElementById('sourceText').value;
  const targetLang = document.getElementById('targetLang').value;

  if (!text.trim() || text.includes("Transcribing")) {
    alert("Please provide valid text or audio first.");
    return;
  }

  if (!OPENAI_API_KEY || OPENAI_API_KEY.includes("YOUR_OPENAI_API_KEY")) {
    alert("Please add your OpenAI API key in script.js");
    return;
  }

  document.getElementById('translatedOutput').innerText = `Translating via OpenAI GPT...`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a professional translator. Translate the following text accurately into ${targetLang}. Return ONLY the translated text.`
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.3
      })
    });

    const data = await response.json();
    if (data.choices && data.choices.length > 0) {
      document.getElementById('translatedOutput').innerText = data.choices[0].message.content.trim();
    } else {
      document.getElementById('translatedOutput').innerText = "Translation failed.";
    }
  } catch (error) {
    console.error("OpenAI API error:", error);
    document.getElementById('translatedOutput').innerText = "Error connecting to OpenAI translation API.";
  }
}
