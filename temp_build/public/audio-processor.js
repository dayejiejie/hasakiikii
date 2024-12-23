class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    this.silenceThreshold = 0.01; // 声音阈值
    this.isSpeaking = false;
    this.silenceStartTime = 0;
    this.silenceDuration = 48000; // 1秒静音判定 (48000 samples at 48kHz)
  }

  calculateRMS(input) {
    let sum = 0;
    for (let i = 0; i < input.length; i++) {
      sum += input[i] * input[i];
    }
    return Math.sqrt(sum / input.length);
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const inputChannel = input[0];
    const volume = this.calculateRMS(inputChannel);
    
    // 检测是否正在说话
    if (volume > this.silenceThreshold) {
      if (!this.isSpeaking) {
        this.isSpeaking = true;
        this.port.postMessage({ type: 'speech_start' });
      }
      this.silenceStartTime = currentFrame;
    } else if (this.isSpeaking) {
      // 检查静音持续时间
      const silenceFrames = currentFrame - this.silenceStartTime;
      if (silenceFrames > this.silenceDuration) {
        this.isSpeaking = false;
        this.port.postMessage({ type: 'speech_end' });
        // 发送累积的音频数据
        if (this.bufferIndex > 0) {
          this.port.postMessage({
            type: 'audio',
            audioData: this.buffer.slice(0, this.bufferIndex),
            volume: volume
          });
          this.bufferIndex = 0;
        }
      }
    }
    
    // 如果正在说话，累积音频数据
    if (this.isSpeaking) {
      for (let i = 0; i < inputChannel.length; i++) {
        this.buffer[this.bufferIndex] = inputChannel[i];
        this.bufferIndex++;

        if (this.bufferIndex >= this.bufferSize) {
          this.port.postMessage({
            type: 'audio',
            audioData: this.buffer,
            volume: volume
          });
          this.bufferIndex = 0;
        }
      }
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor); 