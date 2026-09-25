import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import API from '../api/client';
import { Screen, Card, SectionTitle, LoadingView, EmptyState, colors, money } from '../components/UI';

export default function SalesScreen({ navigation }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const r = await API.get('/sales');
      setData(r.data);
    } catch (e) {
      Alert.alert('Could not load sales', e.message);
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

  return (
    <Screen>
      <View style={styles.head}>
        <SectionTitle>Pharmacy Sales</SectionTitle>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('NewSale')}>
          <Text style={styles.addBtnText}>+ New Sale</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(i) => String(i.id)}
          refreshing={refreshing}
          onRefresh={() => load(true)}
          ListEmptyComponent={<EmptyState label="No sales yet" />}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.name}>{item.invoice_no}</Text>
                <Text style={styles.total}>{money(item.net_total)}</Text>
              </View>
              <Text style={styles.meta}>{item.patient_name || 'Walk-in'} · {item.payment_method}</Text>
              <Text style={styles.meta}>{item.invoice_date}</Text>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => navigation.navigate('NewSale', { saleId: item.id })}>
                  <Text style={styles.link}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('SaleReturn', { saleId: item.id })}>
                  <Text style={styles.link}>Return</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '700' },
  name: { fontWeight: '700', fontSize: 16 },
  total: { fontWeight: '800', fontSize: 16, color: colors.primary },
  meta: { color: colors.muted, marginTop: 2 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', gap: 16, marginTop: 10 },
  link: { color: colors.primary, fontWeight: '800', marginRight: 16 },
});
