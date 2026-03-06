import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs disableTransparentOnScrollEdge>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'map', selected: 'map.fill' }} />
        <Label>Map</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="history">
        <Icon sf={{ default: 'list.bullet', selected: 'list.bullet' }} />
        <Label>History</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
