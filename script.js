// Check browser support for SpeechRecognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const micBtn = document.getElementById('micBtn');
const statusText = document.getElementById('statusText');
const outputText = document.getElementById('outputText');
const copyBtn = document.getElementById('copyBtn');

if (!SpeechRecognition) {
  statusText.textContent = 'Web Speech API is not supported in this browser. Try Chrome or Edge.';
  micBtn.disabled = true;
} else {
  const recognition = new SpeechRecognition();

  // Settings
  recognition.continuous = true;  // Keep listening until stopped manually
  recognition.interimResults = true; // Show live text while speaking
  recognition.lang = 'en-US';    // Set language (e.g., 'es-ES', 'hi-IN')

  let isListening = false;
  let finalTranscript = '';

  // Toggle microphone click
  micBtn.addEventListener('click', () => {
    if (!isListening) {
      recognition.start();
    } else {
      recognition.stop();
    }
  });

  // Event: Listening started
  recognition.onstart = () => {
    isListening = true;
    micBtn.classList.add('listening');
    statusText.textContent = 'Listening... Click to stop';
  };

  // Event: Listening stopped
  recognition.onend = () => {
    isListening = false;
    micBtn.classList.remove('listening');
    statusText.textContent = 'Click to Listen';
  };

  // Event: Speech recognized
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

    // Display transcript in text area
    outputText.value = finalTranscript + interimTranscript;
  };

  // Event: Handle errors
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    statusText.textContent = `Error: ${event.error}`;
    micBtn.classList.remove('listening');
    isListening = false;
  };

  // Copy button logic
  copyBtn.addEventListener('click', () => {
    if (outputText.value.trim() !== '') {
      navigator.clipboard.writeText(outputText.value);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => (copyBtn.textContent = 'Copy Text'), 2000);
    }
  });
}
