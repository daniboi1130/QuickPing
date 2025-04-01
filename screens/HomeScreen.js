import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { auth } from '../Firebase/Config';
import { onAuthStateChanged } from 'firebase/auth';

function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    return unsubscribe;
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Animated.View style={[
        styles.contentContainer,
        { opacity: fadeAnim }
      ]}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Quick Ping</Text>
        <Text style={styles.subtitle}>Instant Messaging Made Simple</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => user ? navigation.navigate('ChooseActivity') : navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>GET STARTED</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 18,
    color: '#4A90E2',
    marginBottom: 60,
    letterSpacing: 1,
    fontWeight: '500',
  },
  button: {
    width: '85%',
    height: 58,
    borderRadius: 12,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});

export default HomeScreen;