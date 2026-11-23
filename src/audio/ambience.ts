// A soft storm bed under the game: wind, rain and the sea swelling, so the ship deck is never dead silent.
// Kept quiet on purpose while the game has no soundtrack (user, 2026-11-23: "volumen suave").

/** Level of the storm bed: mood, not content. */
export const STORM_LEVEL = 0.11;

export interface Storm {
  /** Stops every source of the bed. */
  stop: () => void;
}

type NoiseKind = 'white' | 'brown';

function noiseSource(ctx: AudioContext, kind: NoiseKind): AudioBufferSourceNode {
  const length = Math.floor(ctx.sampleRate * 2.5);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i += 1) {
    const x = Math.random() * 2 - 1;
    if (kind === 'white') {
      data[i] = x;
    } else {
      last = (last + 0.02 * x) / 1.02;
      data[i] = last * 3.5;
    }
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

/** Builds the bed into `destination` at `level`; slow oscillators make the wind gust and the sea swell. */
export function startStorm(ctx: AudioContext, destination: AudioNode, level: number): Storm {
  const out = ctx.createGain();
  out.gain.value = level;
  out.connect(destination);
  const sources: AudioScheduledSourceNode[] = [];
  const now = ctx.currentTime;

  const swell = (param: AudioParam, hz: number, depth: number): void => {
    const lfo = ctx.createOscillator();
    lfo.frequency.value = hz;
    const amount = ctx.createGain();
    amount.gain.value = depth;
    lfo.connect(amount);
    amount.connect(param);
    lfo.start(now);
    sources.push(lfo);
  };

  const wind = noiseSource(ctx, 'white');
  const windFilter = ctx.createBiquadFilter();
  windFilter.type = 'bandpass';
  windFilter.frequency.value = 420;
  windFilter.Q.value = 0.5;
  const windGain = ctx.createGain();
  windGain.gain.value = 0.55;
  swell(windGain.gain, 0.07, 0.3);
  swell(windFilter.frequency, 0.05, 160);
  wind.connect(windFilter);
  windFilter.connect(windGain);
  windGain.connect(out);

  const rain = noiseSource(ctx, 'white');
  const rainHigh = ctx.createBiquadFilter();
  rainHigh.type = 'highpass';
  rainHigh.frequency.value = 3400;
  const rainGain = ctx.createGain();
  rainGain.gain.value = 0.09;
  rain.connect(rainHigh);
  rainHigh.connect(rainGain);
  rainGain.connect(out);

  const sea = noiseSource(ctx, 'brown');
  const seaFilter = ctx.createBiquadFilter();
  seaFilter.type = 'lowpass';
  seaFilter.frequency.value = 280;
  const seaGain = ctx.createGain();
  seaGain.gain.value = 0.9;
  swell(seaGain.gain, 0.11, 0.4);
  sea.connect(seaFilter);
  seaFilter.connect(seaGain);
  seaGain.connect(out);

  for (const source of [wind, rain, sea]) {
    source.start(now, Math.random() * 1.5);
    sources.push(source);
  }

  return {
    stop: () => {
      for (const source of sources) {
        try {
          source.stop();
        } catch {
          // already stopped
        }
      }
      out.disconnect();
    },
  };
}
