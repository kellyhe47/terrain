import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useFonts, Anton_400Regular } from '@expo-google-fonts/anton';
import { Archivo_400Regular, Archivo_500Medium, Archivo_600SemiBold, Archivo_700Bold } from '@expo-google-fonts/archivo';
import { openAppDatabase } from './src/db/open';
import { color, font } from './src/theme/tokens';

export default function App() {
  const [loaded] = useFonts({ Anton_400Regular, Archivo_400Regular, Archivo_500Medium, Archivo_600SemiBold, Archivo_700Bold });
  const [msg, setMsg] = useState('opening db…');
  useEffect(() => {
    openAppDatabase().then((db) => {
      db.run('CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, v TEXT)');
      db.run('INSERT INTO t (v) VALUES (?)', ['hello']);
      const rows = db.all<{ c: number }>('SELECT count(*) c FROM t');
      setMsg('rows: ' + rows[0].c);
    }).catch((e) => setMsg('error: ' + String(e)));
  }, []);
  if (!loaded) return null;
  return (
    <View style={{ flex: 1, backgroundColor: color.appBg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: font.display, color: color.orange, fontSize: 48 }}>TERRAIN</Text>
      <Text style={{ fontFamily: font.body, color: color.text2 }}>{msg}</Text>
    </View>
  );
}
