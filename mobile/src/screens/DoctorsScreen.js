import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import API from '../api/client';
import {
  Screen,
  Card,
  SectionTitle,
  LoadingView,
  EmptyState,
  StatusBadge,
  colors,
  money,
} from '../components/UI';

function normalizeList(data) {
  return Array.isArray(data) ? data : data?.data || data?.rows || [];
}

export default function DoctorsScreen() {
  const [data, setData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState(null);

  const load = useCallback(async (isRefresh) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [d, dep] = await Promise.all([API.get('/doctors'), API.get('/lookups/departments')]);
      setData(normalizeList(d.data));
      setDepartments(normalizeList(dep.data));
    } catch (e) {
      Alert.alert('Could not load doctors', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = data.filter((item) => {
    const text = `${item.name || ''} ${item.doctor_code || ''} ${item.speciality || ''} ${item.department_name || ''}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const openView = async (item) => {
    try {
      const r = await API.get(`/doctors/${item.id}`);
      setView(r.data?.data || r.data);
    } catch (e) {
      Alert.alert('Could not load doctor', e.message);
    }
  };

  const deleteDoctor = (item) => {
    Alert.alert('Delete doctor?', `This will remove/deactivate "${item.name}".`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await API.delete(`/doctors/${item.id}`);
            load();
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
        <SectionTitle>Doctors</SectionTitle>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Text style={styles.addBtnText}>+ Add Doctor</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search name, code, speciality or department"
        value={search}
        onChangeText={setSearch}
      />

      {loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          refreshing={refreshing}
          onRefresh={() => load(true)}
          ListEmptyComponent={<EmptyState label="No doctors found" />}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.name}>{item.name}</Text>
                <StatusBadge label={item.is_active ? 'Active' : 'Inactive'} type={item.is_active ? 'success' : 'danger'} />
              </View>
              <Text style={styles.meta}>Code: {item.doctor_code}</Text>
              <Text style={styles.meta}>{item.speciality || 'No speciality'} · {item.department_name || 'No department'}</Text>
              <Text style={styles.meta}>Fee: {money(item.consultation_fee)}</Text>
              <View style={styles.cardActions}>
                <SmallBtn label="View" onPress={() => openView(item)} />
                <SmallBtn
                  label="Edit"
                  onPress={() => {
                    setEditing(item);
                    setOpen(true);
                  }}
                />
                <SmallBtn label="Delete" danger onPress={() => deleteDoctor(item)} />
              </View>
            </Card>
          )}
        />
      )}

      <DoctorFormModal
        visible={open}
        editing={editing}
        departments={departments}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSaved={() => {
          setOpen(false);
          setEditing(null);
          load();
        }}
      />

      <Modal visible={!!view} animationType="slide" onRequestClose={() => setView(null)} transparent>
        <View style={styles.viewBackdrop}>
          <View style={styles.viewSheet}>
            <SectionTitle>Doctor Details</SectionTitle>
            {view && (
              <ScrollView>
                <DetailRow label="Code" value={view.doctor_code} />
                <DetailRow label="Name" value={view.name} />
                <DetailRow label="Qualification" value={view.qualification} />
                <DetailRow label="Speciality" value={view.speciality} />
                <DetailRow label="Department" value={view.department_name} />
                <DetailRow label="Phone" value={view.phone} />
                <DetailRow label="Consultation Fee" value={money(view.consultation_fee)} />
                <DetailRow label="Status" value={view.is_active ? 'Active' : 'Inactive'} />
              </ScrollView>
            )}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setView(null)}>
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function DoctorFormModal({ visible, editing, departments, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!visible) return;
      setForm(
        editing
          ? {
              doctor_code: editing.doctor_code || '',
              name: editing.name || '',
              qualification: editing.qualification || '',
              speciality: editing.speciality || '',
              department_id: editing.department_id,
              phone: editing.phone || '',
              consultation_fee: String(editing.consultation_fee || 0),
              is_active: editing.is_active ?? 1,
            }
          : { consultation_fee: '0', is_active: 1 }
      );
    }, [visible, editing])
  );

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.doctor_code?.trim()) return Alert.alert('Code required', 'Please enter a doctor code');
    if (!form.name?.trim()) return Alert.alert('Name required', 'Please enter the doctor name');

    const payload = {
      doctor_code: form.doctor_code.trim(),
      name: form.name.trim(),
      qualification: form.qualification?.trim() || null,
      speciality: form.speciality?.trim() || null,
      department_id: form.department_id || null,
      phone: form.phone?.trim() || null,
      consultation_fee: Number(form.consultation_fee || 0),
      is_active: form.is_active ? 1 : 0,
    };

    setSaving(true);
    try {
      if (editing) {
        await API.put(`/doctors/${editing.id}`, payload);
      } else {
        await API.post('/doctors', payload);
      }
      onSaved();
    } catch (e) {
      Alert.alert('Could not save doctor', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }}>
        <SectionTitle>{editing ? 'Edit Doctor' : 'Add Doctor'}</SectionTitle>

        <Field label="Doctor Code *" value={form.doctor_code} onChangeText={set('doctor_code')} placeholder="e.g. DOC-001" />
        <Field label="Doctor Name *" value={form.name} onChangeText={set('name')} />
        <Field label="Qualification" value={form.qualification} onChangeText={set('qualification')} />
        <Field label="Speciality" value={form.speciality} onChangeText={set('speciality')} />
        <Field label="Phone" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
        <Field label="Consultation Fee" value={form.consultation_fee} onChangeText={set('consultation_fee')} keyboardType="numeric" />

        <PickerRow label="Department" options={departments} value={form.department_id} onChange={set('department_id')} />

        <View style={{ marginBottom: 12 }}>
          <Text style={styles.label}>Status</Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              style={[styles.chip, form.is_active ? styles.chipActive : null]}
              onPress={() => set('is_active')(1)}
            >
              <Text style={[styles.chipText, form.is_active ? styles.chipTextActive : null]}>Active</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, !form.is_active ? styles.chipActive : null]}
              onPress={() => set('is_active')(0)}
            >
              <Text style={[styles.chipText, !form.is_active ? styles.chipTextActive : null]}>Inactive</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editing ? 'Update Doctor' : 'Save Doctor'}</Text>}
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

function Field({ label, value, onChangeText, keyboardType, placeholder }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value != null ? String(value) : ''}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        placeholder={placeholder}
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

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || '-'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '700' },
  search: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  name: { fontWeight: '700', fontSize: 16, flexShrink: 1 },
  meta: { color: colors.muted, marginTop: 2 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardActions: { flexDirection: 'row', marginTop: 10 },
  smallBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8 },
  smallBtnDanger: { borderColor: colors.danger, backgroundColor: colors.dangerLight },
  smallBtnText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  smallBtnTextDanger: { color: colors.danger },
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
  viewBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  viewSheet: { backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, maxHeight: '80%' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  detailLabel: { color: colors.muted, fontWeight: '600' },
  detailValue: { fontWeight: '700', color: colors.text, flexShrink: 1, textAlign: 'right' },
});
