import React from 'react';
import { View } from 'react-native';
import { Display } from '../ui/text';
export function FormVideoScreen({ exerciseId }: { exerciseId: string }) { return <View style={{ padding: 20 }}><Display>Form {exerciseId}</Display></View>; }
