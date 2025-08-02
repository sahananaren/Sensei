import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ChevronDown } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useVisions } from '@/hooks/useVisions';

export default function EditHabitScreen() {
  const { habitId, habitName, visionId, visionName } = useLocalSearchParams();
  const { user } = useAuth();
  const { visions } = useVisions();
  const [name, setName] = useState(habitName as string || '');
  const [selectedVision, setSelectedVision] = useState(visionId as string || '');
  const [showVisionPicker, setShowVisionPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedVisionData = visions.find(v => v.id === selectedVision);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    if (!selectedVision) {
      Alert.alert('Error', 'Please select a vision');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('habits')
        .update({
          name: name.trim(),
          vision_id: selectedVision,
        })
        .eq('id', habitId)
        .eq('user_id', user?.id);

      if (error) throw error;

      Alert.alert('Success', 'Habit updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating habit:', error);
      Alert.alert('Error', 'Failed to update habit');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Habit</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>What habit do you want to add?</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your habit"
            placeholderTextColor="#666666"
            autoFocus
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>What vision is this related to?</Text>
          <TouchableOpacity
            style={styles.visionSelector}
            onPress={() => setShowVisionPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.visionSelectorText}>
              {selectedVisionData?.name || 'Select a vision'}
            </Text>
            <ChevronDown size={20} color="#A7A7A7" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.7}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Vision Picker Modal */}
      <Modal visible={showVisionPicker} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowVisionPicker(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Vision</Text>
            {visions.map((vision) => (
              <TouchableOpacity
                key={vision.id}
                style={styles.visionOption}
                onPress={() => {
                  setSelectedVision(vision.id);
                  setShowVisionPicker(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.visionOptionText,
                  selectedVision === vision.id && styles.visionOptionTextActive
                ]}>
                  {vision.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    borderWidth: 1,
    borderColor: '#1C1C1C',
  },
  visionSelector: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1C1C1C',
  },
  visionSelectorText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#329BA4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 16,
    textAlign: 'center',
  },
  visionOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1C',
  },
  visionOptionText: {
    fontSize: 16,
    color: '#A7A7A7',
    fontFamily: 'Inter',
  },
  visionOptionTextActive: {
    color: '#329BA4',
    fontWeight: '500',
  },
}); 