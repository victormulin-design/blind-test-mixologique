export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Utility function to convert an AudioBuffer to a WAV file (Blob)
export const audioBufferToWavBlob = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    const channels = [];
    let i, sample;
    let offset = 0;
    let pos = 0;

    // write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit

    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    function setUint16(data: number) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data: number) {
        view.setUint32(pos, data, true);
        pos += 4;
    }

    // write interleaved data
    for (i = 0; i < numOfChan; i++) {
        channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
            view.setInt16(pos, sample, true); // write 16-bit sample
            pos += 2;
        }
        offset++;
    }

    return new Blob([view], { type: "audio/wav" });
};


export const normalizeAudio = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const reader = new FileReader();

        reader.onload = async (e) => {
            if (!e.target?.result) {
              console.warn("Failed to read file, falling back.");
              resolve(fileToBase64(file)); // Fallback
              return;
            }
            try {
                const decodedData = await audioContext.decodeAudioData(e.target.result as ArrayBuffer);
                
                let max = 0;
                for (let c = 0; c < decodedData.numberOfChannels; c++) {
                    const channelData = decodedData.getChannelData(c);
                    for (let i = 0; i < channelData.length; i++) {
                        max = Math.max(max, Math.abs(channelData[i]));
                    }
                }

                if (max === 0) { // Audio is silent
                  resolve(fileToBase64(file));
                  return;
                }
                
                // Use a slight margin to avoid potential clipping
                const gain = 0.98 / max;

                const offlineContext = new OfflineAudioContext(decodedData.numberOfChannels, decodedData.length, decodedData.sampleRate);
                const source = offlineContext.createBufferSource();
                source.buffer = decodedData;

                const gainNode = offlineContext.createGain();
                gainNode.gain.value = gain;

                source.connect(gainNode);
                gainNode.connect(offlineContext.destination);
                source.start(0);

                const renderedBuffer = await offlineContext.startRendering();
                const wavBlob = audioBufferToWavBlob(renderedBuffer);

                const normalizedReader = new FileReader();
                normalizedReader.onload = () => resolve(normalizedReader.result as string);
                normalizedReader.onerror = (err) => {
                  console.warn("Error reading normalized blob, falling back.", err);
                  resolve(fileToBase64(file));
                };
                normalizedReader.readAsDataURL(wavBlob);

            } catch (err) {
                console.error("Error processing audio, falling back to original:", err);
                resolve(fileToBase64(file)); // Fallback to original file if normalization fails
            }
        };
        reader.onerror = (err) => {
          console.warn("Error reading file for normalization, falling back.", err);
          resolve(fileToBase64(file)); // Fallback
        };
        reader.readAsArrayBuffer(file);
    });
};

export const generateColorFromName = (name: string = ''): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#ef4444','#f97316','#eab308','#84cc16','#22c55e','#10b981','#14b8a6','#06b6d4','#3b82f6','#8b5cf6','#d946ef','#ec4899'];
  return colors[Math.abs(hash % colors.length)];
};
