import React from 'react';
import { Pressable, View } from 'react-native';
import { useNav, type Tab } from './nav';
import { useTerrain } from './state';
import { color, font } from '../theme/tokens';
import { Icon } from './ui/icons';
import { Semi } from './ui/text';
import { Toast } from './ui/primitives';
import { PhoneFrame, StatusBarFake } from './ui/frame';
import { TodayScreen } from './screens/TodayScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { LogScreen } from './screens/LogScreen';
import { NoraScreen } from './screens/NoraScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { NutritionScreen } from './screens/NutritionScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { KnowsScreen } from './screens/KnowsScreen';
import { SessionDetailScreen } from './screens/SessionDetailScreen';
import { MealScreen } from './screens/MealScreen';
import { GymPlayerScreen } from './screens/GymPlayerScreen';
import { SprintPlayerScreen } from './screens/SprintPlayerScreen';
import { FormVideoScreen } from './screens/FormVideoScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'today', label: 'Today', icon: 'sun' }, { id: 'calendar', label: 'Calendar', icon: 'calendar' }, { id: 'log', label: '', icon: 'plus' }, { id: 'nora', label: 'Nora', icon: 'chat' }, { id: 'progress', label: 'Progress', icon: 'trend' },
];
const FULLSCREEN = new Set(['gym', 'sprint', 'onboarding', 'formVideo']);
const NO_STATUS = new Set(['today', 'gym', 'sprint', 'meal', 'onboarding', 'formVideo']);

export function Shell() {
  const nav = useNav(); const { toast } = useTerrain();
  const r = nav.current;
  const screen = (() => {
    switch (r.name) {
      case 'tab': return r.tab === 'today' ? <TodayScreen /> : r.tab === 'calendar' ? <CalendarScreen /> : r.tab === 'log' ? <LogScreen /> : r.tab === 'nora' ? <NoraScreen /> : <ProgressScreen />;
      case 'nutrition': return <NutritionScreen />;
      case 'settings': return <SettingsScreen />;
      case 'knows': return <KnowsScreen />;
      case 'sessionDetail': return <SessionDetailScreen activityId={r.activityId} />;
      case 'meal': return <MealScreen />;
      case 'gym': return <GymPlayerScreen activityId={r.activityId} />;
      case 'sprint': return <SprintPlayerScreen activityId={r.activityId} />;
      case 'formVideo': return <FormVideoScreen exerciseId={r.exerciseId} />;
      case 'onboarding': return <OnboardingScreen />;
    }
  })();
  const tabKey = r.name === 'tab' ? r.tab : r.name === 'meal' ? 'log' : r.name === 'sessionDetail' ? 'progress' : ['nutrition', 'knows', 'settings'].includes(r.name) ? 'today' : nav.tab;
  const showTabs = !FULLSCREEN.has(r.name);
  const showStatus = !NO_STATUS.has(r.name === 'tab' ? r.tab : r.name);
  return (
    <PhoneFrame>
      <View style={{ flex: 1 }}>
        {showStatus ? <StatusBarFake /> : null}
        <View style={{ flex: 1 }}>{screen}</View>
        {showTabs ? (
          <View style={{ borderTopWidth: 1, borderColor: color.border, backgroundColor: color.bg, flexDirection: 'row', paddingTop: 6, paddingHorizontal: 8, paddingBottom: 18 }} accessibilityRole="tablist">
            {TABS.map((tb) => {
              const active = tabKey === tb.id; const isLog = tb.id === 'log';
              return (
                <Pressable key={tb.id} accessibilityRole="tab" accessibilityLabel={tb.label || 'Log'} accessibilityState={{ selected: active }} onPress={() => nav.setTab(tb.id)} style={{ flex: 1, alignItems: 'center', gap: 3, paddingTop: 8, paddingBottom: 2 }}>
                  {isLog ? (
                    <View style={{ width: 38, height: 30, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? color.orange : color.surface2 }}><Icon name="plus" size={20} color={active ? color.textOnOrange : color.text2} /></View>
                  ) : <Icon name={tb.icon} size={20} color={active ? color.orange : color.text3} />}
                  {tb.label ? <Semi c={active ? color.orange : color.text3} size={10} style={{ letterSpacing: 0.3, fontFamily: font.bodySemi }}>{tb.label}</Semi> : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}
        <Toast msg={toast} />
      </View>
    </PhoneFrame>
  );
}
