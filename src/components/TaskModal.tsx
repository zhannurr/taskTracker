import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal,
  TextInput,
  TouchableOpacity
} from "react-native";
import { TaskData } from "../services/firebaseService";

interface TaskModalProps {
  visible: boolean;
  editingTask: (TaskData & { id: string }) | null;
  formData: {
    description: string;
    duration: string;
  };
  onFormDataChange: (field: string, value: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function TaskModal({
  visible,
  editingTask,
  formData,
  onFormDataChange,
  onSave,
  onClose
}: TaskModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {editingTask ? 'Edit Task' : 'Add New Task'}
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder="Task Description"
            value={formData.description}
            onChangeText={(text) => onFormDataChange('description', text)}
            multiline
          />
          
          <TextInput
            style={styles.input}
            placeholder="Duration (in minutes)"
            value={formData.duration}
            onChangeText={(text) => onFormDataChange('duration', text)}
            keyboardType="numeric"
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]}
              onPress={onSave}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
