import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { db, auth } from '../../Firebase/Config';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import Header from '../../Header/Header';
import { styles } from './ListPageStyles';

const ContactListPage = ({ navigation }) => {
  const [listName, setListName] = useState('');
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [showContacts, setShowContacts] = useState(false);
  const [lists, setLists] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNameListId, setEditingNameListId] = useState(null);
  const [editingNameValue, setEditingNameValue] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      const fetchContacts = async () => {
        try {
          const userId = auth.currentUser?.uid;
          if (!userId) return;

          const q = query(
            collection(db, 'contacts'),
            where('userId', '==', userId)
          );
          
          const querySnapshot = await getDocs(q);
          const contactsList = [];
          querySnapshot.forEach((doc) => {
            contactsList.push({ id: doc.id, ...doc.data() });
          });
          setContacts(contactsList);
        } catch (error) {
          console.error("Error fetching contacts:", error);
        }
      };

      fetchContacts();
    }, [])
  );

  const fetchLists = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const q = query(
        collection(db, 'contactLists'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const listData = [];
      querySnapshot.forEach((doc) => {
        listData.push({ id: doc.id, ...doc.data() });
      });
      setLists(listData);
    } catch (error) {
      console.error("Error fetching lists:", error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchLists();
    }, [])
  );

  const handleCreateList = () => {
    if (listName.trim()) {
      setShowContacts(true);
    }
  };

  const toggleContactSelection = (contact) => {
    setSelectedContacts(prev => {
      const exists = prev.find(c => c.id === contact.id);
      return exists 
        ? prev.filter(c => c.id !== contact.id)
        : [...prev, contact];
    });
  };

  const handleSaveList = async () => {
    try {
      if (selectedContacts.length === 0) {
        alert('Please select at least one contact');
        return;
      }

      if (editingList) {
        await updateDoc(doc(db, 'contactLists', editingList.id), {
          name: listName,
          contacts: selectedContacts,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'contactLists'), {
          name: listName,
          contacts: selectedContacts,
          createdAt: new Date().toISOString(),
          userId: auth.currentUser?.uid
        });
      }

      setListName('');
      setSelectedContacts([]);
      setShowContacts(false);
      setIsCreating(false);
      setEditingList(null);
      
      await fetchLists();
      alert(editingList ? 'List updated successfully!' : 'Contact list saved successfully!');
    } catch (error) {
      console.error("Error saving contact list:", error);
      alert('Error saving contact list');
    }
  };

  const handleDeleteList = async (listId) => {
    Alert.alert(
      "Delete List",
      "This action is irreversible. Are you sure you want to delete this list?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'contactLists', listId));
              await fetchLists();
              alert('List deleted successfully');
            } catch (error) {
              console.error("Error deleting list:", error);
              alert('Error deleting list');
            }
          }
        }
      ]
    );
  };

  const handleUpdateListName = async (listId, newName) => {
    try {
      await updateDoc(doc(db, 'contactLists', listId), {
        name: newName,
        updatedAt: new Date().toISOString()
      });
      await fetchLists();
      setEditingNameListId(null);
      setEditingNameValue('');
    } catch (error) {
      console.error("Error updating list name:", error);
      alert('Error updating list name');
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const query = searchQuery.toLowerCase();
    const firstName = contact.firstName?.toLowerCase() || '';
    const lastName = contact.lastName?.toLowerCase() || '';
    const phone = contact.phoneNumber?.toLowerCase() || '';

    return firstName.includes(query) || 
           lastName.includes(query) || 
           phone.includes(query);
  });

  const handleCancel = () => {
    setIsCreating(false);
    setEditingList(null);
    setListName('');
    setSelectedContacts([]);
    setShowContacts(false);
    setSearchQuery('');
  };

  return (
    <>
      <Header title="Contact Lists" />
      <View style={styles.container}>
        {!isCreating && !editingList ? (
          <>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => setIsCreating(true)}
            >
              <Text style={styles.buttonText}>Create New List</Text>
            </TouchableOpacity>

            <FlatList
              data={lists}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <View style={styles.nameContainer}>
                    {editingNameListId === item.id ? (
                      <View style={styles.nameEditContainer}>
                        <TextInput
                          style={styles.nameEditInput}
                          value={editingNameValue}
                          onChangeText={setEditingNameValue}
                          autoFocus
                          onBlur={() => {
                            if (editingNameValue.trim()) {
                              handleUpdateListName(item.id, editingNameValue);
                            }
                            setEditingNameListId(null);
                          }}
                          onSubmitEditing={() => {
                            if (editingNameValue.trim()) {
                              handleUpdateListName(item.id, editingNameValue);
                            }
                            setEditingNameListId(null);
                          }}
                        />
                      </View>
                    ) : (
                      <View style={styles.nameRow}>
                        <Text style={styles.listName}>{item.name}</Text>
                        <TouchableOpacity 
                          style={styles.editNameButton}
                          onPress={() => {
                            setEditingNameListId(item.id);
                            setEditingNameValue(item.name);
                          }}
                        >
                          <Text style={styles.editNameIcon}>✎</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  <Text style={styles.contactCount}>
                    {item.contacts.length} contacts
                  </Text>
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
                </View>
              )}
            />
          </>
        ) : (
          <>
            {showContacts ? (
              <>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.backButtonText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Select contacts for "{listName}"</Text>
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search contacts..."
                  placeholderTextColor="#666"
                />
                <FlatList
                  data={filteredContacts}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.contactItem,
                        selectedContacts.find(c => c.id === item.id) && styles.selectedContact
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