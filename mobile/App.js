
import 'react-native-gesture-handler';

import React from 'react';

import { StatusBar } from 'expo-status-bar';

import {
  NavigationContainer,
} from '@react-navigation/native';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import {
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import {
  Text,
} from 'react-native';

import {
  AuthProvider,
  useAuth,
} from './src/context/AuthContext';

import {
  colors,
  LoadingView,
} from './src/components/UI';


// ============================================================
// SCREENS
// ============================================================

import LoginScreen
  from './src/screens/LoginScreen';

import DashboardScreen
  from './src/screens/DashboardScreen';

import PatientsScreen
  from './src/screens/PatientsScreen';

import MedicinesScreen
  from './src/screens/MedicinesScreen';

import SalesScreen
  from './src/screens/SalesScreen';

import NewSaleScreen
  from './src/screens/NewSaleScreen';

import ReportsScreen
  from './src/screens/ReportsScreen';

import MoreScreen
  from './src/screens/MoreScreen';

import SettingsScreen
  from './src/screens/SettingsScreen';

import DoctorsScreen
  from './src/screens/DoctorsScreen';

import PurchasesScreen
  from './src/screens/PurchasesScreen';

import NewPurchaseScreen
  from './src/screens/NewPurchaseScreen';

import SaleReturnScreen
  from './src/screens/SaleReturnScreen';

import SuppliersScreen
  from './src/screens/SuppliersScreen';


// ============================================================
// NAVIGATORS
// ============================================================

const AuthStack =
  createNativeStackNavigator();

const RootStack =
  createNativeStackNavigator();

const Tabs =
  createBottomTabNavigator();


// ============================================================
// TAB ICONS
// ============================================================

const TAB_ICONS = {

  Dashboard: '⌂',

  Patients: '⚕',

  Medicines: '💊',

  Sales: '₨',

  More: '•••',

};


// ============================================================
// TAB ICON COMPONENT
// ============================================================

function TabIcon({
  label,
  focused,
}) {

  return (

    <Text
      style={{
        fontSize: 20,

        color:
          focused
            ? colors.primary
            : '#9ca3af',

        fontWeight:
          focused
            ? '700'
            : '400',

      }}
    >

      {
        TAB_ICONS[label] ||
        '•'
      }

    </Text>

  );

}


// ============================================================
// MAIN TABS
// ============================================================

function MainTabs() {

  return (

    <Tabs.Navigator

      initialRouteName="Dashboard"

      screenOptions={({ route }) => ({

        headerShown: false,

        tabBarShowLabel: true,

        tabBarActiveTintColor:
          colors.primary,

        tabBarInactiveTintColor:
          '#9ca3af',

        tabBarIcon: ({
          focused,
        }) => (

          <TabIcon
            label={route.name}
            focused={focused}
          />

        ),

        tabBarStyle: {

          height: 65,

          paddingTop: 5,

          paddingBottom: 8,

          borderTopWidth: 1,

          borderTopColor:
            '#e5e7eb',

          backgroundColor:
            '#ffffff',

        },

        tabBarLabelStyle: {

          fontSize: 12,

          fontWeight: '600',

        },

      })}

    >

      {/* ======================================================
          DASHBOARD
      ====================================================== */}

      <Tabs.Screen

        name="Dashboard"

        component={
          DashboardScreen
        }

        options={{
          title: 'Dashboard',
        }}

      />


      {/* ======================================================
          PATIENTS
      ====================================================== */}

      <Tabs.Screen

        name="Patients"

        component={
          PatientsScreen
        }

        options={{
          title: 'Patients',
        }}

      />


      {/* ======================================================
          MEDICINES
      ====================================================== */}

      <Tabs.Screen

        name="Medicines"

        component={
          MedicinesScreen
        }

        options={{
          title: 'Medicines',
        }}

      />


      {/* ======================================================
          SALES
      ====================================================== */}

      <Tabs.Screen

        name="Sales"

        component={
          SalesScreen
        }

        options={{
          title: 'Sales',
        }}

      />


      {/* ======================================================
          MORE
      ====================================================== */}

      <Tabs.Screen

        name="More"

        component={
          MoreScreen
        }

        options={{
          title: 'More',
        }}

      />

    </Tabs.Navigator>

  );

}


// ============================================================
// AUTH FLOW
// ============================================================

function AuthFlow() {

  return (

    <AuthStack.Navigator

      screenOptions={{
        headerShown: false,
      }}

    >

      {/* LOGIN */}

      <AuthStack.Screen

        name="Login"

        component={
          LoginScreen
        }

      />


      {/* SETTINGS BEFORE LOGIN */}

      <AuthStack.Screen

        name="Settings"

        component={
          SettingsScreen
        }

        options={{

          headerShown: true,

          title:
            'Connection Settings',

        }}

      />

    </AuthStack.Navigator>

  );

}


// ============================================================
// APPLICATION FLOW
// ============================================================

function AppFlow() {

  return (

    <RootStack.Navigator

      screenOptions={{

        headerBackTitle:
          'Back',

        headerTintColor:
          colors.primary,

        headerTitleStyle: {

          fontWeight:
            '700',

        },

        headerStyle: {

          backgroundColor:
            '#ffffff',

        },

      }}

    >

      {/* ======================================================
          MAIN TABS
      ====================================================== */}

      <RootStack.Screen

        name="MainTabs"

        component={
          MainTabs
        }

        options={{

          headerShown:
            false,

        }}

      />


      {/* ======================================================
          NEW SALE
      ====================================================== */}

      <RootStack.Screen

        name="NewSale"

        component={
          NewSaleScreen
        }

        options={{

          title:
            'New Sale',

        }}

      />


      {/* ======================================================
          REPORTS
      ====================================================== */}

      <RootStack.Screen

        name="Reports"

        component={
          ReportsScreen
        }

        options={{

          title:
            'Reports',

        }}

      />


      {/* ======================================================
          DOCTORS
      ====================================================== */}

      <RootStack.Screen

        name="Doctors"

        component={
          DoctorsScreen
        }

        options={{

          title:
            'Doctors',

        }}

      />


      {/* ======================================================
          PURCHASES
      ====================================================== */}

      <RootStack.Screen

        name="Purchases"

        component={
          PurchasesScreen
        }

        options={{

          title:
            'Purchases',

        }}

      />


      {/* ======================================================
          NEW / EDIT PURCHASE
      ====================================================== */}

      <RootStack.Screen

        name="NewPurchase"

        component={
          NewPurchaseScreen
        }

        options={{

          title:
            'Purchase',

        }}

      />


      {/* ======================================================
          SALE RETURN (CREDIT NOTE)
      ====================================================== */}

      <RootStack.Screen

        name="SaleReturn"

        component={
          SaleReturnScreen
        }

        options={{

          title:
            'Sale Return',

        }}

      />


      {/* ======================================================
          SUPPLIERS
      ====================================================== */}

      <RootStack.Screen

        name="Suppliers"

        component={
          SuppliersScreen
        }

        options={{

          title:
            'Suppliers',

        }}

      />


      {/* ======================================================
          SETTINGS
      ====================================================== */}

      <RootStack.Screen

        name="Settings"

        component={
          SettingsScreen
        }

        options={{

          title:
            'Connection Settings',

        }}

      />

    </RootStack.Navigator>

  );

}


// ============================================================
// ROOT
// ============================================================

function Root() {

  const {
    user,
    booting,
  } = useAuth();


  // ==========================================================
  // STARTUP
  // ==========================================================

  if (booting) {

    return (

      <LoadingView

        label={
          'Starting Punjab Hospital…'
        }

      />

    );

  }


  // ==========================================================
  // NAVIGATION
  // ==========================================================

  return (

    <NavigationContainer>

      {
        user
          ? <AppFlow />
          : <AuthFlow />
      }

    </NavigationContainer>

  );

}


// ============================================================
// APP
// ============================================================

export default function App() {

  return (

    <AuthProvider>

      <StatusBar
        style="dark"
      />

      <Root />

    </AuthProvider>

  );

}
