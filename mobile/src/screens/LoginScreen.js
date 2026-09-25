import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../components/UI';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();

  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        'Missing Information',
        'Please enter your email and password.'
      );
      return;
    }

    setLoading(true);

    try {
      await login(email.trim(), password);
    } catch (e) {
      Alert.alert(
        'Login Failed',
        e?.message || 'Unable to sign in. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F5F9FF"
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Background Decorative Shapes */}
        <View style={styles.backgroundCircleOne} />
        <View style={styles.backgroundCircleTwo} />

        <View style={styles.content}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCrossVertical} />
              <View style={styles.logoCrossHorizontal} />
            </View>

            <Text style={styles.brand}>XMART</Text>

            <View style={styles.systemBadge}>
              <Text style={styles.systemBadgeText}>
                HOSPITAL MANAGEMENT SYSTEM 
              </Text>
            </View>
          </View>

          {/* Login Card */}
          <View style={styles.card}>

            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>
                Welcome Back
              </Text>

              <Text style={styles.welcomeSubtitle}>
                Sign in to access your hospital management dashboard
              </Text>
            </View>

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>

              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Text style={styles.iconText}>@</Text>
                </View>

                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="Enter your email"
                  placeholderTextColor="#9AA8BA"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.label}>PASSWORD</Text>

              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Text style={styles.lockIcon}>●</Text>
                </View>

                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#9AA8BA"
                  editable={!loading}
                />

                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <Text style={styles.eyeText}>
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In */}
            <TouchableOpacity
              style={[
                styles.button,
                loading && styles.buttonDisabled,
              ]}
              onPress={submit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>
                    Sign In
                  </Text>

                  <Text style={styles.arrow}>
                    →
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* API Settings */}
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate('Settings')}
              disabled={loading}
            >
              <Text style={styles.settingsIcon}>⚙</Text>

              <Text style={styles.settingsText}>
                API Connection Settings
              </Text>
            </TouchableOpacity>

          </View>

          {/* Features */}
          <View style={styles.features}>
            <View style={styles.feature}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>
                Secure
              </Text>
            </View>

            <View style={styles.feature}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>
                Pharmacy
              </Text>
            </View>

            <View style={styles.feature}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>
                Inventory
              </Text>
            </View>

            <View style={styles.feature}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>
                Accounts
              </Text>
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            © {new Date().getFullYear()} Xmart Solutions LLC
          </Text>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },

  container: {
    flex: 1,
    overflow: 'hidden',
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },

  /* Background */

  backgroundCircleOne: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#E4F1FF',
    top: -150,
    right: -120,
  },

  backgroundCircleTwo: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#EAF8F5',
    bottom: -130,
    left: -120,
  },

  /* Header */

  header: {
    alignItems: 'center',
    marginBottom: 22,
  },

  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,

    shadowColor: '#1677FF',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 6,
  },

  logoCrossVertical: {
    position: 'absolute',
    width: 12,
    height: 38,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },

  logoCrossHorizontal: {
    position: 'absolute',
    width: 38,
    height: 12,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },

  brand: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 4,
    color: '#142033',
  },

  systemBadge: {
    marginTop: 7,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#E8F2FF',
  },

  systemBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.primary,
  },

  /* Card */

  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,

    shadowColor: '#142033',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.08,
    shadowRadius: 25,
    elevation: 8,
  },

  welcomeSection: {
    marginBottom: 22,
  },

  welcomeTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: '#142033',
    marginBottom: 7,
  },

  welcomeSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: '#7B899B',
  },

  /* Fields */

  field: {
    marginBottom: 17,
  },

  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: '#65758A',
    marginBottom: 8,
  },

  inputContainer: {
    height: 52,
    borderWidth: 1,
    borderColor: '#DCE5EF',
    borderRadius: 12,
    backgroundColor: '#FAFCFE',
    flexDirection: 'row',
    alignItems: 'center',
  },

  inputIcon: {
    width: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },

  lockIcon: {
    fontSize: 10,
    color: colors.primary,
  },

  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#182536',
    paddingVertical: 0,
  },

  eyeButton: {
    height: '100%',
    paddingHorizontal: 13,
    justifyContent: 'center',
  },

  eyeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },

  /* Button */

  button: {
    height: 53,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,

    shadowColor: '#1677FF',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.20,
    shadowRadius: 10,
    elevation: 5,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  arrow: {
    color: '#FFFFFF',
    fontSize: 21,
    marginLeft: 10,
    marginTop: -2,
  },

  /* Settings */

  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 19,
    paddingVertical: 6,
  },

  settingsIcon: {
    fontSize: 15,
    color: '#718096',
    marginRight: 7,
  },

  settingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
  },

  /* Features */

  features: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 20,
  },

  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 7,
    marginVertical: 3,
  },

  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#35B997',
    marginRight: 5,
  },

  featureText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7A899B',
  },

  /* Footer */

  footer: {
    fontSize: 10,
    color: '#9AA8B8',
    marginTop: 16,
  },
});