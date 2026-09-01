import React from 'react';
import { View } from 'react-native';
import { Display } from '../ui/text';
export function SessionDetailScreen({ activityId }: { activityId: string }) { return <View style={{ padding: 20 }}><Display>Session {activityId}</Display></View>; }
