import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  Alert, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  FlatList,
  SafeAreaView,
  ScrollView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { db, auth } from '../Firebase/Config';
import { 
  doc, 
  updateDoc, 
  collection, 
  addDoc, 
  deleteDoc, 
  query, 
  onSnapshot 
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Header from '../Header/Header';

const ContactsEditorPage = () => {
  const [contacts, setContacts] = useState([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showAllContacts, setShowAllContacts] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'contacts')),
      (snapshot) => {
        const contactsList = [];
        snapshot.forEach((doc) => {
          contactsList.push({ id: doc.id, ...doc.data() });
        });

        contactsList.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );

        setContacts(contactsList);
      },
      (error) => {
        console.error("Error listening to contacts: ", error);
        Alert.alert(
          'Error',
          'Failed to sync with database. Please check your connection.'
        );
      }
    );

    return () => unsubscribe();
  }, []);

  const addContact = async () => {
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    if (cleanPhoneNumber.length < 10) {
      alert('Phone number must be at least 10 digits');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to add contacts');
      return;
    }

    if (firstName && lastName && phoneNumber) {
      try {
        const contactData = {
          firstName,
          lastName,
          phoneNumber: cleanPhoneNumber,
          createdAt: new Date().toISOString(),
          photoUri: selectedImage,
          userId: user.uid,
          createdBy: user.email
        };

        if (editingId) {
          const contactRef = doc(db, 'contacts', editingId);
          await updateDoc(contactRef, contactData);

          setEditingId(null);
        } else {
          await addDoc(collection(db, 'contacts'), contactData);
        }

        setFirstName('');
        setLastName('');
        setPhoneNumber('');
        setSelectedImage(null);
      } catch (error) {
        console.error("Error adding/updating contact: ", error);
      }
    }
  };

  const canModifyContact = (contact) => {
    return contact.userId === user?.uid;
  };

  const editContact = (contact) => {
    if (!canModifyContact(contact)) {
      Alert.alert('Permission Denied', 'You can only edit your own contacts');
      return;
    }
    setFirstName(contact.firstName);
    setLastName(contact.lastName);
    setPhoneNumber(contact.phoneNumber);
    setEditingId(contact.id);
  };

  const deleteContact = async (id) => {
    const contact = contacts.find(c => c.id === id);
    if (!canModifyContact(contact)) {
      Alert.alert('Permission Denied', 'You can only delete your own contacts');
      return;
    }

    try {
      await deleteDoc(doc(db, 'contacts', id));
    } catch (error) {
      console.error("Error deleting contact: ", error);
    }
  };

  const updateContactPhoto = async (id, uri) => {
    const contactRef = doc(db, 'contacts', id);
    await updateDoc(contactRef, { photoUri: uri });
  };

  const pickImage = async (contact) => {
    Alert.alert(
      "Select Image",
      "Choose how you want to add a photo",
      [
        {
          text: "Photo Gallery",
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission needed', 'Gallery permission is required to select photos.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 1,
            });
            if (!result.canceled) {
              await updateContactPhoto(contact.id, result.assets[0].uri);
            }
          }
        },
        {
          text: "Take Photo",
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission needed', 'Camera permission is required to take photos.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 1,
            });
            if (!result.canceled) {
              await updateContactPhoto(contact.id, result.assets[0].uri);
            }
          }
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const renderContact = ({ item }) => (
    <View style={styles.contactItem}>
      <View style={styles.contactMainInfo}>
        {item.photoUri ? (
          <Image 
            source={{ uri: item.photoUri }}
            style={styles.contactImage}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>
              {item.firstName?.[0]}{item.lastName?.[0]}
            </Text>
          </View>
        )}
        <View style={styles.contactInfo}>
          <Text style={styles.contactText}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.phoneText}>{item.phoneNumber}</Text>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          onPress={() => pickImage(item)}
          style={[styles.iconButton, !canModifyContact(item) && styles.disabledButton]}
          disabled={!canModifyContact(item)}
        >
          <Text style={styles.cameraIcon}>📷</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton, !canModifyContact(item) && styles.disabledButton]}
          onPress={() => editContact(item)}
          disabled={!canModifyContact(item)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton, !canModifyContact(item) && styles.disabledButton]}
          onPress={() => deleteContact(item.id)}
          disabled={!canModifyContact(item)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getFilteredContacts = () => {
    if (showAllContacts) {
      return contacts;
    }
    return contacts.filter(contact => contact.userId === user?.uid);
  };

  return (
    <SafeAreaView style={styles.outerContainer}>
      <Header title='Contact Editor' />
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
          <TouchableOpacity style={styles.button} onPress={addContact}>
            <Text style={styles.buttonText}>
              {editingId ? "Update Contact" : "Add Contact"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[
            styles.filterButton,
            showAllContacts ? styles.filterButtonActive : styles.filterButtonInactive
          ]}
          onPress={() => setShowAllContacts(!showAllContacts)}
        >
          <Text style={styles.filterButtonText}>
            {showAllContacts ? "All Contacts" : "Personal Contacts"}
          </Text>
        </TouchableOpacity>

        <FlatList
          data={getFilteredContacts()}
          renderItem={renderContact}
          keyExtractor={(item) => item.id}
          style={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No contacts found</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  /* your same styles from before */
  outerContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  form: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  contactMainInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  placeholderImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  placeholderText: {
    fontSize: 18,
    color: '#555',
  },
  contactInfo: {
    flex: 1,
  },
  contactText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  phoneText: {
    fontSize: 14,
    color: '#777',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginHorizontal: 5,
  },
  cameraIcon: {
    fontSize: 20,
  },
  actionButton: {
    marginHorizontal: 5,
    padding: 5,
    borderRadius: 5,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#2ecc71',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  disabledButton: {
    opacity: 0.5,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#aaa',
  },
  toggleButton: {
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 16,
    color: '#007AFF',
  },
  filterButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  filterButtonInactive: {
    backgroundColor: '#e74c3c',
  },
  filterButtonActive: {
    backgroundColor: '#2ecc71',
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ContactsEditorPage;
