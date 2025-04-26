import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  Alert, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  FlatList 
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
  where, 
  getDocs 
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../Header/Header';

const ContactsEditorPage = () => {
  const [contacts, setContacts] = useState([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

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
        const contactData = {
          firstName,
          lastName,
          phoneNumber: cleanPhoneNumber,
          userId: auth.currentUser?.uid,
          photoUri: selectedImage,
          createdAt: new Date().toISOString()
        };

        if (editingId) {
          // Update existing contact
          const contactRef = doc(db, 'contacts', editingId);
          await updateDoc(contactRef, contactData);
          
          setContacts(
            contacts.map((contact) =>
              contact.id === editingId
                ? { ...contact, ...contactData }
                : contact
            )
          );
          setEditingId(null);
        } else {
          // Add new contact
          const docRef = await addDoc(collection(db, 'contacts'), contactData);
          
          setContacts([ 
            ...contacts,
            {
              id: docRef.id,
              ...contactData
            },
          ]);
        }
        
        // Clear form
        setFirstName('');
        setLastName('');
        setPhoneNumber('');
        setSelectedImage(null);
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

  const updateContactPhoto = async (contactId, photoUri) => {
    try {
      // Create a unique filename using contact ID and timestamp
      const uniquePhotoUri = `${photoUri}?contactId=${contactId}&time=${Date.now()}`;
      
      // Update in Firestore
      const contactRef = doc(db, 'contacts', contactId);
      await updateDoc(contactRef, {
        photoUri: uniquePhotoUri,
        updatedAt: new Date().toISOString()
      });

      // Update local state immutably
      setContacts(prevContacts => 
        prevContacts.map(contact => {
          if (contact.id === contactId) {
            return {
              ...contact,
              photoUri: uniquePhotoUri
            };
          }
          return contact;
        })
      );
    } catch (error) {
      console.error("Error updating contact photo:", error);
      Alert.alert("Error", "Failed to update contact photo");
    }
  };

  const renderContact = ({ item }) => (
    <View style={styles.contactItem}>
      <View style={styles.contactMainInfo}>
        {item.photoUri ? (
          <Image 
            key={`${item.id}-${item.photoUri}`}
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
          style={styles.iconButton}
        >
          <Text style={styles.cameraIcon}>📷</Text>
        </TouchableOpacity>
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

  // Add image picker button to the form
  return (
    <>
      <Header title={'Contacts editor'}/>
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
    </>
  );
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
    alignItems: 'center',
    gap: 6, // Add consistent spacing between buttons
  },
  actionButton: {
    padding: 6, // Reduced from 8
    borderRadius: 6,
    minWidth: 60, // Reduced from 70
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13, // Reduced from 14
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
  contactMainInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 6, // Match other buttons
    marginLeft: 0, // Remove margin since we're using gap
  },
  cameraIcon: {
    fontSize: 18, // Slightly reduced from 20
  },
  contactImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  placeholderText: {
    fontSize: 18,
    color: '#666',
  }
});

export default ContactsEditorPage;
