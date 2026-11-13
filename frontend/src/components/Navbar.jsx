import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ activeTab, onSelectTab }) => {
  const { user, isManager, isEmployee, logout } = useAuth();

  if (!user) return null;

  return (
    <View style={styles.navContainer}>
      <View style={styles.navContent}>
        {/* Brand */}
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>EC</Text>
          </View>
          <Text style={styles.brandTitle}>ExpenseClaim</Text>
        </View>

        {/* Menu Items based on Role (Requirement 14) */}
        <View style={styles.menuLinks}>
          {isEmployee && (
            <>
              <TouchableOpacity
                style={[styles.menuItem, activeTab === 'employee-dashboard' && styles.menuItemActive]}
                onPress={() => onSelectTab('employee-dashboard')}
              >
                <Text style={[styles.menuText, activeTab === 'employee-dashboard' && styles.menuTextActive]}>
                  Dashboard
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, activeTab === 'my-claims' && styles.menuItemActive]}
                onPress={() => onSelectTab('my-claims')}
              >
                <Text style={[styles.menuText, activeTab === 'my-claims' && styles.menuTextActive]}>
                  My Claims
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, styles.createClaimBtn]}
                onPress={() => onSelectTab('create-claim')}
              >
                <Text style={styles.createClaimBtnText}>+ New Claim</Text>
              </TouchableOpacity>
            </>
          )}

          {isManager && (
            <>
              <TouchableOpacity
                style={[styles.menuItem, activeTab === 'manager-dashboard' && styles.menuItemActive]}
                onPress={() => onSelectTab('manager-dashboard')}
              >
                <Text style={[styles.menuText, activeTab === 'manager-dashboard' && styles.menuTextActive]}>
                  Dashboard
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, activeTab === 'all-claims' && styles.menuItemActive]}
                onPress={() => onSelectTab('all-claims')}
              >
                <Text style={[styles.menuText, activeTab === 'all-claims' && styles.menuTextActive]}>
                  All Claims
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, activeTab === 'users' && styles.menuItemActive]}
                onPress={() => onSelectTab('users')}
              >
                <Text style={[styles.menuText, activeTab === 'users' && styles.menuTextActive]}>
                  Users
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* User Info & Logout */}
        <View style={styles.userSection}>
          <View style={styles.userMeta}>
            <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
            <View style={[styles.roleBadge, isManager ? styles.managerBadge : styles.employeeBadge]}>
              <Text style={[styles.roleText, isManager ? styles.managerRoleText : styles.employeeRoleText]}>
                {isManager ? 'MANAGER' : 'EMPLOYEE'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  navContent: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: colors.textWhite,
    fontWeight: 'bold',
    fontSize: 16,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  menuLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  menuItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  menuItemActive: {
    backgroundColor: colors.primaryLight,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  menuTextActive: {
    color: colors.primaryDark,
  },
  createClaimBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
  },
  createClaimBtnText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userMeta: {
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    maxWidth: 140,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  employeeBadge: {
    backgroundColor: colors.secondaryLight,
  },
  managerBadge: {
    backgroundColor: colors.warningLight,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
  },
  employeeRoleText: {
    color: colors.secondary,
  },
  managerRoleText: {
    color: colors.warningDark,
  },
  logoutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutBtnText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
