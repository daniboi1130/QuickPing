import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { db, auth } from '../../Firebase/Config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { styles } from './styles';

const SYSTEM_LIST_NAME = 'UnlistedContacts';

const ListSelection = ({ 
  contactLists, 
  selectedLists,
  selectedContacts,
  expandedLists,
  setSelectedLists,
  setSelectedContacts,
  setExpandedLists,
  setShowMessageSelect,
  setContactLists
}) => {
  useFocusEffect(
    React.useCallback(() => {
      if (!auth.currentUser) {
        console.warn('No authenticated user');
        return;
      }

      // Listen for contacts changes first
      const unsubscribeContacts = onSnapshot(
        query(collection(db, 'contacts')),
        async (contactsSnapshot) => {
          const contactsData = contactsSnapshot.docs.reduce((acc, doc) => {
            acc[doc.id] = { id: doc.id, ...doc.data() };
            return acc;
          }, {});

          // Then listen for lists and update with latest contact data
          const unsubscribeLists = onSnapshot(
            query(
              collection(db, 'contactLists'),
              where('userId', '==', auth.currentUser.uid)
            ),
            (listsSnapshot) => {
              const listsData = listsSnapshot.docs.map(doc => {
                const listData = doc.data();
                // Update contact data in each list with latest data
                const updatedContacts = listData.contacts.map(contact => 
                  contactsData[contact.id] || contact
                );

                return {
                  id: doc.id,
                  ...listData,
                  contacts: updatedContacts
                };
              });

              // Sort lists (UnlistedContacts at the end)
              const sortedLists = listsData.sort((a, b) => {
                if (a.name === SYSTEM_LIST_NAME) return 1;
                if (b.name === SYSTEM_LIST_NAME) return -1;
                return a.name.localeCompare(b.name);
              });

              // Update selected contacts with latest data
              setSelectedContacts(prev => 
                prev.map(contact => contactsData[contact.id] || contact)
              );

              setContactLists(sortedLists);
            }
          );

          // Clean up lists listener when contacts change
          return () => unsubscribeLists();
        }
      );

      // Clean up contacts listener on unmount
      return () => unsubscribeContacts();
    }, [auth.currentUser?.uid])
  );

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

  const renderContactItem = (contact, listId) => {
    const isSelected = selectedContacts.find(c => c.id === contact.id);
    
    return (
      <TouchableOpacity
        key={contact.id}
        style={[
          styles.contactItem,
          isSelected && styles.selectedContact
        ]}
        onPress={() => toggleContactSelection(contact, listId)}
      >
        <View style={styles.contactRow}>
          {contact.photoUri ? (
            <Image 
              source={{ uri: contact.photoUri }}
              style={styles.contactImage}
            />
          ) : (
            <View style={styles.contactInitials}>
              <Text style={styles.initialsText}>
                {contact.firstName?.[0]}{contact.lastName?.[0]}
              </Text>
            </View>
          )}
          <View style={styles.contactDetails}>
            <Text style={styles.contactName}>
              {contact.firstName} {contact.lastName}
            </Text>
            <Text style={styles.contactPhone}>
              {contact.phoneNumber}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
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
                    {item.contacts.map(contact => renderContactItem(contact, item.id))}
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