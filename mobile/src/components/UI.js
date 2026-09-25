import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

/*
|--------------------------------------------------------------------------
| XMART HOSPITAL DESIGN SYSTEM
| Premium Red + Orange Edition
|--------------------------------------------------------------------------
*/

export const colors = {
  // Brand
  primary: '#D32F2F',
  primaryDark: '#9A0007',
  primaryLight: '#FFEBEE',

  orange: '#E65100',
  orangeDark: '#AC1C00',
  orangeLight: '#FFF3E0',

  // System
  bg: '#F8FAF9',
  card: '#FFFFFF',
  darkPanel: '#1E232A',

  // Typography
  text: '#1A1D20',
  textSecondary: '#4F5660',
  muted: '#8A94A0',

  // Borders
  border: '#EBEFF2',
  borderLight: '#F3F6F8',

  // Status
  success: '#1B5E20',
  successLight: '#E8F5E9',

  warning: '#F57C00',
  warningLight: '#FFF3E0',

  danger: '#C62828',
  dangerLight: '#FFEBEE',

  info: '#0277BD',
  infoLight: '#E1F5FE',

  white: '#FFFFFF',
  black: '#000000',
};

/*
|--------------------------------------------------------------------------
| Currency Formatter
|--------------------------------------------------------------------------
*/

export function money(value) {
  const number = Number(value || 0);

  return `Rs. ${number.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/*
|--------------------------------------------------------------------------
| Loading View
|--------------------------------------------------------------------------
*/

export function LoadingView({ label = 'Loading…' }) {
  return (
    <View style={styles.loadingWrap}>
      <ActivityIndicator size="large" color={colors.primary} />
      {label ? <Text style={styles.loadingLabel}>{label}</Text> : null}
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| Empty State
|--------------------------------------------------------------------------
*/

export function EmptyState({ label = 'Nothing here yet', icon = '📭' }) {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyLabel}>{label}</Text>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| Screen
|--------------------------------------------------------------------------
*/

export function Screen({
  children,
  scroll = false,
  refreshing = false,
  onRefresh,
  style,
}) {
  if (scroll) {
    return (
      <ScrollView
        style={[styles.screen, style]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.screen, style]}>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| Admin Layout
|--------------------------------------------------------------------------
*/

export function AdminLayout({
  children,
  topBarTitle = 'XMART ADMIN',
  onTopAction,
  currentTab,
  onTabPress,
}) {
  return (
    <View style={styles.adminContainer}>

      <TopBar
        title={topBarTitle}
        onAction={onTopAction}
      />

      <View style={styles.adminBody}>

        {/* Left Navigation */}

        <View style={styles.leftNavGrid}>

          <TouchableOpacity
            style={[
              styles.leftGridBtn,
              currentTab === 'dashboard' && styles.leftGridActive,
            ]}
            onPress={() =>
              onTabPress && onTabPress('dashboard')
            }
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.leftGridIcon,
                currentTab === 'dashboard' &&
                  styles.leftGridActiveText,
              ]}
            >
              📊
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.leftGridBtn,
              currentTab === 'stock' && styles.leftGridActive,
            ]}
            onPress={() =>
              onTabPress && onTabPress('stock')
            }
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.leftGridIcon,
                currentTab === 'stock' &&
                  styles.leftGridActiveText,
              ]}
            >
              📦
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.leftGridBtn,
              currentTab === 'sales' && styles.leftGridActive,
            ]}
            onPress={() =>
              onTabPress && onTabPress('sales')
            }
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.leftGridIcon,
                currentTab === 'sales' &&
                  styles.leftGridActiveText,
              ]}
            >
              💰
            </Text>
          </TouchableOpacity>

        </View>

        {/* Main Content */}

        <View style={styles.adminMainArea}>
          {children}
        </View>

      </View>

      <BottomNavigation
        activeTab={currentTab}
        onTabPress={onTabPress}
      />

    </View>
  );
}

/*
|--------------------------------------------------------------------------
| Top Bar
|--------------------------------------------------------------------------
*/

export function TopBar({
  title = 'XMART ADMIN',
  onAction,
}) {
  return (
    <View style={styles.topbarShell}>

      <Text style={styles.topbarTitle}>
        {title}
      </Text>

      <TouchableOpacity
        onPress={onAction}
        style={styles.topbarAvatar}
        activeOpacity={0.8}
      >
        <Text style={styles.avatarText}>
          AD
        </Text>
      </TouchableOpacity>

    </View>
  );
}

/*
|--------------------------------------------------------------------------
| Bottom Navigation
|--------------------------------------------------------------------------
*/

export function BottomNavigation({
  activeTab,
  onTabPress,
}) {
  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '⚡',
    },
    {
      id: 'stock',
      label: 'Inventory',
      icon: '📦',
    },
    {
      id: 'sales',
      label: 'Sales',
      icon: '💰',
    },
    {
      id: 'settings',
      label: 'Config',
      icon: '⚙️',
    },
  ];

  return (
    <View style={styles.bottomBarShell}>

      {tabs.map((tab) => {
        const isSelected = activeTab === tab.id;

        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() =>
              onTabPress && onTabPress(tab.id)
            }
            style={[
              styles.bottomBarTab,
              isSelected && styles.bottomBarTabActive,
            ]}
            activeOpacity={0.7}
          >

            <Text
              style={[
                styles.bottomBarIcon,
                isSelected &&
                  styles.bottomBarIconActive,
              ]}
            >
              {tab.icon}
            </Text>

            <Text
              style={[
                styles.bottomBarLabel,
                isSelected &&
                  styles.bottomBarLabelActive,
              ]}
            >
              {tab.label}
            </Text>

          </TouchableOpacity>
        );
      })}

    </View>
  );
}

/*
|--------------------------------------------------------------------------
| Dashboard Statistic Box
|--------------------------------------------------------------------------
*/

export function StatBox({
  label,
  value,
  tone = 'white',
  icon,
  subtitle,
}) {
  const cardsTheme = {
    danger: {
      bg: colors.primary,
      text: colors.white,
      muteText: 'rgba(255,255,255,0.75)',
      iconBg: 'rgba(255,255,255,0.20)',
    },

    orange: {
      bg: colors.orange,
      text: colors.white,
      muteText: 'rgba(255,255,255,0.75)',
      iconBg: 'rgba(255,255,255,0.20)',
    },

    dark: {
      bg: colors.darkPanel,
      text: colors.white,
      muteText: colors.muted,
      iconBg: 'rgba(255,255,255,0.10)',
    },

    white: {
      bg: colors.white,
      text: colors.text,
      muteText: colors.textSecondary,
      iconBg: colors.borderLight,
    },

    success: {
      bg: colors.success,
      text: colors.white,
      muteText: 'rgba(255,255,255,0.75)',
      iconBg: 'rgba(255,255,255,0.20)',
    },

    info: {
      bg: colors.info,
      text: colors.white,
      muteText: 'rgba(255,255,255,0.75)',
      iconBg: 'rgba(255,255,255,0.20)',
    },
  };

  const theme =
    cardsTheme[tone] || cardsTheme.white;

  return (
    <View
      style={[
        styles.statBoxCard,
        {
          backgroundColor: theme.bg,
        },
      ]}
    >

      <View style={styles.statBoxTop}>

        <Text
          style={[
            styles.statBoxLabel,
            {
              color: theme.muteText,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>

        {icon ? (
          <View
            style={[
              styles.statBoxIconWrapper,
              {
                backgroundColor: theme.iconBg,
              },
            ]}
          >
            <Text style={styles.statBoxIcon}>
              {icon}
            </Text>
          </View>
        ) : null}

      </View>

      <Text
        style={[
          styles.statBoxValue,
          {
            color: theme.text,
          },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>

      {subtitle ? (
        <Text
          style={[
            styles.statBoxSubtitle,
            {
              color: theme.muteText,
            },
          ]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      ) : null}

    </View>
  );
}

/*
|--------------------------------------------------------------------------
| Base Card
|--------------------------------------------------------------------------
*/

export function Card({
  children,
  style,
}) {
  return (
    <View
      style={[
        styles.baseCard,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| Section Title
|--------------------------------------------------------------------------
*/

export function SectionTitle({
  children,
  subtitle,
  action,
  onAction,
}) {
  return (
    <View style={styles.sectionHeader}>

      <View style={styles.sectionHeaderText}>

        <Text style={styles.sectionTitleText}>
          {children}
        </Text>

        {subtitle ? (
          <Text style={styles.sectionSubtitleText}>
            {subtitle}
          </Text>
        ) : null}

      </View>

      {action ? (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionActionText}>
            {action}
          </Text>
        </TouchableOpacity>
      ) : null}

    </View>
  );
}

/*
|--------------------------------------------------------------------------
| Page Header
|--------------------------------------------------------------------------
*/

export function PageHeader({
  title,
  subtitle,
  icon,
}) {
  return (
    <View style={styles.pageHeaderLayout}>

      {icon ? (
        <View style={styles.pageHeaderIconBox}>
          <Text style={styles.pageHeaderIcon}>
            {icon}
          </Text>
        </View>
      ) : null}

      <View style={styles.pageHeaderText}>

        <Text style={styles.pageHeaderTitle}>
          {title}
        </Text>

        {subtitle ? (
          <Text style={styles.pageHeaderSubtitle}>
            {subtitle}
          </Text>
        ) : null}

      </View>

    </View>
  );
}

/*
|--------------------------------------------------------------------------
| Status Badge
|--------------------------------------------------------------------------
*/

export function StatusBadge({
  label,
  type = 'default',
}) {
  const badgeThemes = {
    success: {
      bg: colors.successLight,
      text: colors.success,
    },

    danger: {
      bg: colors.dangerLight,
      text: colors.danger,
    },

    warning: {
      bg: colors.warningLight,
      text: colors.warning,
    },

    primary: {
      bg: colors.primaryLight,
      text: colors.primary,
    },

    orange: {
      bg: colors.orangeLight,
      text: colors.orange,
    },

    info: {
      bg: colors.infoLight,
      text: colors.info,
    },

    default: {
      bg: '#EAEFF2',
      text: colors.textSecondary,
    },
  };

  const theme =
    badgeThemes[type] ||
    badgeThemes.default;

  return (
    <View
      style={[
        styles.badgeFrame,
        {
          backgroundColor: theme.bg,
        },
      ]}
    >

      <View
        style={[
          styles.badgeIndicator,
          {
            backgroundColor: theme.text,
          },
        ]}
      />

      <Text
        style={[
          styles.badgeText,
          {
            color: theme.text,
          },
        ]}
      >
        {label}
      </Text>

    </View>
  );
}

/*
|--------------------------------------------------------------------------
| Primary Button
|--------------------------------------------------------------------------
*/

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
}) {
  return (
    <TouchableOpacity
      style={[
        styles.btnWrapper,
        disabled && styles.btnDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >

      {loading ? (
        <ActivityIndicator
          size="small"
          color={colors.white}
        />
      ) : (
        <Text style={styles.btnText}>
          {title}
        </Text>
      )}

    </TouchableOpacity>
  );
}

/*
|--------------------------------------------------------------------------
| Divider
|--------------------------------------------------------------------------
*/

export function Divider() {
  return (
    <View style={styles.uiDivider} />
  );
}

/*
|--------------------------------------------------------------------------
| Optional Action Box
|--------------------------------------------------------------------------
*/

export function ActionBox({
  title,
  subtitle,
  icon,
  onPress,
  tone = 'primary',
}) {
  const toneColors = {
    primary: {
      backgroundColor: colors.primaryLight,
      iconBackground: colors.primary,
      title: colors.primaryDark,
    },

    orange: {
      backgroundColor: colors.orangeLight,
      iconBackground: colors.orange,
      title: colors.orangeDark,
    },

    success: {
      backgroundColor: colors.successLight,
      iconBackground: colors.success,
      title: colors.success,
    },

    info: {
      backgroundColor: colors.infoLight,
      iconBackground: colors.info,
      title: colors.info,
    },
  };

  const theme =
    toneColors[tone] ||
    toneColors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.actionBox,
        {
          backgroundColor:
            theme.backgroundColor,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >

      <View
        style={[
          styles.actionBoxIcon,
          {
            backgroundColor:
              theme.iconBackground,
          },
        ]}
      >
        <Text style={styles.actionBoxIconText}>
          {icon || '＋'}
        </Text>
      </View>

      <View style={styles.actionBoxContent}>

        <Text
          style={[
            styles.actionBoxTitle,
            {
              color: theme.title,
            },
          ]}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text style={styles.actionBoxSubtitle}>
            {subtitle}
          </Text>
        ) : null}

      </View>

    </TouchableOpacity>
  );
}

/*
|--------------------------------------------------------------------------
| Module Card
|--------------------------------------------------------------------------
*/

export function ModuleCard({
  title,
  subtitle,
  icon,
  onPress,
  tone = 'primary',
}) {
  return (
    <ActionBox
      title={title}
      subtitle={subtitle}
      icon={icon}
      onPress={onPress}
      tone={tone}
    />
  );
}

/*
|--------------------------------------------------------------------------
| StyleSheet
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({

  /*
  |--------------------------------------------------------------------------
  | Global
  |--------------------------------------------------------------------------
  */

  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  content: {
    flex: 1,
    padding: 14,
  },

  scrollContent: {
    padding: 14,
    paddingBottom: 32,
  },

  /*
  |--------------------------------------------------------------------------
  | Loading / Empty
  |--------------------------------------------------------------------------
  */

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },

  loadingLabel: {
    marginTop: 10,
    color: colors.muted,
    fontWeight: '600',
  },

  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },

  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },

  emptyLabel: {
    color: colors.muted,
    fontWeight: '600',
  },

  /*
  |--------------------------------------------------------------------------
  | Admin Layout
  |--------------------------------------------------------------------------
  */

  adminContainer: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  adminBody: {
    flex: 1,
    flexDirection: 'row',
  },

  leftNavGrid: {
    width: 60,
    backgroundColor: colors.darkPanel,
    alignItems: 'center',
    paddingTop: 16,
  },

  leftGridBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
  },

  leftGridActive: {
    backgroundColor: colors.primary,
  },

  leftGridIcon: {
    fontSize: 18,
    color: colors.muted,
  },

  leftGridActiveText: {
    color: colors.white,
  },

  adminMainArea: {
    flex: 1,
    padding: 12,
  },

  /*
  |--------------------------------------------------------------------------
  | Top Bar
  |--------------------------------------------------------------------------
  */

  topbarShell: {
    height: 60,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  topbarTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1,
  },

  topbarAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.white,
  },

  /*
  |--------------------------------------------------------------------------
  | Bottom Navigation
  |--------------------------------------------------------------------------
  */

  bottomBarShell: {
    height: 68,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 6,
  },

  bottomBarTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },

  bottomBarTabActive: {
    opacity: 1,
  },

  bottomBarIcon: {
    fontSize: 18,
    color: colors.textSecondary,
  },

  bottomBarIconActive: {
    color: colors.primary,
  },

  bottomBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.muted,
    marginTop: 3,
  },

  bottomBarLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },

  /*
  |--------------------------------------------------------------------------
  | Statistic Cards
  |--------------------------------------------------------------------------
  */

  statBoxCard: {
    width: (width - 96) / 2,
    minHeight: 110,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    marginRight: 8,

    justifyContent: 'space-between',

    shadowColor: colors.black,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 3,
  },

  statBoxTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  statBoxLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  statBoxIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  statBoxIcon: {
    fontSize: 13,
  },

  statBoxValue: {
    fontSize: 22,
    fontWeight: '900',
    marginVertical: 6,
  },

  statBoxSubtitle: {
    fontSize: 10,
    fontWeight: '500',
  },

  /*
  |--------------------------------------------------------------------------
  | Base Card
  |--------------------------------------------------------------------------
  */

  baseCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,

    shadowColor: colors.black,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 2,
  },

  /*
  |--------------------------------------------------------------------------
  | Section Header
  |--------------------------------------------------------------------------
  */

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },

  sectionHeaderText: {
    flex: 1,
  },

  sectionTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },

  sectionSubtitleText: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },

  sectionActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.orange,
  },

  /*
  |--------------------------------------------------------------------------
  | Page Header
  |--------------------------------------------------------------------------
  */

  pageHeaderLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  pageHeaderIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  pageHeaderIcon: {
    fontSize: 20,
  },

  pageHeaderText: {
    flex: 1,
  },

  pageHeaderTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
  },

  pageHeaderSubtitle: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },

  /*
  |--------------------------------------------------------------------------
  | Status Badge
  |--------------------------------------------------------------------------
  */

  badgeFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  badgeIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },

  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  /*
  |--------------------------------------------------------------------------
  | Buttons
  |--------------------------------------------------------------------------
  */

  btnWrapper: {
    minHeight: 48,
    paddingHorizontal: 18,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  btnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },

  btnDisabled: {
    opacity: 0.5,
  },

  /*
  |--------------------------------------------------------------------------
  | Divider
  |--------------------------------------------------------------------------
  */

  uiDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 12,
  },

  /*
  |--------------------------------------------------------------------------
  | Action / Module Cards
  |--------------------------------------------------------------------------
  */

  actionBox: {
    minHeight: 72,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,

    flexDirection: 'row',
    alignItems: 'center',

    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  actionBoxIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  actionBoxIconText: {
    fontSize: 20,
    color: colors.white,
  },

  actionBoxContent: {
    flex: 1,
  },

  actionBoxTitle: {
    fontSize: 14,
    fontWeight: '800',
  },

  actionBoxSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 3,
  },

});