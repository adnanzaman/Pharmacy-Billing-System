import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Screen, Card, SectionTitle, colors } from '../components/UI';

export default function MoreScreen({ navigation }) {
  const { user, logout } = useAuth();

  const confirmLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <Screen scroll>
      <SectionTitle>More</SectionTitle>

      <Card>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.meta}>{user?.email} · {user?.role}</Text>
      </Card>

      <Text style={styles.sectionLabel}>Modules</Text>

      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Purchases')}>
        <Text style={styles.menuText}>Purchases</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Doctors')}>
        <Text style={styles.menuText}>Doctors</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Suppliers')}>
        <Text style={styles.menuText}>Suppliers</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Reports')}>
        <Text style={styles.menuText}>Reports</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
        <Text style={styles.menuText}>API / Connection Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontWeight: '700', fontSize: 16 },
  meta: { color: colors.muted, marginTop: 2 },
  menuItem: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  menuText: { fontWeight: '600' },
  sectionLabel: { fontWeight: '800', fontSize: 15, marginTop: 12, marginBottom: 8 },
  logoutBtn: { backgroundColor: colors.danger, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  logoutText: { color: '#fff', fontWeight: '700' },
});
