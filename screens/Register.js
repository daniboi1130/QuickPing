import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Header from '../Header/Header'; // Import Header component

const Register = ({ navigation }) => {
  return (  <><Header title={'Register'}/>
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>Already have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginButton}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  </>);
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 16,
    color: '#333',
  },
  loginButton: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 5,
    fontWeight: 'bold',
  },
});

export default Register;
