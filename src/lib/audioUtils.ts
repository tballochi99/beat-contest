export const checkAudioDuration = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);

    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(objectUrl);
      // Check if duration is less than or equal to 60 seconds (1 minute)
      resolve(audio.duration <= 60);
    });

    audio.addEventListener('error', () => {
      URL.revokeObjectURL(objectUrl);
      resolve(false);
    });

    audio.src = objectUrl;
  });
};

export const extractRandomMinute = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);

    audio.addEventListener('loadedmetadata', async () => {
      try {
        const duration = audio.duration;
        if (duration <= 60) {
          // Si le fichier fait moins d'une minute, on le retourne tel quel
          URL.revokeObjectURL(objectUrl);
          resolve(file);
          return;
        }

        // On calcule un point de départ aléatoire
        const maxStartTime = duration - 60;
        const randomStartTime = Math.random() * maxStartTime;

        // On crée un contexte audio
        const audioContext = new AudioContext();
        const response = await fetch(objectUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // On crée un nouveau buffer d'une minute
        const newBuffer = audioContext.createBuffer(
          audioBuffer.numberOfChannels,
          60 * audioBuffer.sampleRate,
          audioBuffer.sampleRate
        );

        // On copie une minute à partir du point aléatoire
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
          const channelData = audioBuffer.getChannelData(channel);
          const newChannelData = newBuffer.getChannelData(channel);
          const startSample = Math.floor(randomStartTime * audioBuffer.sampleRate);
          
          for (let i = 0; i < newBuffer.length; i++) {
            newChannelData[i] = channelData[startSample + i];
          }
        }

        // On convertit le buffer en blob
        const wavBlob = await audioBufferToWav(newBuffer);
        URL.revokeObjectURL(objectUrl);
        resolve(wavBlob);
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    });

    audio.addEventListener('error', () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Error loading audio file'));
    });

    audio.src = objectUrl;
  });
};

// Fonction utilitaire pour convertir AudioBuffer en WAV
const audioBufferToWav = async (buffer: AudioBuffer): Promise<Blob> => {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = buffer.length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, totalSize - 8, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, format, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, byteRate, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, bitDepth, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataSize, true);

  // Write the PCM samples
  const offset = 44;
  const channelData = [];
  for (let i = 0; i < numChannels; i++) {
    channelData.push(buffer.getChannelData(i));
  }

  let pos = 0;
  while (pos < buffer.length) {
    for (let i = 0; i < numChannels; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i][pos]));
      const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset + pos * blockAlign + i * bytesPerSample, value, true);
    }
    pos++;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}; 