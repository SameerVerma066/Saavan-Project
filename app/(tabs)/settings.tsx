import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function SettingsTab() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Settings screen coming soon.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 8,
    color: "#b0b0b0",
    fontSize: 14,
  },
});
