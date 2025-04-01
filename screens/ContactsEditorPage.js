import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import Header from '../Header/Header'; // Import Header component
import { db, auth } from '../Firebase/Config';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useFocusEffect } from '@react-navigation/native';

const ContactsEditorPage = () => {
  const [contacts, setContacts] = useState([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const fetchContacts = async () => {
        if (!user) return; // Don't fetch if not authenticated
        
        try {
          const q = query(
            collection(db, 'contacts'),
            where('userId', '==', user.uid)
          );
          
          const querySnapshot = await getDocs(q);
          const contactsList = [];
          querySnapshot.forEach((doc) => {
            contactsList.push({ id: doc.id, ...doc.data() });
          });
          setContacts(contactsList);
        } catch (error) {
          console.error("Error fetching contacts: ", error);
        }
      };
      
      fetchContacts();
    }, [user])
  );

  const addContact = async () => {
    // Validate phone number length
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, ''); // Remove non-digits
    if (cleanPhoneNumber.length < 10) {
      alert('Phone number must be at least 10 digits');
      return;
    }

    if (firstName && lastName && phoneNumber) {
      try {
        if (editingId) {
          // Update existing contact
          const contactRef = doc(db, 'contacts', editingId);
          await updateDoc(contactRef, {
            firstName,
            lastName,
            phoneNumber: cleanPhoneNumber, // Store clean phone number
            userId: auth.currentUser?.uid
          });
          
          setContacts(
            contacts.map((contact) =>
              contact.id === editingId
                ? { ...contact, firstName, lastName, phoneNumber: cleanPhoneNumber }
                : contact
            )
          );
          setEditingId(null);
        } else {
          // Add new contact
          const docRef = await addDoc(collection(db, 'contacts'), {
            firstName,
            lastName,
            phoneNumber: cleanPhoneNumber, // Store clean phone number
            userId: auth.currentUser?.uid,
            createdAt: new Date().toISOString()
          });
          
          setContacts([
            ...contacts,
            {
              id: docRef.id,
              firstName,
              lastName,
              phoneNumber: cleanPhoneNumber,
            },
          ]);
        }
        
        // Clear form
        setFirstName('');
        setLastName('');
        setPhoneNumber('');
      } catch (error) {
        console.error("Error adding/updating contact: ", error);
      }
    }
  };

  const editContact = (contact) => {
    setFirstName(contact.firstName);
    setLastName(contact.lastName);
    setPhoneNumber(contact.phoneNumber);
    setEditingId(contact.id);
  };

  const deleteContact = async (id) => {
    try {
      await deleteDoc(doc(db, 'contacts', id));
      setContacts(contacts.filter((contact) => contact.id !== id));
    } catch (error) {
      console.error("Error deleting contact: ", error);
    }
  };

  const renderContact = ({ item }) => (
    <View style={styles.contactItem}>
      <View>
        <Text style={styles.contactText}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={styles.phoneText}>{item.phoneNumber}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => editContact(item)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteContact(item.id)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return ( <><Header title={'Contacts editor'}/>
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
          <TouchableOpacity 
            style={[styles.button, editingId ? styles.editingButton : null]} 
            onPress={addContact}
          >
            <Text style={styles.buttonText}>
              {editingId ? 'Update Contact' : 'Add Contact'}
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={contacts}
          renderItem={renderContact}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />
      </View>
    </View>
  </>);
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    maxWidth: 400,
    width: '100%',
    maxHeight: '90%',
  },
  form: {
    marginBottom: 20,
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 12,
    borderRadius: 8,
    fontSize: 16,
    width: '100%',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
    width: '100%',
  },
  contactItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
    borderRadius: 8,
  },
  contactText: {
    fontSize: 16,
    fontWeight: '500',
  },
  phoneText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    marginLeft: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: '#2ecc71',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  editingButton: {
    backgroundColor: '#2ecc71',
  },
});

export default ContactsEditorPage;
