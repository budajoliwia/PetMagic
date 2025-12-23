import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from "react-native";
import { auth, db } from "../src/firebase";
import { UserDoc } from "../src/models";
import { useAppTheme } from "../src/theme";
import { Button } from "../src/ui/Button";
import { Screen } from "../src/ui/Screen";

export default function AuthScreen() {
  const router = useRouter();
  const { colors, isDark, toggle } = useAppTheme();
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

      // Ensure user document exists (older accounts or deleted doc would break backend limit checks)
      const userRef = doc(db, "users", userCredential.user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        const userDoc: UserDoc = {
          email: trimmedEmail,
          createdAt: new Date().toISOString(),
          role: "user",
          dailyLimit: 5,
          usedToday: 0,
          lastUsageDate: null,
        };
        await setDoc(userRef, userDoc);
      }

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
    <Screen scroll={false} padding={20}>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <View style={{ alignItems: "flex-end", marginBottom: 8 }}>
          <Pressable
            onPress={toggle}
            hitSlop={10}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons
              name={isDark ? "sunny-outline" : "moon-outline"}
              size={18}
              color={colors.text}
            />
          </Pressable>
        </View>

        <View style={{ gap: 6, marginBottom: 18, alignItems: "center" }}>
          <Text
            style={{
              color: colors.text,
              fontSize: 30,
              fontWeight: "900",
              textAlign: "center",
            }}
          >
            PetMagicAI
          </Text>
          <Text
            style={{
              color: colors.muted,
              fontSize: 18,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            {isRegistering ? "Utwórz konto" : "Zaloguj się"}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            gap: 10,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <TextInput
            placeholder="Email"
            placeholderTextColor={colors.subtle}
            value={email}
            onChangeText={setEmail}
            style={{
              width: "100%",
              backgroundColor: "transparent",
              color: colors.text,
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isLoading}
          />

          <TextInput
            placeholder="Hasło"
            placeholderTextColor={colors.subtle}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{
              width: "100%",
              backgroundColor: "transparent",
              color: colors.text,
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            editable={!isLoading}
          />

          {isRegistering && (
            <TextInput
              placeholder="Powtórz hasło"
              placeholderTextColor={colors.subtle}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={{
                width: "100%",
                backgroundColor: "transparent",
                color: colors.text,
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              editable={!isLoading}
            />
          )}

          {isLoading ? (
            <View style={{ alignItems: "center", paddingVertical: 8 }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <>
              <Button
                title={isRegistering ? "Załóż konto" : "Zaloguj"}
                onPress={isRegistering ? handleSignUp : handleSignIn}
              />

              <Pressable
                onPress={() => setIsRegistering((v) => !v)}
                style={({ pressed }) => ({
                  alignItems: "center",
                  paddingVertical: 10,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "600" }}>
                  {isRegistering
                    ? "Masz już konto? Zaloguj się"
                    : "Nie masz konta? Załóż je"}
                </Text>
              </Pressable>
            </>
          )}
        </View>

        <Text style={{ color: colors.subtle, fontSize: 12, marginTop: 14 }}>
          Korzystając z aplikacji akceptujesz zasady prywatności.
        </Text>
      </View>
    </Screen>
  );
}
