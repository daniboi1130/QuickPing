import React from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { styles } from './styles';

const MessageComposition = ({
  customMessage,
  setCustomMessage,
  savedMessages,
  handleBack,
  handleConfirmMessage
}) => {
  return (
    <View style={styles.messageContainer}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={handleBack}
      >
        <Text style={styles.backButtonText}>← Back to Lists</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Compose Message</Text>
      <TextInput
        style={styles.messageInput}
        value={customMessage}
        onChangeText={setCustomMessage}
        placeholder="Write your message..."
    
      />

      <Text style={styles.subtitle}>Or choose a saved message:</Text>
      <FlatList
        data={savedMessages}
        style={styles.messageList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.messageItem}
            onPress={() => setCustomMessage(item.text)}
          >
            <Text style={styles.messageText}>{item.text}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity 
        style={styles.confirmButton}
        onPress={handleConfirmMessage}
      >
        <Text style={styles.buttonText}>Confirm Message</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MessageComposition;