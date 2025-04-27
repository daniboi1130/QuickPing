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
            Alert.alert('Success', `Successfully sent messages to ${sendingContacts.length} contacts.`, [
              { text: 'OK', onPress: completeMessaging }
            ]);
            setIsAutoSending(false);
          }
          setWaitingToSendNext(false);
        }
      }
      setAppState(nextAppState);
    });

    return () => subscription.remove();
  }, [appState, isAutoSending, waitingToSendNext, currentIndex, sendingContacts]);

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
    setIsAutoSending(false);
    setCurrentIndex(0);
    setSelectedLists([]);
    setSelectedContacts([]);
    setCustomMessage('');
    setShowConfirmation(false);
    setShowMessageSelect(false);
    navigation.navigate('ChooseActivity');
  };

  const handleSendMessage = async () => {
    const uniqueContacts = new Set();

    selectedLists.forEach(list => {
      const foundList = contactLists.find(cl => cl.id === list.id);
      if (foundList?.contacts) {
        foundList.contacts.forEach(contact => uniqueContacts.add(JSON.stringify(contact)));
      }
    });
    selectedContacts.forEach(contact => uniqueContacts.add(JSON.stringify(contact)));

    const contactsArray = Array.from(uniqueContacts).map(contact => JSON.parse(contact));

    if (contactsArray.length === 0) {
      Alert.alert('Error', 'No contacts selected.');
      return;
    }

    setSendingContacts(contactsArray);
    setIsAutoSending(true);
    setCurrentIndex(0);
    sendNextMessage(0);
  };

  const sendNextMessage = async (index) => {
    if (index >= sendingContacts.length) {
      Alert.alert('Success', `Successfully sent messages to ${sendingContacts.length} contacts.`, [
        { text: 'OK', onPress: completeMessaging }
      ]);
      setIsAutoSending(false);
      return;
    }

    const contact = sendingContacts[index];
    let phoneNumber = contact.phoneNumber.replace(/\D/g, '');
    if (phoneNumber.startsWith('0')) {
      phoneNumber = phoneNumber.substring(1);
    }
    if (!phoneNumber.startsWith('972')) {
      phoneNumber = '972' + phoneNumber;
    }

    const messageText = encodeURIComponent(customMessage);
    const waUrl = `https://wa.me/${phoneNumber}?text=${messageText}`;

    console.log('Opening WhatsApp link:', waUrl);

    try {
      await Linking.openURL(waUrl);
      setWaitingToSendNext(true);
    } catch (error) {
      console.error('Failed to open WhatsApp:', error);
      Alert.alert('Error', 'Failed to open WhatsApp. Please make sure WhatsApp is installed.');
      setIsAutoSending(false);
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
