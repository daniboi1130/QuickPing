import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  FlatList, 
  Alert
} from 'react-native';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../Firebase/Config';
import Header from '../Header/Header';

const TagEditPage = ({ navigation }) => {
  // State management
  const [tags, setTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [editingTag, setEditingTag] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch tags on component mount
  useEffect(() => {
    fetchTags();
  }, []);

  // Fetch tags from Firestore
  const fetchTags = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const q = query(
        collection(db, 'tags'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const tagsData = [];
      querySnapshot.forEach((doc) => {
        tagsData.push({ id: doc.id, ...doc.data() });
      });
      setTags(tagsData);
    } catch (error) {
      console.error("Error fetching tags:", error);
      Alert.alert("Error", "Failed to load tags");
    }
  };

  // Handle creating new tag
  const handleCreateTag = async () => {
    try {
      if (!newTagName.trim()) return;

      const userId = auth.currentUser?.uid;
      if (!userId) return;

      // Check for duplicate tags
      if (tags.some(tag => tag.name.toLowerCase() === newTagName.toLowerCase())) {
        Alert.alert("Error", "Tag already exists");
        return;
      }

      setIsLoading(true);
      await addDoc(collection(db, 'tags'), {
        name: newTagName.trim(),
        userId,
        createdAt: new Date().toISOString()
      });

      setNewTagName('');
      await fetchTags();
    } catch (error) {
      console.error("Error creating tag:", error);
      Alert.alert("Error", "Failed to create tag");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle updating tag
  const handleUpdateTag = async (tagId, newName) => {
    try {
      if (!newName.trim()) return;

      setIsLoading(true);
      await updateDoc(doc(db, 'tags', tagId), {
        name: newName.trim(),
        updatedAt: new Date().toISOString()
      });

      setEditingTag(null);
      await fetchTags();
    } catch (error) {
      console.error("Error updating tag:", error);
      Alert.alert("Error", "Failed to update tag");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting tag
  const handleDeleteTag = async (tagId) => {
    Alert.alert(
      "Delete Tag",
      "Are you sure you want to delete this tag?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              await deleteDoc(doc(db, 'tags', tagId));
              await fetchTags();
            } catch (error) {
              console.error("Error deleting tag:", error);
              Alert.alert("Error", "Failed to delete tag");
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // Render tag item
  const renderTagItem = ({ item }) => (
    <View style={styles.tagItem}>
      {editingTag?.id === item.id ? (
        <TextInput
          style={styles.editInput}
          value={editingTag.name}
          onChangeText={(text) => setEditingTag({ ...editingTag, name: text })}
          onBlur={() => handleUpdateTag(item.id, editingTag.name)}
          autoFocus
        />
      ) : (
        <Text style={styles.tagName}>{item.name}</Text>
      )}
      <View style={styles.tagActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => setEditingTag(item)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteTag(item.id)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <Header title="Edit Tags" />
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newTagName}
            onChangeText={setNewTagName}
            placeholder="Enter new tag name"
            editable={!isLoading}
          />
          <TouchableOpacity 
            style={[styles.createButton, isLoading && styles.disabledButton]}
            onPress={handleCreateTag}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Create Tag</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={tags}
          renderItem={renderTagItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />

        <TouchableOpacity 
          style={styles.finishButton}
          onPress={() => navigation.navigate('ContactList')}
        >
          <Text style={styles.buttonText}>Finish Editing</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  createButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
    marginBottom: 70, // Add space for the finish button
  },
  tagItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tagName: {
    fontSize: 16,
    flex: 1,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 5,
    padding: 5,
    marginRight: 10,
  },
  tagActions: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginLeft: 10,
  },
  editButton: {
    backgroundColor: '#007bff',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  finishButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
  },
});

export default TagEditPage;