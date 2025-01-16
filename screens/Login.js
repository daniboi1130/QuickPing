import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import Header from '../Header/Header'; // Import Header component

const Login = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');

  return (
    <>
      <Header title={'Login'} />
      <View style={styles.container}>
        <Text style={styles.title}>Login</Text>

        {/* Text Input for Phone Number */}
        <TextInput
          style={styles.input}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={(text) => setPhoneNumber(text)}
        />

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>If you don't have an account</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerButton}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 16,
    color: '#333',
  },
  registerButton: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 5,
    fontWeight: 'bold',
  },
});

export default Login;
