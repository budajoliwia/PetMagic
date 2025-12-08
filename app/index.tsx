import React from "react";
import { Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#020617",
      }}
    >
      <Text style={{ color: "white", fontSize: 24, fontWeight: "600" }}>
        PetMagicAI 🐾
      </Text>
      <Text style={{ color: "#9ca3af", marginTop: 8 }}>
        Clean start – zaraz dodamy logowanie
      </Text>
    </View>
  );
}
