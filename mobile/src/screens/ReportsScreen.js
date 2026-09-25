import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import API from '../api/client';
import { Screen, Card, SectionTitle, LoadingView, EmptyState, colors, money } from '../components/UI';

export default function ReportsScreen() {
  const [pl, setPl] = useState({});
  const [expiry, setExpiry] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([API.get('/reports/profit-loss'), API.get('/reports/expiry')])
        .then(([a, b]) => {
          setPl(a.data);
          setExpiry(b.data);
        })
        .finally(() => setLoading(false));
    }, [])
  );

  if (loading) return <LoadingView />;

  return (
    <Screen scroll>
      <SectionTitle>Reports</SectionTitle>
      <Card>
        <Text style={styles.cardTitle}>Profit & Loss</Text>
        <Row label="Sales" value={money(pl.sales)} />
        <Row label="Cost of Goods Sold" value={money(pl.costOfGoodsSold)} />
        <Row label="Gross Profit" value={money(pl.grossProfit)} bold />
        <Row label="Expenses" value={money(pl.expenses)} />
        <Row label="Net Profit" value={money(pl.netProfit)} bold accent />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Expiring within 90 days</Text>
        {expiry.length === 0 && <EmptyState label="No batches expiring soon" />}
        {expiry.map((b) => (
          <View key={b.id} style={styles.expiryRow}>
            <Text style={{ fontWeight: '600' }}>{b.medicine_name}</Text>
            <Text style={styles.meta}>Batch {b.batch_no} · Expiry {b.expiry_date} · Stock {b.stock}</Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

function Row({ label, value, bold, accent }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, bold && { fontWeight: '800' }, accent && { color: colors.primary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontWeight: '800', fontSize: 16, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { color: colors.muted },
  rowValue: { fontWeight: '600' },
  expiryRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  meta: { color: colors.muted, marginTop: 2, fontSize: 12 },
});
