import React, { useState, useContext, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { globalStyles } from '../../styles/theme';

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const { colors } = useTheme();
  const gStyles = useMemo(() => globalStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validate = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    
    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      Alert.alert('Login Failed', error.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[gStyles.container, { justifyContent: 'center', padding: 20 }]}>
      <Text style={[gStyles.title, { textAlign: 'center', fontSize: 32, marginBottom: 40 }]}>Bijli Tracker</Text>
      
      <Text style={gStyles.label}>Email Address</Text>
      <TextInput
        style={[gStyles.input, emailError && { borderColor: colors.danger }]}
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={(text) => { setEmail(text); setEmailError(''); }}
      />
      {emailError ? <Text style={gStyles.errorText}>{emailError}</Text> : null}
      
      <Text style={gStyles.label}>Password</Text>
      <TextInput
        style={[gStyles.input, passwordError && { borderColor: colors.danger }]}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={(text) => { setPassword(text); setPasswordError(''); }}
      />
      {passwordError ? <Text style={gStyles.errorText}>{passwordError}</Text> : null}
      
      <TouchableOpacity 
        style={[gStyles.button, { marginTop: 20 }]} 
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={gStyles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={{ marginTop: 20, alignItems: 'center' }}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={{ color: colors.primary, fontWeight: '500' }}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
