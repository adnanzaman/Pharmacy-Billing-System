import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import API, { getApiUrl, setApiUrl } from '../api/client';
import { Screen, Card, SectionTitle, colors } from '../components/UI';

export default function SettingsScreen() {
  const [url, setUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    setUrl(getApiUrl());
  }, []);

  const test = async () => {
    setTesting(true);
    setStatus(null);
    try {
      await setApiUrl(url.trim());
      await API.get('/health');
      setStatus('ok');
    } catch (e) {
      setStatus('fail');
      Alert.alert('Connection failed', e.message);
    } finally {
      setTesting(false);
    }
  };
  
  return (
    <Screen>
      <SectionTitle>Connection Settings</SectionTitle>
      <Card>
        <Text style={styles.label}>Backend API URL</Text>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          //placeholder="http://192.168.10.8:5001/api"
          placeholder="https://api-h.raas-llc.com/api"
        />
        <Text style={styles.hint}>
          Use your computer LAN IP address, not "localhost" — a phone or emulator cannot reach the
          computer localhost. Find the IP using ipconfig (Windows) or ifconfig (Mac/Linux), and
          make sure the phone is on the same Wi-Fi network as the backend.
        </Text>
        <TouchableOpacity style={styles.button} onPress={test} disabled={testing}>
          {testing ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save & Test Connection</Text>}
        </TouchableOpacity>
        {status === 'ok' && <Text style={styles.ok}>✓ Connected successfully</Text>}
        {status === 'fail' && <Text style={styles.fail}>✗ Could not reach server</Text>}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, color: colors.muted, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  hint: { color: colors.muted, fontSize: 12, marginTop: 10, lineHeight: 18 },
  button: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontWeight: '700' },
  ok: { color: colors.success, marginTop: 10, fontWeight: '600' },
  fail: { color: colors.danger, marginTop: 10, fontWeight: '600' },
});
