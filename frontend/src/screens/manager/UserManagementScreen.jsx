import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../context/AuthContext';

export const UserManagementScreen = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  const fetchUsers = async (targetPage = page, targetSearch = search) => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: targetPage,
        size: 10,
        sort: 'createdAt,desc',
      };
      if (targetSearch.trim()) params.search = targetSearch.trim();

      const data = await userApi.getUsers(params);
      setUsers(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(0, search);
    setPage(0);
  }, []);

  const handleSearchSubmit = () => {
    fetchUsers(0, search);
    setPage(0);
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = !user.active;
    const actionLabel = nextStatus ? 'activate' : 'deactivate';

    if (!window.confirm(`Are you sure you want to ${actionLabel} ${user.name} (${user.email})?`)) {
      return;
    }

    try {
      setActionLoading(user.id);
      await userApi.toggleUserStatus(user.id, nextStatus);
      fetchUsers(page, search);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>User Management</Text>
          <Text style={styles.subtitle}>
            Manage employee access permissions and activate or deactivate accounts ({totalElements} users)
          </Text>
        </View>
      </View>

      {/* Search card */}
      <View style={styles.searchCard}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users by name or email address..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearchSubmit}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearchSubmit}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* User list */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading user directory...</Text>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>No users found</Text>
          <Text style={styles.emptySubtitle}>Try searching with different terms.</Text>
        </View>
      ) : (
        <View style={styles.usersList}>
          {users.map((u) => {
            const isSelf = currentUser?.id === u.id;
            const isManager = u.role === 'ROLE_MANAGER';

            return (
              <View key={u.id} style={styles.userCard}>
                <View style={styles.userLeft}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{u.name?.charAt(0).toUpperCase() || 'U'}</Text>
                  </View>
                  <View style={styles.userInfo}>
                    <View style={styles.userNameRow}>
                      <Text style={styles.userName}>{u.name}</Text>
                      {isSelf && <Text style={styles.selfBadge}>(You)</Text>}
                    </View>
                    <Text style={styles.userEmail}>{u.email}</Text>
                    <View style={styles.userMeta}>
                      <View
                        style={[
                          styles.roleTag,
                          isManager ? styles.managerRoleTag : styles.employeeRoleTag,
                        ]}
                      >
                        <Text
                          style={[
                            styles.roleTagText,
                            isManager ? styles.managerRoleText : styles.employeeRoleText,
                          ]}
                        >
                          {isManager ? 'MANAGER' : 'EMPLOYEE'}
                        </Text>
                      </View>
                      <Text style={styles.bullet}>•</Text>
                      <View style={styles.statusIndicator}>
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: u.active ? colors.success : colors.danger },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusLabel,
                            { color: u.active ? colors.successDark : colors.dangerDark },
                          ]}
                        >
                          {u.active ? 'Active' : 'Deactivated'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Status Toggle Action Button (Requirement 13) */}
                <View style={styles.userRight}>
                  {isSelf ? (
                    <Text style={styles.selfNotice}>Cannot modify own account</Text>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.toggleBtn,
                        u.active ? styles.deactivateBtn : styles.activateBtn,
                      ]}
                      onPress={() => handleToggleStatus(u)}
                      disabled={actionLoading === u.id}
                    >
                      <Text
                        style={[
                          styles.toggleBtnText,
                          u.active ? styles.deactivateBtnText : styles.activateBtnText,
                        ]}
                      >
                        {actionLoading === u.id
                          ? 'Updating...'
                          : u.active
                          ? 'Deactivate User'
                          : 'Activate User'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <View style={styles.paginationRow}>
          <TouchableOpacity
            style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
            onPress={() => {
              if (page > 0) {
                setPage(page - 1);
                fetchUsers(page - 1, search);
              }
            }}
            disabled={page === 0}
          >
            <Text style={[styles.pageBtnText, page === 0 && styles.pageBtnTextDisabled]}>← Previous</Text>
          </TouchableOpacity>

          <Text style={styles.pageIndicator}>Page {page + 1} of {totalPages}</Text>

          <TouchableOpacity
            style={[styles.pageBtn, page >= totalPages - 1 && styles.pageBtnDisabled]}
            onPress={() => {
              if (page < totalPages - 1) {
                setPage(page + 1);
                fetchUsers(page + 1, search);
              }
            }}
            disabled={page >= totalPages - 1}
          >
            <Text style={[styles.pageBtnText, page >= totalPages - 1 && styles.pageBtnTextDisabled]}>Next →</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    padding: 20,
    gap: 16,
  },
  header: {
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  searchCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
  },
  searchBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  searchBtnText: {
    color: colors.textWhite,
    fontWeight: '600',
    fontSize: 13,
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: colors.dangerDark,
    fontSize: 13,
  },
  centerBox: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: colors.textSecondary,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    padding: 36,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  usersList: {
    gap: 12,
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 260,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryDark,
  },
  userInfo: {
    gap: 4,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  selfBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  roleTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  employeeRoleTag: {
    backgroundColor: colors.secondaryLight,
  },
  managerRoleTag: {
    backgroundColor: colors.warningLight,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  employeeRoleText: {
    color: colors.secondary,
  },
  managerRoleText: {
    color: colors.warningDark,
  },
  bullet: {
    fontSize: 10,
    color: colors.textMuted,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  userRight: {
    alignItems: 'flex-end',
  },
  selfNotice: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  deactivateBtn: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
  },
  deactivateBtnText: {
    color: colors.dangerDark,
    fontSize: 12,
    fontWeight: '700',
  },
  activateBtn: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  activateBtnText: {
    color: colors.successDark,
    fontSize: 12,
    fontWeight: '700',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  pageBtn: {
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  pageBtnTextDisabled: {
    color: colors.textMuted,
  },
  pageIndicator: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
