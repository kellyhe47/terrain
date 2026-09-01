// Readiness arc (R1/R3): 250×132 half-arc with a band gradient; `--` in the insufficient state. No emoji.
import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { bands } from '../../theme/tokens';
import { Numeral, Label } from './text';

const ARC = 'M 21 125 A 104 104 0 0 1 229 125';
const LEN = Math.PI * 104;
export function Gauge({ score, band }: { score: number | null; band: 'green' | 'yellow' | 'red' | null }) {
  const stops = band ? bands[band].stops : bands.green.stops;
  const dash = score == null ? 0 : Math.round((LEN * score) / 100);
  return (
    <View style={{ width: 250, height: 132 }}>
      <Svg width={250} height={132} viewBox="0 0 250 132" style={{ position: 'absolute', top: 0, left: 0 }}>
        <Defs>
          <LinearGradient id="bandArc" x1="0%" y1="100%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={stops[0]} /><Stop offset="45%" stopColor={stops[1]} /><Stop offset="80%" stopColor={stops[2]} /><Stop offset="100%" stopColor={stops[3]} />
          </LinearGradient>
        </Defs>
        <Path d={ARC} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={10} strokeLinecap="round" />
        {score != null && band ? <Path d={ARC} fill="none" stroke={bands[band].glow} strokeWidth={22} strokeLinecap="round" strokeDasharray={`${dash} ${Math.round(LEN + 20)}`} /> : null}
        {score != null ? <Path d={ARC} fill="none" stroke="url(#bandArc)" strokeWidth={10} strokeLinecap="round" strokeDasharray={`${dash} ${Math.round(LEN + 20)}`} /> : null}
      </Svg>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', gap: 2 }}>
        <Numeral c="#fff" size={58} lh={56} accessibilityLabel={score == null ? 'No readiness score yet' : `Readiness ${score}`}>{score == null ? '--' : String(score)}</Numeral>
        <Label c="rgba(255,255,255,0.6)" size={11} style={{ letterSpacing: 1.1, fontFamily: 'Archivo_700Bold' }}>Readiness</Label>
      </View>
    </View>
  );
}
