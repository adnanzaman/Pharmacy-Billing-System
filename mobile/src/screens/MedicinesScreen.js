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

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function normalizeList(data) {
  return Array.isArray(data) ? data : data?.data || data?.rows || [];
}

function stockStatus(stock, reorderLevel) {
  const s = Number(stock || 0);
  const r = Number(reorderLevel || 0);
  if (s <= 0) return { label: 'Out of Stock', type: 'danger' };
  if (r > 0 && s <= r) return { label: 'Low Stock', type: 'warning' };
  return { label: 'In Stock', type: 'success' };
}

/*
|--------------------------------------------------------------------------
| SCREEN
|--------------------------------------------------------------------------
*/

export default function MedicinesScreen() {
  const [tab, setTab] = useState('medicines'); // 'medicines' | 'batches'

  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [medicineModal, setMedicineModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);

  const [batchModal, setBatchModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);

  const [viewMedicine, setViewMedicine] = useState(null);
  const [viewBatch, setViewBatch] = useState(null);

  const load = useCallback(async (isRefresh) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [m, b, c, u] = await Promise.all([
        API.get('/medicines'),
        API.get('/sales/batches'),
        API.get('/lookups/categories'),
        API.get('/lookups/units'),
      ]);
      setMedicines(normalizeList(m.data));
      setBatches(normalizeList(b.data));
      setCategories(normalizeList(c.data));
      setUnits(normalizeList(u.data));
    } catch (e) {
      Alert.alert('Could not load medicines', e.message);
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

  const filteredMedicines = medicines.filter((item) => {
    const text = `${item.name || ''} ${item.generic_name || ''} ${item.strength || ''} ${item.barcode || ''} ${item.category_name || ''} ${item.unit_name || ''}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const filteredBatches = batches.filter((item) => {
    const text = `${item.medicine_name || ''} ${item.batch_no || ''}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const openViewMedicine = async (item) => {
    try {
      const r = await API.get(`/medicines/${item.id}`);
      setViewMedicine(r.data?.data || r.data);
    } catch (e) {
      Alert.alert('Could not load medicine', e.message);
    }
  };

  const openViewBatch = async (item) => {
    try {
      const r = await API.get(`/medicine-batches/${item.id}`);
      setViewBatch(r.data?.data || r.data);
    } catch (e) {
      Alert.alert('Could not load batch', e.message);
    }
  };

  const deleteMedicine = (item) => {
    Alert.alert('Delete medicine?', `This will remove "${item.name}".`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await API.delete(`/medicines/${item.id}`);
            load();
          } catch (e) {
            Alert.alert('Could not delete', e.message);
          }
        },
      },
    ]);
  };

  const deleteBatch = (item) => {
    Alert.alert('Delete batch?', `This will remove batch "${item.batch_no}".`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await API.delete(`/medicine-batches/${item.id}`);
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
        <SectionTitle>Medicines & Batches</SectionTitle>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search medicine, generic, barcode or batch"
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.tabRow}>
        <TabButton label={`Medicines (${filteredMedicines.length})`} active={tab === 'medicines'} onPress={() => setTab('medicines')} />
        <TabButton label={`Batches (${filteredBatches.length})`} active={tab === 'batches'} onPress={() => setTab('batches')} />
      </View>

      <View style={styles.actionRow}>
        {tab === 'medicines' ? (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              setEditingMedicine(null);
              setMedicineModal(true);
            }}
          >
            <Text style={styles.addBtnText}>+ Add Medicine</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              if (!medicines.length) {
                Alert.alert('Add a medicine first', 'You need at least one medicine before adding a batch.');
                return;
              }
              setEditingBatch(null);
              setBatchModal(true);
            }}
          >
            <Text style={styles.addBtnText}>+ Add Batch</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <LoadingView />
      ) : tab === 'medicines' ? (
        <FlatList
          data={filteredMedicines}
          keyExtractor={(item) => String(item.id)}
          refreshing={refreshing}
          onRefresh={() => load(true)}
          ListEmptyComponent={<EmptyState label="No medicines found" />}
          renderItem={({ item }) => {
            const status = stockStatus(item.stock, item.reorder_level);
            return (
              <Card>
                <View style={styles.rowBetween}>
                  <Text style={styles.name}>{item.name}</Text>
                  <StatusBadge label={status.label} type={status.type} />
                </View>
                <Text style={styles.meta}>
                  {item.generic_name || 'No generic name'} {item.strength ? `· ${item.strength}` : ''}
                </Text>
                <Text style={styles.meta}>
                  {item.category_name || 'No category'} · {item.unit_name || 'No unit'}
                </Text>
                <Text style={styles.meta}>
                  Stock: {Number(item.stock || 0)} · Reorder: {Number(item.reorder_level || 0)} · Batches: {Number(item.batch_count || 0)}
                </Text>
                <View style={styles.cardActions}>
                  <SmallBtn label="View" onPress={() => openViewMedicine(item)} />
                  <SmallBtn
                    label="Edit"
                    onPress={() => {
                      setEditingMedicine(item);
                      setMedicineModal(true);
                    }}
                  />
                  <SmallBtn label="Delete" danger onPress={() => deleteMedicine(item)} />
                </View>
              </Card>
            );
          }}
        />
      ) : (
        <FlatList
          data={filteredBatches}
          keyExtractor={(item) => String(item.id)}
          refreshing={refreshing}
          onRefresh={() => load(true)}
          ListEmptyComponent={<EmptyState label="No batches found" />}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.name}>{item.medicine_name}</Text>
                <StatusBadge label={Number(item.stock || 0) <= 0 ? 'Out of Stock' : 'In Stock'} type={Number(item.stock || 0) <= 0 ? 'danger' : 'success'} />
              </View>
              <Text style={styles.meta}>Batch: {item.batch_no} · Expiry: {item.expiry_date ? String(item.expiry_date).substring(0, 10) : '-'}</Text>
              <Text style={styles.meta}>
                Purchase {money(item.purchase_price)} · Sale {money(item.sale_price)} · MRP {money(item.mrp)}
              </Text>
              <Text style={styles.meta}>Stock: {Number(item.stock || 0)}</Text>
              <View style={styles.cardActions}>
                <SmallBtn label="View" onPress={() => openViewBatch(item)} />
                <SmallBtn
                  label="Edit"
                  onPress={() => {
                    setEditingBatch(item);
                    setBatchModal(true);
                  }}
                />
                <SmallBtn label="Delete" danger onPress={() => deleteBatch(item)} />
              </View>
            </Card>
          )}
        />
      )}

      <MedicineFormModal
        visible={medicineModal}
        editing={editingMedicine}
        categories={categories}
        units={units}
        onClose={() => {
          setMedicineModal(false);
          setEditingMedicine(null);
        }}
        onSaved={() => {
          setMedicineModal(false);
          setEditingMedicine(null);
          load();
        }}
      />

      <BatchFormModal
        visible={batchModal}
        editing={editingBatch}
        medicines={medicines}
        onClose={() => {
          setBatchModal(false);
          setEditingBatch(null);
        }}
        onSaved={() => {
          setBatchModal(false);
          setEditingBatch(null);
          load();
        }}
      />

      <ViewMedicineModal medicine={viewMedicine} onClose={() => setViewMedicine(null)} />
      <ViewBatchModal batch={viewBatch} onClose={() => setViewBatch(null)} />
    </Screen>
  );
}

/*
|--------------------------------------------------------------------------
| MEDICINE ADD / EDIT MODAL
|--------------------------------------------------------------------------
*/

function MedicineFormModal({ visible, editing, categories, units, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!visible) return;
      setForm(
        editing
          ? {
              name: editing.name || '',
              generic_name: editing.generic_name || '',
              strength: editing.strength || '',
              pack_size: editing.pack_size || '',
              barcode: editing.barcode || '',
              category_id: editing.category_id,
              unit_id: editing.unit_id,
              reorder_level: String(editing.reorder_level || 0),
            }
          : { reorder_level: '0' }
      );
    }, [visible, editing])
  );

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name?.trim()) return Alert.alert('Name required', 'Please enter the medicine name');
    if (!form.category_id) return Alert.alert('Category required', 'Please select a category');
    if (!form.unit_id) return Alert.alert('Unit required', 'Please select a unit');

    const payload = {
      name: form.name?.trim(),
      generic_name: form.generic_name?.trim() || null,
      strength: form.strength?.trim() || null,
      pack_size: form.pack_size?.trim() || null,
      barcode: form.barcode?.trim() || null,
      category_id: form.category_id,
      unit_id: form.unit_id,
      reorder_level: Number(form.reorder_level || 0),
    };

    setSaving(true);
    try {
      if (editing) {
        await API.put(`/medicines/${editing.id}`, payload);
      } else {
        await API.post('/medicines', payload);
      }
      onSaved();
    } catch (e) {
      Alert.alert('Could not save medicine', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }}>
        <SectionTitle>{editing ? 'Edit Medicine' : 'Add Medicine'}</SectionTitle>

        <Field label="Medicine Name *" value={form.name} onChangeText={set('name')} placeholder="e.g. Panadol" />
        <Field label="Generic Name" value={form.generic_name} onChangeText={set('generic_name')} placeholder="e.g. Paracetamol" />
        <Field label="Strength" value={form.strength} onChangeText={set('strength')} placeholder="e.g. 500mg" />
        <Field label="Pack Size" value={form.pack_size} onChangeText={set('pack_size')} placeholder="e.g. 20 tablets" />
        <Field label="Barcode" value={form.barcode} onChangeText={set('barcode')} />
        <Field label="Reorder Level" value={form.reorder_level} onChangeText={set('reorder_level')} keyboardType="numeric" />

        <PickerRow label="Category *" options={categories} value={form.category_id} onChange={set('category_id')} />
        <PickerRow label="Unit *" options={units} value={form.unit_id} onChange={set('unit_id')} />

        <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editing ? 'Update Medicine' : 'Save Medicine'}</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
}

/*
|--------------------------------------------------------------------------
| BATCH ADD / EDIT MODAL
|--------------------------------------------------------------------------
*/

function BatchFormModal({ visible, editing, medicines, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!visible) return;
      setForm(
        editing
          ? {
              medicine_id: editing.medicine_id,
              batch_no: editing.batch_no || '',
              manufacture_date: editing.manufacture_date ? String(editing.manufacture_date).substring(0, 10) : '',
              expiry_date: editing.expiry_date ? String(editing.expiry_date).substring(0, 10) : '',
              purchase_price: String(editing.purchase_price || 0),
              sale_price: String(editing.sale_price || 0),
              mrp: String(editing.mrp || 0),
            }
          : { medicine_id: medicines[0]?.id, purchase_price: '0', sale_price: '0', mrp: '0' }
      );
    }, [visible, editing, medicines])
  );

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.medicine_id) return Alert.alert('Medicine required', 'Please select a medicine');
    if (!form.batch_no?.trim()) return Alert.alert('Batch number required', 'Please enter the batch number');

    const payload = {
      medicine_id: Number(form.medicine_id),
      batch_no: form.batch_no.trim(),
      manufacture_date: form.manufacture_date || null,
      expiry_date: form.expiry_date || null,
      purchase_price: Number(form.purchase_price || 0),
      sale_price: Number(form.sale_price || 0),
      mrp: Number(form.mrp || 0),
    };

    setSaving(true);
    try {
      if (editing) {
        await API.put(`/medicine-batches/${editing.id}`, payload);
      } else {
        await API.post('/medicine-batches', payload);
      }
      onSaved();
    } catch (e) {
      Alert.alert('Could not save batch', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }}>
        <SectionTitle>{editing ? 'Edit Batch' : 'Add Batch'}</SectionTitle>

        <PickerRow
          label="Medicine *"
          options={medicines.map((m) => ({ id: m.id, name: `${m.name}${m.strength ? ` — ${m.strength}` : ''}` }))}
          value={form.medicine_id}
          onChange={set('medicine_id')}
        />
        <Field label="Batch Number *" value={form.batch_no} onChangeText={set('batch_no')} placeholder="e.g. BATCH-001" />
        <Field label="Manufacture Date (YYYY-MM-DD)" value={form.manufacture_date} onChangeText={set('manufacture_date')} />
        <Field label="Expiry Date (YYYY-MM-DD)" value={form.expiry_date} onChangeText={set('expiry_date')} />
        <Field label="Purchase Price" value={form.purchase_price} onChangeText={set('purchase_price')} keyboardType="numeric" />
        <Field label="Sale Price" value={form.sale_price} onChangeText={set('sale_price')} keyboardType="numeric" />
        <Field label="MRP" value={form.mrp} onChangeText={set('mrp')} keyboardType="numeric" />

        <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editing ? 'Update Batch' : 'Save Batch'}</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
}

/*
|--------------------------------------------------------------------------
| VIEW MODALS
|--------------------------------------------------------------------------
*/

function ViewMedicineModal({ medicine, onClose }) {
  return (
    <Modal visible={!!medicine} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.viewBackdrop}>
        <View style={styles.viewSheet}>
          <SectionTitle>Medicine Details</SectionTitle>
          {medicine && (
            <ScrollView>
              <DetailRow label="Medicine" value={medicine.name} />
              <DetailRow label="Generic Name" value={medicine.generic_name} />
              <DetailRow label="Strength" value={medicine.strength} />
              <DetailRow label="Pack Size" value={medicine.pack_size} />
              <DetailRow label="Barcode" value={medicine.barcode} />
              <DetailRow label="Category" value={medicine.category_name} />
              <DetailRow label="Unit" value={medicine.unit_name} />
              <DetailRow label="Current Stock" value={String(Number(medicine.stock || 0))} />
              <DetailRow label="Reorder Level" value={String(Number(medicine.reorder_level || 0))} />
              <DetailRow label="Batch Count" value={String(Number(medicine.batch_count || 0))} />
            </ScrollView>
          )}
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ViewBatchModal({ batch, onClose }) {
  return (
    <Modal visible={!!batch} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.viewBackdrop}>
        <View style={styles.viewSheet}>
          <SectionTitle>Batch Details</SectionTitle>
          {batch && (
            <ScrollView>
              <DetailRow label="Medicine" value={batch.medicine_name} />
              <DetailRow label="Batch Number" value={batch.batch_no} />
              <DetailRow label="Manufacture Date" value={batch.manufacture_date ? String(batch.manufacture_date).substring(0, 10) : '-'} />
              <DetailRow label="Expiry Date" value={batch.expiry_date ? String(batch.expiry_date).substring(0, 10) : '-'} />
              <DetailRow label="Purchase Price" value={money(batch.purchase_price)} />
              <DetailRow label="Sale Price" value={money(batch.sale_price)} />
              <DetailRow label="MRP" value={money(batch.mrp)} />
              <DetailRow label="Current Stock" value={String(Number(batch.stock || 0))} />
            </ScrollView>
          )}
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/*
|--------------------------------------------------------------------------
| SHARED SMALL COMPONENTS
|--------------------------------------------------------------------------
*/

function TabButton({ label, active, onPress }) {
  return (
    <TouchableOpacity style={[styles.tabBtn, active && styles.tabBtnActive]} onPress={onPress}>
      <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
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
  search: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10 },
  tabRow: { flexDirection: 'row', marginBottom: 10 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, marginRight: 8 },
  tabBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabBtnText: { fontWeight: '700', color: colors.textSecondary },
  tabBtnTextActive: { color: '#fff' },
  actionRow: { marginBottom: 10 },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, alignSelf: 'flex-start' },
  addBtnText: { color: '#fff', fontWeight: '700' },
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
