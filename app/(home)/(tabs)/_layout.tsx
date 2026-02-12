import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  return (
    <NativeTabs minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <Icon sf={{ default: "map", selected: "map.fill" }} />
        <Label>Explore</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="journals">
        <Icon sf={{ default: "book.closed", selected: "book.closed.fill" }} />
        <Label>Journals</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="more">
        <Icon
          sf={{
            default: "line.3.horizontal",
            selected: "line.3.horizontal.circle.fill",
          }}
        />
        <Label>More</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ai-chat">
        <Icon
          sf={{
            default: "bubble.left.and.bubble.right",
            selected: "bubble.left.and.bubble.right.fill",
          }}
        />
        <Label>Chat</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
