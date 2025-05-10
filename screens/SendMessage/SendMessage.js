import React, { useState, useEffect } from 'react';
import { View, Alert, Linking, Text, TouchableOpacity, AppState } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../../Firebase/Config';
import Header from '../../Header/Header';
import ListSelection from './ListSelection';
import MessageComposition from './MessageComposition';
import ConfirmationView from './ConfirmationView';
import { styles } from './styles';

const SendMessage = () => {
  const navigation = useNavigation(); // Add this at the top with other hooks
  
  const [contactLists, setContactLists] = useState([]);
  const [savedMessages, setSavedMessages] = useState([]);
  const [selectedLists, setSelectedLists] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [customMessage, setCustomMessage] = useState('');
  const [showMessageSelect, setShowMessageSelect] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isAutoSending, setIsAutoSending] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedLists, setExpandedLists] = useState([]);
  const [sendingContacts, setSendingContacts] = useState([]);
  const [waitingToSendNext, setWaitingToSendNext] = useState(false);

  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    fetchContactLists();
    fetchSavedMessages();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        if (isAutoSending && waitingToSendNext) {
          const nextIndex = currentIndex + 1;
          if (nextIndex < sendingContacts.length) {
            setCurrentIndex(nextIndex);
            sendNextMessage(nextIndex);
          } else {
            // All messages sent
            Alert.alert(
              'Success', 
              `Successfully sent messages to ${sendingContacts.length} contacts.`,
              [{ text: 'OK', onPress: completeMessaging }]
            );
          }
          setWaitingToSendNext(false);
        }
      }
      setAppState(nextAppState);
    });

    return () => subscription.remove();
  }, [appState, isAutoSending, waitingToSendNext, currentIndex, sendingContacts]);

  useEffect(() => {
    // Cleanup on component unmount
    return () => {
      if (isAutoSending) {
        completeMessaging();
      }
    };
  }, []);

  const fetchContactLists = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const q = query(collection(db, 'contactLists'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const lists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setContactLists(lists);
    } catch (error) {
      console.error('Error fetching contact lists:', error);
    }
  };

  const fetchSavedMessages = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const q = query(collection(db, 'messages'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSavedMessages(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleBack = () => {
    if (showConfirmation) {
      setShowConfirmation(false);
      setShowMessageSelect(true);
    } else if (showMessageSelect) {
      setShowMessageSelect(false);
    }
  };

  const handleConfirmMessage = () => {
    if (!customMessage.trim()) {
      Alert.alert('Error', 'Please enter a message.');
      return;
    }
    setShowConfirmation(true);
    setShowMessageSelect(false);
  };

  const getTotalContacts = () => selectedContacts.length;

  const completeMessaging = () => {
    // Reset all states
    setIsAutoSending(false);
    setCurrentIndex(0);
    setSendingContacts([]);
    setSelectedLists([]);
    setSelectedContacts([]);
    setCustomMessage('');
    setShowConfirmation(false);
    setShowMessageSelect(false);
    setWaitingToSendNext(false);
    setExpandedLists([]);
  };

  const handleSendMessage = async () => {
    try {
      // Basic validations
      if (!customMessage.trim()) {
        Alert.alert('Error', 'Please enter a message');
        return;
      }
  
      // Collect all contacts from lists and individual selections
      const allContacts = [];
      
      // Add contacts from selected lists
      selectedLists.forEach(list => {
        const foundList = contactLists.find(cl => cl.id === list.id);
        if (foundList?.contacts) {
          allContacts.push(...foundList.contacts);
        }
      });
  
      // Add individual contacts
      allContacts.push(...selectedContacts);
  
      // Remove duplicates and invalid contacts
      const validContacts = [...new Set(allContacts.filter(c => c?.phoneNumber))];
  
      if (validContacts.length === 0) {
        Alert.alert('Error', 'No valid contacts selected');
        return;
      }
  
      // Start sending process
      setSendingContacts(validContacts);
      setCurrentIndex(0);
      setIsAutoSending(true);
      
      // Send first message
      sendNextMessage(0, validContacts);
    } catch (error) {
      Alert.alert('Error', 'Failed to start sending messages');
    }
  };
  
  const sendNextMessage = async (index, contacts = sendingContacts) => {
    try {
      if (index >= contacts.length) {
        Alert.alert(
          'Success', 
          `Sent messages to ${contacts.length} contacts`,
          [{ 
            text: 'OK', 
            onPress: () => {
              setIsAutoSending(false);
              navigation.navigate('ChooseActivity');
            }
          }]
        );
        return;
      }
  
      // Get current contact
      const contact = contacts[index];
      let phoneNumber = contact.phoneNumber.replace(/\D/g, '');
      
      // Format number
      if (phoneNumber.startsWith('0')) {
        phoneNumber = phoneNumber.substring(1);
      }
      if (!phoneNumber.startsWith('972')) {
        phoneNumber = '972' + phoneNumber;
      }
  
      // Open WhatsApp
      const message = encodeURIComponent(customMessage);
      const waUrl = `https://wa.me/${phoneNumber}?text=${message}`;
      await Linking.openURL(waUrl);
      
      // Wait for next
      setWaitingToSendNext(true);
      setCurrentIndex(index);
  
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to send message',
        [
          { 
            text: 'Stop', 
            onPress: () => {
              setIsAutoSending(false);
              navigation.navigate('ChooseActivity');
            }
          },
          { text: 'Skip', onPress: () => sendNextMessage(index + 1, contacts) }
        ]
      );
    }
  };

  const ProgressIndicator = () => (
    <View style={styles.progressContainer}>
      <Text style={styles.progressText}>
        Sending message {currentIndex + 1} of {sendingContacts.length}
      </Text>
      <TouchableOpacity style={styles.cancelButton} onPress={() => setIsAutoSending(false)}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <Header title="Send Message" />
      <View style={styles.container}>
        {isAutoSending ? (
          <ProgressIndicator />
        ) : !showMessageSelect && !showConfirmation ? (
          <ListSelection
            contactLists={contactLists}
            setContactLists={setContactLists}  // Add this prop
            selectedLists={selectedLists}
            selectedContacts={selectedContacts}
            expandedLists={expandedLists}
            setSelectedLists={setSelectedLists}
            setSelectedContacts={setSelectedContacts}
            setExpandedLists={setExpandedLists}
            setShowMessageSelect={setShowMessageSelect}
            getTotalContacts={getTotalContacts}
          />
        ) : showMessageSelect ? (
          <MessageComposition
            savedMessages={savedMessages}
            customMessage={customMessage}
            setCustomMessage={setCustomMessage}
            handleBack={handleBack}
            handleConfirmMessage={handleConfirmMessage}
          />
        ) : (
          <ConfirmationView
            selectedLists={selectedLists}
            selectedContacts={selectedContacts}
            contactLists={contactLists}
            customMessage={customMessage}
            getTotalContacts={getTotalContacts}
            handleBack={handleBack}
            handleSendMessage={handleSendMessage}
          />
        )}
      </View>
    </>
  );
};

export default SendMessage;
