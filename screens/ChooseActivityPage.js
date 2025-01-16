import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Header from '../Header/Header'; // Adjust the path as necessary

const ChooseActivityPage = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Header title="Choose Activity" /> {/* Use the Header component */}
      <Text style={styles.headerText}>What would you like to do?</Text>
      
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Send Message</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('ContactsEditorPage')}
      >
        <Text style={styles.buttonText}>Edit Saved Contacts</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('MessageEditorPage')}
      >
        <Text style={styles.buttonText}>Edit Saved Messages</Text>
      </TouchableOpacity>
    </View>
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
    width: 200,
    height: 50,
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
