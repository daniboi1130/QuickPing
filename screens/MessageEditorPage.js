import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, StatusBar } from 'react-native';
import Header from '../Header/Header'; // Import Header component
import { db } from '../Firebase/Config';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { auth } from '../Firebase/Config';

const MessageEditorPage = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Fetch messages when component mounts
  useEffect(() => {
    const fetchMessages = async () => {
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
          messagesList.push({ id: doc.id, text: doc.data().text });
        });
        setMessages(messagesList);
      } catch (error) {
        console.error("Error fetching messages: ", error);
      }
    };
    
    fetchMessages();
  }, []);

  const handleAddMessage = async () => {
    if (message.trim()) {
      try {
        if (editingId !== null) {
          // Update existing message
          const messageRef = doc(db, 'messages', editingId);
          await updateDoc(messageRef, {
            text: message.trim()
          });
          
          setMessages(messages.map((item) => 
            item.id === editingId ? { ...item, text: message.trim() } : item
          ));
          setEditingId(null);
        } else {
          // Add new message
          const docRef = await addDoc(collection(db, 'messages'), {
            text: message.trim(),
            createdAt: new Date().toISOString(),
            userId: auth.currentUser?.uid
          });
          
          setMessages([...messages, { id: docRef.id, text: message.trim() }]);
        }
        setMessage('');
      } catch (error) {
        console.error("Error adding/updating message: ", error);
      }
    }
  };

  const handleEdit = (id, text) => {
    setMessage(text);
    setEditingId(id);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'messages', id));
      setMessages(messages.filter(msg => msg.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setMessage('');
      }
    } catch (error) {
      console.error("Error deleting message: ", error);
    }
  };

  return ( <><Header title={'Message editor'}/>
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type your message..."
          />
          <TouchableOpacity style={styles.button} onPress={handleAddMessage}>
            <Text style={styles.buttonText}>
              {editingId !== null ? 'Update' : 'Add'}
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.messageItem}>
              <Text style={styles.messageText}>{item.text}</Text>
              <View style={styles.messageActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEdit(item.id, item.text)}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(item.id)}
                >
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          style={styles.messageList}
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
  messageList: {
    flex: 1,
    width: '100%',
  },
  messageItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
    borderRadius: 8,
  },
  messageText: {
    flex: 1,
    fontSize: 16,
    marginRight: 8,
  },
  messageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default MessageEditorPage;
