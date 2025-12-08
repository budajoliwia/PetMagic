import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Button, Text, TextInput, View } from "react-native";
import { auth, db } from "../src/firebase";

export default function HomeScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      
      // Create user document in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: trimmedEmail,
        createdAt: new Date().toISOString(),
        role: "user",
        dailyLimit: 5,
        usedToday: 0,
        lastUsageDate: null
      });

      console.log("Registered & saved:", userCredential.user.email);
      Alert.alert("Success", "Registered successfully!");
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      console.log("Logged in:", userCredential.user.email);
      Alert.alert("Success", "Logged in successfully!");
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#020617",
        padding: 20,
      }}
    >
      <Text style={{ color: "white", fontSize: 24, fontWeight: "600", marginBottom: 20 }}>
        PetMagicAI 🐾
      </Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#9ca3af"
        value={email}
        onChangeText={setEmail}
        style={{
          width: "100%",
          backgroundColor: "#1e293b",
          color: "white",
          padding: 15,
          borderRadius: 8,
          marginBottom: 10,
        }}
        autoCapitalize="none"
        editable={!isLoading}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#9ca3af"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          width: "100%",
          backgroundColor: "#1e293b",
          color: "white",
          padding: 15,
          borderRadius: 8,
          marginBottom: 20,
        }}
        editable={!isLoading}
      />

      {isLoading ? (
        <ActivityIndicator size="large" color="#ffffff" />
      ) : (
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Button title="Sign Up" onPress={handleSignUp} />
          <Button title="Sign In" onPress={handleSignIn} />
        </View>
      )}
    </View>
  );
}
