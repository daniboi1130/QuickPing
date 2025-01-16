import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ImageBackground, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Header from '../Header/Header'; // Import Header component


function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <ImageBackground 
        source={require('../assets/Logo.png')}
        style={styles.backgroundImage}
        resizeMode="contain"
      >
        <View style={styles.contentContainer}>
          <Text style={styles.title}>QuickPing</Text>
          <Text style={styles.subtitle}>Send messages quickly and easily</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.buttonText}>Start Messaging</Text>
          </TouchableOpacity>
        </View>
        <StatusBar translucent={true} hidden={true} />
      </ImageBackground>
    </View>
  );
}

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 0,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 20,

    width: '100%',
    paddingBottom: 100,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#007AFF', // iOS blue
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#333333',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
  },
});

export default HomeScreen; 