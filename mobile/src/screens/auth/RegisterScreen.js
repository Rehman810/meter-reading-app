import React, { useState, useContext, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { globalStyles } from '../../styles/theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useContext(AuthContext);
  const { colors } = useTheme();
  const gStyles = useMemo(() => globalStyles(colors), [colors]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validate = () => {
    let isValid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');

    if (!name.trim()) {
      setNameError('Name is required');
      isValid = false;
    }

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
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    
    setLoading(true);
    try {
      await register(name, email, password);
    } catch (error) {
      Alert.alert('Registration Failed', error.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[gStyles.container, { justifyContent: 'center', padding: 20 }]}>
      <Text style={[gStyles.title, { textAlign: 'center', fontSize: 28, marginBottom: 30 }]}>Create Account</Text>
      
      <Text style={gStyles.label}>Full Name</Text>
      <TextInput
        style={[gStyles.input, nameError && { borderColor: colors.danger }]}
        placeholder="John Doe"
        value={name}
        onChangeText={(text) => { setName(text); setNameError(''); }}
      />
      {nameError ? <Text style={gStyles.errorText}>{nameError}</Text> : null}

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
        placeholder="At least 6 characters"
        secureTextEntry
        value={password}
        onChangeText={(text) => { setPassword(text); setPasswordError(''); }}
      />
      {passwordError ? <Text style={gStyles.errorText}>{passwordError}</Text> : null}
      
      <TouchableOpacity 
        style={[gStyles.button, { marginTop: 20 }]} 
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={gStyles.buttonText}>{loading ? 'Creating account...' : 'Register'}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={{ marginTop: 20, alignItems: 'center' }}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={{ color: colors.primary, fontWeight: '500' }}>Already have an account? Login</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
