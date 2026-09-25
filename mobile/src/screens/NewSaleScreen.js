import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import API from '../api/client';
import { Screen, Card, SectionTitle, colors, money } from '../components/UI';

export default function NewSaleScreen({ navigation, route }) {
  const saleId = route?.params?.saleId;
  const [batches, setBatches] = useState([]);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [paid, setPaid] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(!!saleId);

  useEffect(() => {
    API.get('/sales/batches').then((r) => setBatches(r.data)).catch(() => {});
    API.get('/patients').then((r) => setPatients(r.data)).catch(() => {});
  }, []);

  // Editing an existing sale: load its current lines. Reducing a quantity
  // here and saving will automatically post a Credit Note (Sale Return) for
  // the difference and put the stock back; increasing a quantity sells more
  // and takes the extra stock out — the backend handles both when this
  // invoice is submitted through the same Save action below.
  useEffect(() => {
    if (!saleId) return;
    setLoading(true);
    API.get(`/sales/${saleId}`)
      .then((r) => {
        setInvoiceNo(r.data.invoice_no || '');
        setPaid(String(r.data.paid || ''));
        setItems(
          (r.data.items || []).map((i) => ({
            batch_id: i.batch_id,
            medicine_id: i.medicine_id,
            medicine_name: i.medicine_name,
            batch_no: i.batch_no,
            unit_price: Number(i.unit_price),
            qty: Number(i.qty),
            maxStock: Number(i.qty) + 100000, // editing an existing line isn't capped by current shelf stock
          }))
        );
      })
      .catch((e) => Alert.alert('Could not load sale', e.message))
      .finally(() => setLoading(false));
  }, [saleId]);

  const filtered = batches.filter(
    (b) => Number(b.stock) > 0 && (!search || b.medicine_name.toLowerCase().includes(search.toLowerCase()))
  );

  const addLine = (batch) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.batch_id === batch.id);
      if (existing) {
        return prev.map((p) => (p.batch_id === batch.id ? { ...p, qty: p.qty + 1 } : p));
      }
      return [
        ...prev,
        {
          batch_id: batch.id,
          medicine_id: batch.medicine_id,
          medicine_name: batch.medicine_name,
          batch_no: batch.batch_no,
          unit_price: Number(batch.sale_price),
          qty: 1,
          maxStock: Number(batch.stock),
        },
      ];
    });
  };

  const changeQty = (batch_id, delta) => {
    setItems((prev) =>
      prev
        .map((p) => (p.batch_id === batch_id ? { ...p, qty: Math.max(0, Math.min(p.maxStock, p.qty + delta)) } : p))
        .filter((p) => p.qty > 0)
    );
  };

  const total = items.reduce((s, i) => s + i.qty * i.unit_price, 0);

  const post = async () => {
    if (!items.length) return Alert.alert('Empty cart', 'Add at least one medicine');
    setPosting(true);
    try {
      const body = {
        invoice_no: invoiceNo || 'INV-' + Date.now(),
        items: items.map((i) => ({ medicine_id: i.medicine_id, batch_id: i.batch_id, qty: i.qty, unit_price: i.unit_price })),
        paid: Number(paid) || 0,
        payment_method: 'Cash',
      };
      if (saleId) {
        const res = await API.put(`/sales/${saleId}`, body);
        const note = res.data && res.data.auto_credit_note;
        Alert.alert(
          'Sale updated',
          note ? `Reduced quantity posted as Credit Note ${note.return_no} and stock was adjusted.` : 'Stock and balance have been adjusted.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        await API.post('/sales', body);
        Alert.alert('Sale posted', 'Stock has been deducted', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (e) {
      Alert.alert(saleId ? 'Could not update sale' : 'Could not post sale', e.message);
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator />
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionTitle>{saleId ? `Edit Sale — ${invoiceNo}` : 'New Pharmacy Sale'}</SectionTitle>
      <TextInput
        style={styles.search}
        placeholder="Search medicine to add…"
        value={search}
        onChangeText={setSearch}
      />
      {!!search && (
        <FlatList
          style={{ maxHeight: 180, marginBottom: 12 }}
          data={filtered.slice(0, 20)}
          keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.searchRow} onPress={() => { addLine(item); setSearch(''); }}>
              <Text style={{ fontWeight: '600' }}>{item.medicine_name}</Text>
              <Text style={styles.meta}>{item.batch_no} · Stock {item.stock} · {money(item.sale_price)}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {items.map((i) => (
        <Card key={i.batch_id}>
          <Text style={styles.name}>{i.medicine_name}</Text>
          <Text style={styles.meta}>Batch {i.batch_no} · {money(i.unit_price)} each</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(i.batch_id, -1)}>
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{i.qty}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(i.batch_id, 1)}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
            <Text style={styles.lineTotal}>{money(i.qty * i.unit_price)}</Text>
          </View>
        </Card>
      ))}

      <Card>
        <View style={styles.rowBetween}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{money(total)}</Text>
        </View>
        <Text style={styles.label}>Amount Paid</Text>
        <TextInput style={styles.search} keyboardType="numeric" value={paid} onChangeText={setPaid} placeholder="0" />
      </Card>

      <TouchableOpacity style={styles.postBtn} onPress={post} disabled={posting}>
        {posting ? <ActivityIndicator color="#fff" /> : <Text style={styles.postBtnText}>{saleId ? 'Save Changes' : 'Post Sale'}</Text>}
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8 },
  searchRow: { backgroundColor: '#fff', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  meta: { color: colors.muted, marginTop: 2, fontSize: 12 },
  name: { fontWeight: '700', fontSize: 16 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  qtyBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  qtyBtnText: { fontSize: 18, fontWeight: '700' },
  qtyValue: { marginHorizontal: 14, fontWeight: '700', fontSize: 16, minWidth: 24, textAlign: 'center' },
  lineTotal: { marginLeft: 'auto', fontWeight: '800' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel: { fontSize: 16, color: colors.muted },
  totalValue: { fontSize: 20, fontWeight: '800', color: colors.primary },
  label: { fontSize: 13, color: colors.muted, marginBottom: 6, marginTop: 6 },
  postBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
