import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import API from '../api/client';
import { Screen, Card, SectionTitle, StatBox, LoadingView, money, colors } from '../components/UI';

export default function DashboardScreen() {
  const [summary, setSummary] = useState(null);
  const [pl, setPl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [a, b] = await Promise.all([
        API.get('/dashboard/summary'),
        API.get('/reports/profit-loss'),
      ]);
      setSummary(a.data);
      setPl(b.data);
    } catch (e) {
      // silently ignore; other screens will surface connection issues too
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

  if (loading) return <LoadingView label="Loading dashboard…" />;

  const d = summary || {};
  const p = pl || {};

  return (
    <Screen scroll refreshing={refreshing} onRefresh={() => load(true)}>
      <SectionTitle>Dashboard</SectionTitle>
      <View style={styles.grid}>
        <StatBox label="Today Sales" value={money(d.todaySales)} />
        <StatBox label="Today Purchases" value={money(d.todayPurchases)} />
        <StatBox label="Patients Today" value={String(d.todayPatients || 0)} />
        <StatBox label="Today Expenses" value={money(d.todayExpenses)} />
        <StatBox label="Low Stock Items" value={String(d.lowStock || 0)} tone={d.lowStock > 0 ? 'danger' : undefined} />
        <StatBox label="Expiring ≤90 Days" value={String(d.expiry90Days || 0)} tone={d.expiry90Days > 0 ? 'danger' : undefined} />
      </View>

      <Card>
        <Text style={styles.cardTitle}>Financial overview</Text>
        <Row label="Sales" value={money(p.sales)} />
        <Row label="Cost of Goods Sold" value={money(p.costOfGoodsSold)} />
        <Row label="Gross Profit" value={money(p.grossProfit)} bold />
        <Row label="Expenses" value={money(p.expenses)} />
        <Row label="Net Profit" value={money(p.netProfit)} bold accent />
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cardTitle: { fontWeight: '800', fontSize: 16, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { color: colors.muted },
  rowValue: { fontWeight: '600' },
});
