import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import API from '../api/client';
import { Screen, Card, SectionTitle, EmptyState, colors } from '../components/UI';

export default function PartyScreen() {
  const [data,setData]=useState([]),[q,setQ]=useState(''),[type,setType]=useState('all'),[loading,setLoading]=useState(true);
  const load=useCallback(async()=>{setLoading(true);try{const r=await API.get('/parties',{params:{search:q,type}});setData(r.data||[])}catch(e){Alert.alert('Could not load parties',e.message)}finally{setLoading(false)}},[q,type]);
  useFocusEffect(useCallback(()=>{load()},[load]));
  return <Screen>
    <SectionTitle>Parties</SectionTitle>
    <TextInput style={styles.search} placeholder="Search name or mobile" value={q} onChangeText={setQ} onSubmitEditing={load}/>
    <View style={styles.filters}>{['all','customer','supplier'].map(x=><TouchableOpacity key={x} style={[styles.filter,x===type&&styles.active]} onPress={()=>setType(x)}><Text style={[styles.filterText,x===type&&styles.activeText]}>{x==='all'?'All':x==='customer'?'Customers':'Suppliers'}</Text></TouchableOpacity>)}</View>
    {loading ? <Text style={styles.meta}>Loading…</Text> : <FlatList data={data} keyExtractor={i=>`${i.source_type}-${i.id}`} ListEmptyComponent={<EmptyState label="No parties found"/>} renderItem={({item})=><Card><Text style={styles.name}>{item.name}</Text><Text style={styles.meta}>{item.party_type} · {item.mobile||'No mobile'}</Text><Text style={styles.meta}>{item.address||''}</Text></Card>}/>} 
  </Screen>;
}
const styles=StyleSheet.create({search:{borderWidth:1,borderColor:colors.border,borderRadius:10,paddingHorizontal:12,paddingVertical:10,marginBottom:10},filters:{flexDirection:'row',gap:8,marginBottom:12},filter:{paddingHorizontal:12,paddingVertical:8,borderRadius:8,borderWidth:1,borderColor:colors.border},active:{backgroundColor:colors.primary,borderColor:colors.primary},filterText:{fontWeight:'600'},activeText:{color:'#fff'},name:{fontWeight:'800',fontSize:16},meta:{color:colors.muted,marginTop:3}});
