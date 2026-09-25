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
  colors,
  money,
} from '../components/UI';

function normalizeList(data) {
  return Array.isArray(data) ? data : data?.data || data?.rows || [];
}

export default function SuppliersScreen() {
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
      const r = await API.get('/suppliers', { params: { q: query || '' } });
      setData(normalizeList(r.data));
    } catch (e) {
      Alert.alert('Could not load suppliers', e.message);
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
      const r = await API.get(`/suppliers/${item.id}`);
      setView(r.data?.data || r.data);
    } catch (e) {
      Alert.alert('Could not load supplier', e.message);
    }
  };

  const deleteSupplier = (item) => {
    Alert.alert('Delete supplier?', `This will remove "${item.name}".`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await API.delete(`/suppliers/${item.id}`);
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
        <SectionTitle>Suppliers</SectionTitle>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Text style={styles.addBtnText}>+ Add Supplier</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search name, phone or tax number"
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
          ListEmptyComponent={<EmptyState label="No suppliers found" />}
          renderItem={({ item }) => (
            <Card>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.phone || 'No phone'} · {item.tax_number || 'No tax number'}</Text>
              <Text style={styles.meta}>
                Purchases: {Number(item.purchase_count || 0)} · Total {money(item.total_purchases)}
              </Text>
              <View style={styles.cardActions}>
                <SmallBtn label="View" onPress={() => openView(item)} />
                <SmallBtn
                  label="Edit"
                  onPress={() => {
                    setEditing(item);
                    setOpen(true);
                  }}
                />
                <SmallBtn label="Delete" danger onPress={() => deleteSupplier(item)} />
              </View>
            </Card>
          )}
        />
      )}

      <SupplierFormModal
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
            <SectionTitle>Supplier Details</SectionTitle>
            {view && (
              <ScrollView>
                <DetailRow label="Name" value={view.name} />
                <DetailRow label="Phone" value={view.phone} />
                <DetailRow label="Tax Number" value={view.tax_number} />
                <DetailRow label="Opening Balance" value={money(view.opening_balance)} />
                <DetailRow label="Purchases" value={String(Number(view.purchase_count || 0))} />
                <DetailRow label="Total Purchased" value={money(view.total_purchases)} />
                <DetailRow label="Address" value={view.address} />
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

function SupplierFormModal({ visible, editing, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!visible) return;
      setForm(
        editing
          ? {
              name: editing.name || '',
              phone: editing.phone || '',
              tax_number: editing.tax_number || '',
              opening_balance: String(editing.opening_balance || 0),
              address: editing.address || '',
            }
          : { opening_balance: '0' }
      );
    }, [visible, editing])
  );

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name?.trim()) return Alert.alert('Name required', 'Please enter the supplier name');

    const payload = {
      name: form.name.trim(),
      phone: form.phone?.trim() || null,
      tax_number: form.tax_number?.trim() || null,
      opening_balance: Number(form.opening_balance || 0),
      address: form.address?.trim() || null,
    };

    setSaving(true);
    try {
      if (editing) {
        await API.put(`/suppliers/${editing.id}`, payload);
      } else {
        await API.post('/suppliers', payload);
      }
      onSaved();
    } catch (e) {
      Alert.alert('Could not save supplier', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }}>
        <SectionTitle>{editing ? 'Edit Supplier' : 'Add Supplier'}</SectionTitle>

        <Field label="Supplier Name *" value={form.name} onChangeText={set('name')} placeholder="e.g. Getz Pharma" />
        <Field label="Phone" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" placeholder="e.g. 0300-1234567" />
        <Field label="Tax Number" value={form.tax_number} onChangeText={set('tax_number')} placeholder="NTN / STRN" />
        <Field label="Opening Balance" value={form.opening_balance} onChangeText={set('opening_balance')} keyboardType="numeric" />
        <Field label="Address" value={form.address} onChangeText={set('address')} multiline />

        <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editing ? 'Update Supplier' : 'Save Supplier'}</Text>}
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

function Field({ label, value, onChangeText, keyboardType, multiline, placeholder }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value != null ? String(value) : ''}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        placeholder={placeholder}
      />
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
  name: { fontWeight: '700', fontSize: 16 },
  meta: { color: colors.muted, marginTop: 2 },
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
  viewBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  viewSheet: { backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, maxHeight: '80%' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  detailLabel: { color: colors.muted, fontWeight: '600' },
  detailValue: { fontWeight: '700', color: colors.text, flexShrink: 1, textAlign: 'right' },
});
