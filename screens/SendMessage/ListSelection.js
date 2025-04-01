import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { styles } from './styles';

const ListSelection = ({ 
  contactLists, 
  selectedLists,
  selectedContacts,
  expandedLists,
  setSelectedLists,
  setSelectedContacts,
  setExpandedLists,
  setShowMessageSelect
}) => {
  const toggleListExpansion = (listId) => {
    setExpandedLists(prev => 
      prev.includes(listId) 
        ? prev.filter(id => id !== listId)
        : [...prev, listId]
    );
  };

  const toggleListSelection = (list) => {
    if (selectedLists.find(l => l.id === list.id)) {
      // Remove list and its contacts
      setSelectedLists(prev => prev.filter(l => l.id !== list.id));
      setSelectedContacts(prev => 
        prev.filter(contact => !list.contacts.find(c => c.id === contact.id))
      );
    } else {
      // Add list and all its contacts
      setSelectedLists(prev => [...prev, list]);
      setSelectedContacts(prev => {
        const newContacts = list.contacts.filter(
          contact => !prev.find(c => c.id === contact.id)
        );
        return [...prev, ...newContacts];
      });
    }
  };

  const toggleContactSelection = (contact, listId) => {
    if (selectedContacts.find(c => c.id === contact.id)) {
      // Remove contact
      setSelectedContacts(prev => prev.filter(c => c.id !== contact.id));
      // Check if need to remove list from selectedLists
      const list = contactLists.find(l => l.id === listId);
      if (selectedLists.find(l => l.id === listId)) {
        setSelectedLists(prev => prev.filter(l => l.id !== listId));
      }
    } else {
      // Add contact
      setSelectedContacts(prev => [...prev, contact]);
    }
  };

  const handleContinue = () => {
    if (selectedContacts.length === 0) {
      alert('Please select at least one contact');
      return;
    }
    setShowMessageSelect(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Contacts</Text>
      {contactLists.length > 0 ? (
        <>
          <FlatList
            data={contactLists}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.listItemContainer}>
                <View style={styles.listHeader}>
                  <TouchableOpacity 
                    style={styles.expandButton}
                    onPress={() => toggleListExpansion(item.id)}
                  >
                    <Text style={styles.expandButtonText}>
                      {expandedLists.includes(item.id) ? '▼' : '▶'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.listItem,
                      selectedLists.find(l => l.id === item.id) && styles.selectedList
                    ]}
                    onPress={() => toggleListSelection(item)}
                  >
                    <View style={styles.listInfo}>
                      <Text style={styles.listName}>{item.name}</Text>
                      <Text style={styles.contactCount}>
                        {item.contacts.length} contacts
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
                
                {expandedLists.includes(item.id) && (
                  <View style={styles.contactsContainer}>
                    {item.contacts.map(contact => (
                      <TouchableOpacity
                        key={contact.id}
                        style={[
                          styles.contactItem,
                          selectedContacts.find(c => c.id === contact.id) && styles.selectedContact
                        ]}
                        onPress={() => toggleContactSelection(contact, item.id)}
                      >
                        <Text style={styles.contactName}>
                          {contact.firstName} {contact.lastName}
                        </Text>
                        <Text style={styles.contactPhone}>
                          {contact.phoneNumber}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          />
          {selectedContacts.length > 0 && (
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={handleContinue}
            >
              <Text style={styles.buttonText}>
                Continue with {selectedContacts.length} contacts
              </Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <Text style={styles.noListsText}>No contact lists found</Text>
      )}
    </View>
  );
};

export default ListSelection;