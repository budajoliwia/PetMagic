import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Button, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth, db } from "../src/firebase";
import { UserDoc } from "../src/models";

export default function AuthScreen() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      
      // Create user document in Firestore
      const userDoc: UserDoc = {
        email: trimmedEmail,
        createdAt: new Date().toISOString(),
        role: "user",
        dailyLimit: 5,
        usedToday: 0,
        lastUsageDate: null,
      };
      await setDoc(doc(db, "users", userCredential.user.uid), userDoc);

      console.log("Registered & saved:", userCredential.user.email);
      Alert.alert("Success", "Registered successfully!");
      router.replace("/home");
    } catch (error: any) {
      console.error(error);
      let errorMessage = "An unknown error occurred";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered.";
      } else if (error instanceof Error) {
         errorMessage = error.message;
      }
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      console.log("Logged in:", userCredential.user.email);
      Alert.alert("Success", "Logged in successfully!");
      router.replace("/home");
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

      <Text style={{ color: "white", fontSize: 18, marginBottom: 20 }}>
        {isRegistering ? "Create Account" : "Welcome Back"}
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
          marginBottom: isRegistering ? 10 : 20,
        }}
        editable={!isLoading}
      />

      {isRegistering && (
        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor="#9ca3af"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
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
      )}

      {isLoading ? (
        <ActivityIndicator size="large" color="#ffffff" />
      ) : (
        <View style={{ width: "100%", gap: 10 }}>
          <Button 
            title={isRegistering ? "Sign Up" : "Sign In"} 
            onPress={isRegistering ? handleSignUp : handleSignIn} 
          />
          
          <TouchableOpacity 
            onPress={() => {
              setIsRegistering(!isRegistering);
              // Reset errors or fields if desired
            }}
            style={{ alignItems: 'center', marginTop: 10 }}
          >
            <Text style={{ color: '#9ca3af' }}>
              {isRegistering 
                ? "Already have an account? Sign In" 
                : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
