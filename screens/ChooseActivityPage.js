import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Header from '../Header/Header';
import { auth } from '../Firebase/Config';

const ChooseActivityPage = ({ navigation }) => {
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (auth.currentUser) {
      setUserEmail(auth.currentUser.email || '');
    }
  }, []);

  return (<>
    <Header title="Choose Activity" noBack={true}/>
    <View style={styles.container}>
      <Text style={styles.headerText}>Hello {userEmail}</Text>
      <Text style={styles.headerText}>What would you like to do?</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('SendMessage')}
      >
        <Text style={styles.buttonText}>Send Message</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('ContactsEditor')}
      >
        <Text style={styles.buttonText}>Edit Saved Contacts</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('MessageEditor')}
      >
        <Text style={styles.buttonText}>Edit Saved Texts</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('ContactList')}
      >
        <Text style={styles.buttonText}>Create Contact List</Text>
      </TouchableOpacity>
    </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10,
    width: 250,
    height: 55,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
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

export default ChooseActivityPage;
