/**
 * Contact List Management Page
 * 
 * Provides a user interface for managing contact lists in the QuickPinger app.
 * 
 * Features:
 * - Create new contact lists
 * - Edit existing contact lists
 * - Delete contact lists
 * - Filter and search contacts
 * - Toggle between personal and all contacts
 * - Manage list members
 * 
 * @module ContactListPage
 */

/* -------------------------------------------------------------------------- */
/*                               External Imports                             */
/* -------------------------------------------------------------------------- */

/**
 * React Core
 * useState: Manage internal state
 */
import React, { useState } from 'react';

/**
 * React Native Core Components
 * View, Text, TextInput, TouchableOpacity, FlatList, Alert
 * - Build the page layout, text, inputs, buttons, list, and popups
 */
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Alert 
} from 'react-native';

/**
 * React Navigation Hook
 * useFocusEffect: Refresh data every time screen is focused
 */
import { useFocusEffect } from '@react-navigation/native';

/* -------------------------------------------------------------------------- */
/*                               Firebase Imports                             */
/* -------------------------------------------------------------------------- */

/**
 * Firebase Config
 * - Firestore Database (db) and Authentication (auth)
 */
import { db, auth } from '../../Firebase/Config';

/**
 * Firebase Firestore Methods
 * - Collection handling and real-time sync
 */
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc, 
  query, 
  where,
  onSnapshot,
  setDoc
} from 'firebase/firestore';

/* -------------------------------------------------------------------------- */
/*                               Internal Imports                             */
/* -------------------------------------------------------------------------- */

/**
 * Reusable Header Component
 * - Displays consistent app headers
 */
import Header from '../../Header/Header';

/**
 * Stylesheet
 * - Centralized styling for this page
 */
import { styles } from './ListPageStyles';

/* -------------------------------------------------------------------------- */
/*                          ContactListPage Component                         */
/* -------------------------------------------------------------------------- */

/**
 * Main page component
 * @param {object} props - React props
 * @param {object} props.navigation - React Navigation object
 */
const ContactListPage = ({ navigation }) => {

  /* ------------------------------------------------------------------------ */
  /*                             State Management                             */
  /* ------------------------------------------------------------------------ */

  /**
   * Contact List Form State
   */
  const [listName, setListName] = useState(''); // List name input value
  const [contacts, setContacts] = useState([]); // Full contact list
  const [selectedContacts, setSelectedContacts] = useState([]); // Selected contacts for a list

  /**
   * UI Visibility Toggles
   */
  const [showContacts, setShowContacts] = useState(false); // Whether to show contact picker
  const [isCreating, setIsCreating] = useState(false);     // Whether creating a new list
  const [editingList, setEditingList] = useState(null);     // Currently editing list, if any

  /**
   * Search and Filter
   */
  const [searchQuery, setSearchQuery] = useState('');       // Search input text
  const [showAllContacts, setShowAllContacts] = useState(false); // Show all or just personal contacts

  /**
   * Inline Name Editing
   */
  const [editingNameListId, setEditingNameListId] = useState(null); // List ID being renamed
  const [editingNameValue, setEditingNameValue] = useState('');      // New name for list

  /**
   * All User Lists
   */
  const [lists, setLists] = useState([]); // All contact lists belonging to user

  // Add new state for expanded lists
  const [expandedLists, setExpandedLists] = useState([]);

  /* ------------------------------------------------------------------------ */
  /*                     Firebase Realtime Data Synchronization               */
  /* ------------------------------------------------------------------------ */

  /**
   * Listen to Contacts and Lists on Focus
   * Updates lists when contacts are deleted
   */
  useFocusEffect(
    React.useCallback(() => {
      const unsubscribeContacts = onSnapshot(
        query(collection(db, 'contacts')),
        async (snapshot) => {
          const contactsArray = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setContacts(contactsArray);

          // Update all lists to remove deleted contacts
          const listsToUpdate = lists.filter(list => {
            const hasDeletedContacts = list.contacts.some(
              contact => !contactsArray.find(c => c.id === contact.id)
            );
            return hasDeletedContacts;
          });

          // Update each affected list
          for (const list of listsToUpdate) {
            const updatedContacts = list.contacts.filter(contact =>
              contactsArray.find(c => c.id === contact.id)
            );

            try {
              await updateDoc(doc(db, 'contactLists', list.id), {
                contacts: updatedContacts,
                updatedAt: new Date().toISOString()
              });
            } catch (error) {
              console.error(`Error updating list ${list.id}:`, error);
            }
          }

          // Run unlisted contacts check after updates
          await manageUnlistedContacts();
        },
        (error) => {
          console.error('Error syncing contacts:', error);
          Alert.alert('Error', 'Failed to sync contacts.');
        }
      );

      const unsubscribeLists = onSnapshot(
        query(
          collection(db, 'contactLists'),
          where('userId', '==', auth.currentUser?.uid)
        ),
        (snapshot) => {
          const listsArray = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setLists(listsArray);
        },
        (error) => {
          console.error('Error syncing lists:', error);
          Alert.alert('Error', 'Failed to sync lists.');
        }
      );

      return () => {
        unsubscribeContacts();
        unsubscribeLists();
      };
    }, [lists]) // Add lists as dependency
  );

  /* ------------------------------------------------------------------------ */
  /*                            Helper Functions                              */
  /* ------------------------------------------------------------------------ */

  /**
   * Filter contacts based on user filter settings
   * 
   * @returns {Array} - Filtered contacts list
   */
  const getFilteredContacts = () => {
    let filtered = showAllContacts 
      ? contacts 
      : contacts.filter(contact => contact.userId === auth.currentUser?.uid);

    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase();
      filtered = filtered.filter(contact => 
        (contact.firstName?.toLowerCase() || '').includes(queryLower) ||
        (contact.lastName?.toLowerCase() || '').includes(queryLower) ||
        (contact.phoneNumber?.toLowerCase() || '').includes(queryLower)
      );
    }

    return filtered;
  };

  /**
   * Toggle contact selection (add/remove contact from selected)
   * 
   * @param {Object} contact - Contact object
   */
  const toggleContactSelection = (contact) => {
    if (selectedContacts.some(c => c.id === contact.id)) {
      setSelectedContacts(prev => prev.filter(c => c.id !== contact.id));
    } else {
      setSelectedContacts(prev => [...prev, contact]);
    }
  };

  /**
   * Toggle list expansion to show/hide contacts
   * 
   * @param {string} listId - ID of the list to toggle
   */
  const toggleListExpansion = (listId) => {
    setExpandedLists(prev => 
      prev.includes(listId) 
        ? prev.filter(id => id !== listId)
        : [...prev, listId]
    );
  };

  const SYSTEM_LIST_NAME = 'UnlistedContacts';

  /**
   * Check and manage unlisted personal contacts
   * Creates or updates a system list containing personal contacts not in other lists
   */
  const manageUnlistedContacts = async () => {
    try {
      // Get all personal contacts
      const personalContacts = contacts.filter(
        contact => contact.userId === auth.currentUser?.uid
      );

      // Get all personal lists
      const personalLists = lists.filter(
        list => list.userId === auth.currentUser?.uid && list.name !== SYSTEM_LIST_NAME
      );

      // Find contacts that are in personal lists
      const listedContactIds = new Set();
      personalLists.forEach(list => {
        list.contacts.forEach(contact => listedContactIds.add(contact.id));
      });

      // Find personal contacts not in any personal list
      const unlistedContacts = personalContacts.filter(
        contact => !listedContactIds.has(contact.id)
      );

      // Find existing UnlistedContacts list
      const systemList = lists.find(
        list => list.userId === auth.currentUser?.uid && list.name === SYSTEM_LIST_NAME
      );

      if (unlistedContacts.length > 0) {
        const listData = {
          name: SYSTEM_LIST_NAME,
          contacts: unlistedContacts,
          updatedAt: new Date().toISOString(),
          isSystemList: true,
          userId: auth.currentUser?.uid
        };

        if (systemList) {
          await updateDoc(doc(db, 'contactLists', systemList.id), listData);
        } else {
          await addDoc(collection(db, 'contactLists'), {
            ...listData,
            createdAt: new Date().toISOString()
          });
        }
      } else if (systemList) {
        // Delete UnlistedContacts if all contacts are in lists
        await deleteDoc(doc(db, 'contactLists', systemList.id));
      }
    } catch (error) {
      console.error('Error managing unlisted contacts:', error);
    }
  };

  /**
   * Save (Create or Update) Contact List to Firebase
   */
  const handleSaveList = async () => {
    if (selectedContacts.length === 0) {
      Alert.alert('Error', 'Please select at least one contact.');
      return;
    }

    try {
      const listData = {
        name: listName,
        contacts: selectedContacts,
        updatedAt: new Date().toISOString()
      };

      if (editingList) {
        await updateDoc(doc(db, 'contactLists', editingList.id), listData);
      } else {
        await addDoc(collection(db, 'contactLists'), {
          ...listData,
          createdAt: new Date().toISOString(),
          userId: auth.currentUser?.uid
        });
      }

      // Check for unlisted contacts after saving
      await manageUnlistedContacts();

      resetForm();
      Alert.alert('Success', editingList ? 'List updated!' : 'List created!');
    } catch (error) {
      console.error('Error saving list:', error);
      Alert.alert('Error', 'Failed to save list.');
    }
  };

  /**
   * Delete Contact List from Firebase
   * 
   * @param {string} listId - ID of the list to delete
   */
  const handleDeleteList = (listId) => {
    Alert.alert(
      'Delete List',
      'This action cannot be undone. Do you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'contactLists', listId));
              Alert.alert('Deleted', 'List successfully deleted.');
            } catch (error) {
              console.error('Error deleting list:', error);
              Alert.alert('Error', 'Failed to delete list.');
            }
          }
        }
      ]
    );
  };

  /**
   * Update Name of an Existing List
   * 
   * @param {string} listId - ID of the list
   * @param {string} newName - New name to set
   */
  const handleUpdateListName = async (listId, newName) => {
    if (!newName.trim()) return;
    try {
      await updateDoc(doc(db, 'contactLists', listId), {
        name: newName,
        updatedAt: new Date().toISOString()
      });
      setEditingNameListId(null);
      setEditingNameValue('');
    } catch (error) {
      console.error('Error updating list name:', error);
      Alert.alert('Error', 'Failed to update name.');
    }
  };

  /**
   * Reset Form to Default Values
   */
  const resetForm = () => {
    setListName('');
    setSelectedContacts([]);
    setIsCreating(false);
    setEditingList(null);
    setShowContacts(false);
    setSearchQuery('');
  };

  /**
   * Handle Cancel Button Click
   */
  const handleCancel = () => {
    resetForm();
  };

  /* ------------------------------------------------------------------------ */
  /*                            Render Component                              */
  /* ------------------------------------------------------------------------ */

  return (
    <>
      {/* Page Header */}
      <Header title="Contact Lists" />

      <View style={styles.container}>

        {/* Show List of Contact Lists */}
        {!isCreating && !editingList ? (
          <>
            {/* Create New List Button */}
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => setIsCreating(true)}
            >
              <Text style={styles.buttonText}>Create New List</Text>
            </TouchableOpacity>

            {/* List Existing Contact Lists */}
            <FlatList
              data={lists}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  {/* List Header with Expand Button */}
                  <View style={styles.listHeader}>
                    <TouchableOpacity 
                      style={styles.expandButton}
                      onPress={() => toggleListExpansion(item.id)}
                    >
                      <Text style={styles.expandButtonText}>
                        {expandedLists.includes(item.id) ? '▼' : '▶'}
                      </Text>
                    </TouchableOpacity>

                    {/* List Name and Inline Edit */}
                    <View style={styles.nameContainer}>
                      <Text style={styles.listName}>{item.name}</Text>
                      {!item.isSystemList && (
                        <TouchableOpacity
                          onPress={() => {
                            setEditingNameListId(item.id);
                            setEditingNameValue(item.name);
                          }}
                        >
                          <Text style={styles.editNameIcon}>✎</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Contact Count */}
                  <Text style={styles.contactCount}>{item.contacts.length} contacts</Text>

                  {/* Expanded Contacts List */}
                  {expandedLists.includes(item.id) && (
                    <View style={styles.expandedContacts}>
                      {item.contacts.map(contact => (
                        <View key={contact.id} style={styles.expandedContactItem}>
                          <Text style={styles.contactName}>
                            {contact.firstName} {contact.lastName}
                          </Text>
                          <Text style={styles.contactPhone}>
                            {contact.phoneNumber}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Edit and Delete Buttons */}
                  {!item.isSystemList && (
                    <View style={styles.listActions}>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => {
                          setEditingList(item);
                          setListName(item.name);
                          setSelectedContacts(item.contacts);
                          setIsCreating(true);
                          setShowContacts(true);
                        }}
                      >
                        <Text style={styles.actionButtonText}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDeleteList(item.id)}
                      >
                        <Text style={styles.actionButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            />
          </>
        ) : (
          <>
            {/* Show Create List or Contact Picker */}
            {showContacts ? (
              <>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.backButtonText}>Cancel</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Select contacts for "{listName}"</Text>

                <TouchableOpacity 
                  style={[styles.filterButton, showAllContacts ? styles.filterButtonActive : styles.filterButtonInactive]}
                  onPress={() => setShowAllContacts(!showAllContacts)}
                >
                  <Text style={styles.filterButtonText}>
                    {showAllContacts ? 'All Contacts' : 'Personal Contacts'}
                  </Text>
                </TouchableOpacity>

                {/* Search Bar */}
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search contacts..."
                  placeholderTextColor="#666"
                />

                {/* List of Filtered Contacts */}
                <FlatList
                  data={getFilteredContacts()}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.contactItem,
                        selectedContacts.some(c => c.id === item.id) && styles.selectedContact
                      ]}
                      onPress={() => toggleContactSelection(item)}
                    >
                      <Text style={styles.contactText}>
                        {item.firstName} {item.lastName}
                      </Text>
                      <Text style={styles.phoneText}>{item.phoneNumber}</Text>
                    </TouchableOpacity>
                  )}
                />

                {/* Save Button */}
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleSaveList}
                >
                  <Text style={styles.buttonText}>Save List</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.nameInputContainer}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.backButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.input}
                  value={listName}
                  onChangeText={setListName}
                  placeholder="Enter list name"
                />

                <TouchableOpacity 
                  style={styles.createButton}
                  onPress={handleCreateList}
                >
                  <Text style={styles.buttonText}>Create</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </>
  );
};

export default ContactListPage;
