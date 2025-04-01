import React, { useState } from 'react';
import { Linking, View, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { db, auth } from '../../Firebase/Config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Header from '../../Header/Header';
import ListSelection from './ListSelection';
import MessageComposition from './MessageComposition';
import ConfirmationView from './ConfirmationView';
import { styles } from './styles';
import { AccessibilityInfo, findNodeHandle, NativeModules, Platform } from 'react-native';

const SendMessage = () => {
  const navigation = useNavigation();
  const [contactLists, setContactLists] = useState([]);
  const [selectedLists, setSelectedLists] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [customMessage, setCustomMessage] = useState('');
  const [savedMessages, setSavedMessages] = useState([]);
  const [showMessageSelect, setShowMessageSelect] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [expandedLists, setExpandedLists] = useState([]);
  const [isAutoSending, setIsAutoSending] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      fetchContactLists();
      fetchSavedMessages();
    }, [])
  );

  const fetchContactLists = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const q = query(
        collection(db, 'contactLists'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const lists = [];
      querySnapshot.forEach((doc) => {
        lists.push({ id: doc.id, ...doc.data() });
      });
      setContactLists(lists);
    } catch (error) {
      console.error("Error fetching contact lists:", error);
    }
  };

  const fetchSavedMessages = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const q = query(
        collection(db, 'messages'),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const messagesList = [];
      querySnapshot.forEach((doc) => {
        messagesList.push({ id: doc.id, ...doc.data() });
      });
      setSavedMessages(messagesList);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleBack = () => {
    if (showConfirmation) {
      // When in confirmation view, go back to message composition
      setShowConfirmation(false);
      setShowMessageSelect(true); // Add this line
    } else if (showMessageSelect) {
      // When in message composition, go back to list selection
      setShowMessageSelect(false);
    }
  };

  const handleSendMessage = async () => {
    const uniqueContacts = new Set();
    
    selectedLists.forEach(list => {
      list.contacts.forEach(contact => uniqueContacts.add(contact));
    });
    selectedContacts.forEach(contact => uniqueContacts.add(contact));

    const contactsArray = Array.from(uniqueContacts);
    setIsAutoSending(true);
    await sendMessages(contactsArray);
  };

  const sendMessages = async (contacts) => {
    try {
      for (let i = 0; i < contacts.length; i++) {
        if (!isAutoSending) break; // Allow cancellation

        const contact = contacts[i];
        setCurrentIndex(i);

        // Format phone number
        const cleanNumber = contact.phoneNumber.replace(/\D/g, '');
        const fullNumber = cleanNumber.startsWith('972') 
          ? cleanNumber 
          : `972${cleanNumber.startsWith('0') ? cleanNumber.substring(1) : cleanNumber}`;

        // Open WhatsApp chat
        const url = `whatsapp://send?text=${encodeURIComponent(customMessage)}&phone=+${fullNumber}`;
        await Linking.openURL(url);

        // Wait between messages
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Reset everything when done
      completeMessaging();
    } catch (error) {
      console.error('Error in sending:', error);
      alert('Error sending messages. Please try again.');
    }
  };

  const sendAutomatedMessages = async (contacts) => {
    try {
      const enabled = await AccessibilityInfo.isScreenReaderEnabled();
      if (!enabled) {
        Alert.alert(
          'Accessibility Service Required',
          'Please enable Accessibility Service to use automated sending',
          [
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'android') {
                  Linking.openSettings();
                  // or more specifically for accessibility:
                  // Linking.sendIntent('android.settings.ACCESSIBILITY_SETTINGS');
                }
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ],
        );
        return;
      }

      for (let i = 0; i < contacts.length; i++) {
        if (!isAutoSending) break; // Allow cancellation

        const contact = contacts[i];
        setCurrentIndex(i);

        // Format phone number
        const cleanNumber = contact.phoneNumber.replace(/\D/g, '');
        const fullNumber = cleanNumber.startsWith('972') 
          ? cleanNumber 
          : `972${cleanNumber.startsWith('0') ? cleanNumber.substring(1) : cleanNumber}`;

        // Open WhatsApp chat
        const url = `whatsapp://send?text=${encodeURIComponent(customMessage)}&phone=+${fullNumber}`;
        await Linking.openURL(url);

        // Wait for WhatsApp to open
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Try to auto-send using accessibility service
        if (NativeModules.AccessibilityBridge) {
          const screenElements = await NativeModules.AccessibilityBridge.getScreenElements();
          const sendButton = screenElements.find(element => 
            element.className === 'android.widget.ImageButton' && 
            element.contentDescription?.includes('Send')
          );

          if (sendButton?.nodeId) {
            await NativeModules.AccessibilityBridge.clickOnElement(sendButton.nodeId);
            console.log(`Message sent to ${fullNumber}`);
          }
        }

        // Wait between messages
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Reset everything when done
      completeMessaging();
    } catch (error) {
      console.error('Error in automated sending:', error);
      alert('Error sending messages automatically. Falling back to manual mode.');
      sendManualMessages(contacts);
    }
  };

  const sendManualMessages = (contacts) => {
    contacts.forEach((contact, index) => {
      setTimeout(() => {
        const cleanNumber = contact.phoneNumber.replace(/\D/g, '');
        const fullNumber = cleanNumber.startsWith('972') 
          ? cleanNumber 
          : `972${cleanNumber.startsWith('0') ? cleanNumber.substring(1) : cleanNumber}`;

        const url = `whatsapp://send?text=${encodeURIComponent(customMessage)}&phone=+${fullNumber}`;
        Linking.openURL(url);
      }, index * 3000);
    });
  };

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

  const handleConfirmMessage = () => {
    if (!customMessage.trim()) {
      alert('Please enter a message');
      return;
    }
    setShowConfirmation(true);
    setShowMessageSelect(false);
  };

  const getTotalContacts = () => selectedContacts.length;

  // Add this component inside SendMessage but before the return statement
  const ProgressIndicator = () => (
    <View style={styles.progressContainer}>
      <Text style={styles.progressText}>
        Sending message {currentIndex + 1} of {contactsArray.length}
      </Text>
      <TouchableOpacity 
        style={styles.cancelButton}
        onPress={() => setIsAutoSending(false)}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <Header title="Send Message" />
      <View style={styles.container}>
        {!showMessageSelect && !showConfirmation ? (
          <ListSelection 
            contactLists={contactLists}
            selectedLists={selectedLists}
            selectedContacts={selectedContacts}
            expandedLists={expandedLists}
            setSelectedLists={setSelectedLists}
            setSelectedContacts={setSelectedContacts}
            setExpandedLists={setExpandedLists}
            setShowMessageSelect={setShowMessageSelect}
            getTotalContacts={getTotalContacts} // Add this prop
          />
        ) : showMessageSelect && !showConfirmation ? (
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
            contactLists={contactLists} // Add this prop
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