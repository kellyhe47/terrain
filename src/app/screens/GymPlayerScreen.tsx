import React from 'react';
import { View } from 'react-native';
import { Display } from '../ui/text';
export function GymPlayerScreen({ activityId }: { activityId: string }) { return <View style={{ padding: 20 }}><Display>Gym {activityId}</Display></View>; }
