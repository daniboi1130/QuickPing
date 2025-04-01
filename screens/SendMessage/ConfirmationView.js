import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { styles } from './styles';

const ConfirmationView = ({
  selectedLists,
  selectedContacts,
  contactLists,
  customMessage,
  getTotalContacts,
  handleBack,
  handleSendMessage
}) => {
  const getAffectedLists = () => {
    return contactLists.filter(list => 
      selectedLists.find(l => l.id === list.id) || 
      list.contacts.some(contact => selectedContacts.find(sc => sc.id === contact.id))
    );
  };

  const getListSummary = (list) => {
    if (selectedLists.find(l => l.id === list.id)) {
      return `All contacts selected (${list.contacts.length})`;
    }
    
    const selectedFromList = selectedContacts.filter(selectedContact => 
      list.contacts.find(contact => contact.id === selectedContact.id)
    ).length;

    return `${selectedFromList} out of ${list.contacts.length} contacts selected`;
  };

  return (
    <View style={styles.confirmationContainer}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={handleBack}
      >
        <Text style={styles.backButtonText}>← Back to Message</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Confirm Details</Text>
      
      <View style={styles.confirmationBody}>
        <View style={styles.confirmationSection}>
          <Text style={styles.subtitle}>Selected From Lists</Text>
          <View style={styles.listsContainer}>
            <FlatList
              data={getAffectedLists()}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.selectedListItem}>
                  <Text style={styles.listName}>{item.name}</Text>
                  <Text style={styles.contactCount}>
                    {getListSummary(item)}
                  </Text>
                </View>
              )}
              style={styles.listScroll}
            />
          </View>
        </View>
        
        <Text style={styles.totalContacts}>
          Total Selected: {getTotalContacts()} contacts
        </Text>

        <View style={styles.confirmationSection}>
          <Text style={styles.subtitle}>Message Preview</Text>
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{customMessage}</Text>
          </View>
        </View>

        <Text style={styles.automatedNote}>
          Messages will be sent automatically using WhatsApp
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.sendButton}
        onPress={handleSendMessage}
      >
        <Text style={styles.buttonText}>Start Automated Sending</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ConfirmationView;