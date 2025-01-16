import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import Header from '../Header/Header'; // Import Header component

const MessageEditorPage = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const handleAddMessage = () => {
    if (message.trim()) {
      if (editingId !== null) {
        setMessages(messages.map((item, index) => 
          index === editingId ? message.trim() : item
        ));
        setEditingId(null);
      } else {
        setMessages([...messages, message.trim()]);
      }
      setMessage('');
    }
  };

  const handleEdit = (index, text) => {
    setMessage(text);
    setEditingId(index);
  };

  const handleDelete = (index) => {
    setMessages(messages.filter((_, i) => i !== index));
    if (editingId === index) {
      setEditingId(null);
      setMessage('');
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
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.messageItem}>
              <Text style={styles.messageText}>{item}</Text>
              <View style={styles.messageActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEdit(index, item)}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(index)}
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
