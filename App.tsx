import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Anton_400Regular } from '@expo-google-fonts/anton';
import { Archivo_400Regular, Archivo_500Medium, Archivo_600SemiBold, Archivo_700Bold } from '@expo-google-fonts/archivo';
import { openAppDatabase } from './src/db/open';
import { createTerrain, type Terrain } from './src/app/services';
import { TerrainProvider } from './src/app/state';
import { NavProvider } from './src/app/nav';
import { Shell } from './src/app/Shell';
import { color } from './src/theme/tokens';

export default function App() {
  const [loaded] = useFonts({ Anton_400Regular, Archivo_400Regular, Archivo_500Medium, Archivo_600SemiBold, Archivo_700Bold });
  const [t, setT] = useState<Terrain | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { openAppDatabase().then((db) => setT(createTerrain(db))).catch((e) => setErr(String(e))); }, []);
  if (!loaded || (!t && !err)) return <View style={{ flex: 1, backgroundColor: color.appBg }} />;
  if (err || !t) return <View style={{ flex: 1, backgroundColor: color.appBg, padding: 24 }}><StatusBar style="light" /></View>;
  return (
    <TerrainProvider t={t}>
      <NavProvider initial={t.isFresh() ? { name: 'onboarding' } : { name: 'tab', tab: 'today' }}>
        <StatusBar style="light" />
        <Shell />
      </NavProvider>
    </TerrainProvider>
  );
}
