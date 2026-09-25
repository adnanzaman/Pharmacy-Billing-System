import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Modal, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import API from '../api/client';
import { Screen, Card, SectionTitle, LoadingView, EmptyState, colors } from '../components/UI';

export default function PatientsScreen() {
  const [data, setData] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState(null);

  const load = useCallback(async (query, isRefresh) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const r = await API.get('/patients', { params: { q: query || '' } });
      setData(r.data);
    } catch (e) {
      Alert.alert('Could not load patients', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(q);
    }, [load])
  );

  const openView = async (item) => {
    try {
      const r = await API.get(`/patients/${item.id}/visits`);
      setView({ patient: item, visits: r.data });
    } catch (e) {
      Alert.alert('Could not load visits', e.message);
    }
  };

  const deletePatient = (item) => {
    Alert.alert('Delete patient?', `"${item.name}" will be deactivated. Historical records stay safe.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await API.delete(`/patients/${item.id}`);
            load(q);
          } catch (e) {
            Alert.alert('Could not delete', e.message);
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <View style={styles.head}>
        <SectionTitle>Patients</SectionTitle>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Text style={styles.addBtnText}>+ Register</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.search}
        placeholder="Search name, patient no, mobile or CNIC"
        value={q}
        onChangeText={setQ}
        onSubmitEditing={() => load(q)}
        returnKeyType="search"
      />
      {loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          refreshing={refreshing}
          onRefresh={() => load(q, true)}
          ListEmptyComponent={<EmptyState label="No patients found" />}
          renderItem={({ item }) => (
            <Card>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.patient_no} · {item.gender || '-'} · {item.mobile || 'No mobile'}</Text>
              <Text style={styles.meta}>Visits: {item.visit_count || 0}</Text>
              <View style={styles.cardActions}>
                <SmallBtn label="Visits" onPress={() => openView(item)} />
                <SmallBtn
                  label="Edit"
                  onPress={() => {
                    setEditing(item);
                    setOpen(true);
                  }}
                />
                <SmallBtn label="Delete" danger onPress={() => deletePatient(item)} />
              </View>
            </Card>
          )}
        />
      )}

      <RegisterModal
        visible={open}
        editing={editing}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSaved={() => {
          setOpen(false);
          setEditing(null);
          load(q);
        }}
      />

      <Modal visible={!!view} animationType="slide" onRequestClose={() => setView(null)} transparent>
        <View style={styles.viewBackdrop}>
          <View style={styles.viewSheet}>
            <SectionTitle>Visits — {view?.patient?.name}</SectionTitle>
            <ScrollView>
              {(view?.visits || []).length === 0 && <EmptyState label="No visits recorded" />}
              {(view?.visits || []).map((v, i) => (
                <View key={v.id || i} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{v.visit_date}</Text>
                  <Text style={styles.detailValue}>{v.doctor_name || '-'} · {v.department_name || '-'}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setView(null)}>
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function RegisterModal({ visible, editing, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!visible) return;
      Promise.all([API.get('/lookups/doctors'), API.get('/lookups/departments')])
        .then(([a, b]) => {
          setDoctors(a.data);
          setDepartments(b.data);
        })
        .catch(() => {});

      setForm(
        editing
          ? {
              name: editing.name,
              father_husband_name: editing.father_husband_name,
              cnic: editing.cnic,
              gender: editing.gender,
              mobile: editing.mobile,
              blood_group: editing.blood_group,
              address: editing.address,
              emergency_contact: editing.emergency_contact,
            }
          : {}
      );
    }, [visible, editing])
  );

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name) return Alert.alert('Name required', 'Please enter the patient name');
    setSaving(true);
    try {
      if (editing) {
        await API.put(`/patients/${editing.id}`, form);
        Alert.alert('Updated', 'Patient updated successfully');
      } else {
        const r = await API.post('/patients', form);
        Alert.alert('Registered', `Patient number: ${r.data.patient_no}`);
      }
      setForm({});
      onSaved();
    } catch (e) {
      Alert.alert('Could not save', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }}>
        <SectionTitle>{editing ? 'Edit Patient' : 'Register Patient'}</SectionTitle>
        <Field label="Patient Name *" value={form.name} onChangeText={set('name')} />
        <Field label="Father / Husband" value={form.father_husband_name} onChangeText={set('father_husband_name')} />
        <Field label="CNIC" value={form.cnic} onChangeText={set('cnic')} />
        <Field label="Mobile" value={form.mobile} onChangeText={set('mobile')} keyboardType="phone-pad" />
        <Field label="Gender (Male/Female/Other)" value={form.gender} onChangeText={set('gender')} />
        <Field label="Blood Group" value={form.blood_group} onChangeText={set('blood_group')} />
        <Field label="Emergency Contact" value={form.emergency_contact} onChangeText={set('emergency_contact')} />
        <Field label="Address" value={form.address} onChangeText={set('address')} multiline />
        <PickerRow label="Department" options={departments} value={form.department_id} onChange={set('department_id')} />
        <PickerRow label="Doctor" options={doctors} value={form.doctor_id} onChange={set('doctor_id')} />
        {!editing && (
          <>
            <Field label="Registration Fee" value={form.registration_fee} onChangeText={set('registration_fee')} keyboardType="numeric" />
            <Field label="Paid" value={form.paid} onChangeText={set('paid')} keyboardType="numeric" />
          </>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editing ? 'Update Patient' : 'Save & Register Visit'}</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
}

function SmallBtn({ label, onPress, danger }) {
  return (
    <TouchableOpacity style={[styles.smallBtn, danger && styles.smallBtnDanger]} onPress={onPress}>
      <Text style={[styles.smallBtnText, danger && styles.smallBtnTextDanger]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Field({ label, value, onChangeText, keyboardType, multiline }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value != null ? String(value) : ''}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
      />
    </View>
  );
}

function PickerRow({ label, options, value, onChange }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {options.map((o) => (
          <TouchableOpacity
            key={o.id}
            style={[styles.chip, String(value) === String(o.id) && styles.chipActive]}
            onPress={() => onChange(o.id)}
          >
            <Text style={[styles.chipText, String(value) === String(o.id) && styles.chipTextActive]}>{o.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '700' },
  search: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  name: { fontWeight: '700', fontSize: 16 },
  meta: { color: colors.muted, marginTop: 2 },
  label: { fontSize: 13, color: colors.muted, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 14 },
  cancelBtnText: { color: colors.muted, fontWeight: '600' },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  cardActions: { flexDirection: 'row', marginTop: 10 },
  smallBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8 },
  smallBtnDanger: { borderColor: colors.danger, backgroundColor: colors.dangerLight },
  smallBtnText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  smallBtnTextDanger: { color: colors.danger },
  viewBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  viewSheet: { backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, maxHeight: '80%' },
  detailRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  detailLabel: { color: colors.muted, fontWeight: '600', fontSize: 12 },
  detailValue: { fontWeight: '700', color: colors.text, marginTop: 2 },
});
