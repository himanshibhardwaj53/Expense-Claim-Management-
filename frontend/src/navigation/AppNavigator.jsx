import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';

// Auth screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

// Common screens
import { AccessDeniedScreen } from '../screens/common/AccessDeniedScreen';
import { ClaimDetailScreen } from '../screens/common/ClaimDetailScreen';

// Employee screens
import { EmployeeDashboardScreen } from '../screens/employee/EmployeeDashboardScreen';
import { MyClaimsScreen } from '../screens/employee/MyClaimsScreen';
import { CreateEditClaimScreen } from '../screens/employee/CreateEditClaimScreen';

// Manager screens
import { ManagerDashboardScreen } from '../screens/manager/ManagerDashboardScreen';
import { AllClaimsScreen } from '../screens/manager/AllClaimsScreen';
import { UserManagementScreen } from '../screens/manager/UserManagementScreen';

export const AppNavigator = () => {
  const { user, loading, isAuthenticated, isManager, isEmployee } = useAuth();

  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [claimToEdit, setClaimToEdit] = useState(null);

  // Set default tab based on role when user logs in
  useEffect(() => {
    if (user) {
      if (user.role === 'ROLE_MANAGER') {
        setCurrentTab('manager-dashboard');
      } else {
        setCurrentTab('employee-dashboard');
      }
    }
  }, [user?.role]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Not authenticated: Show Login or Register
  if (!isAuthenticated) {
    if (authView === 'register') {
      return <RegisterScreen onNavigateLogin={() => setAuthView('login')} />;
    }
    return <LoginScreen onNavigateRegister={() => setAuthView('register')} />;
  }

  // Navigation handlers
  const handleSelectTab = (tab) => {
    setSelectedClaimId(null);
    setClaimToEdit(null);
    setCurrentTab(tab);
  };

  const handleSelectClaim = (id) => {
    setSelectedClaimId(id);
    setCurrentTab('claim-detail');
  };

  const handleEditClaim = (claim) => {
    setClaimToEdit(claim);
    setCurrentTab('edit-claim');
  };

  // Requirement 14: Route Guard check
  const renderScreen = () => {
    // Claim Detail screen
    if (currentTab === 'claim-detail' && selectedClaimId) {
      return (
        <ClaimDetailScreen
          claimId={selectedClaimId}
          onBack={() => {
            setSelectedClaimId(null);
            setCurrentTab(isManager ? 'all-claims' : 'my-claims');
          }}
          onEdit={(claim) => handleEditClaim(claim)}
        />
      );
    }

    // Manager Route Guards
    if (['manager-dashboard', 'all-claims', 'users'].includes(currentTab)) {
      if (!isManager) {
        return (
          <AccessDeniedScreen
            onNavigateHome={() => setCurrentTab('employee-dashboard')}
          />
        );
      }

      if (currentTab === 'manager-dashboard') {
        return (
          <ManagerDashboardScreen
            onNavigateAllClaims={() => setCurrentTab('all-claims')}
            onNavigateUsers={() => setCurrentTab('users')}
          />
        );
      }
      if (currentTab === 'all-claims') {
        return <AllClaimsScreen onSelectClaim={handleSelectClaim} />;
      }
      if (currentTab === 'users') {
        return <UserManagementScreen />;
      }
    }

    // Employee Route Guards
    if (['employee-dashboard', 'my-claims', 'create-claim', 'edit-claim'].includes(currentTab)) {
      if (!isEmployee) {
        return (
          <AccessDeniedScreen
            onNavigateHome={() => setCurrentTab('manager-dashboard')}
          />
        );
      }

      if (currentTab === 'employee-dashboard') {
        return (
          <EmployeeDashboardScreen
            onNavigateCreateClaim={() => setCurrentTab('create-claim')}
            onNavigateClaims={() => setCurrentTab('my-claims')}
            onSelectClaim={handleSelectClaim}
          />
        );
      }
      if (currentTab === 'my-claims') {
        return (
          <MyClaimsScreen
            onSelectClaim={handleSelectClaim}
            onEditClaim={handleEditClaim}
            onNavigateCreateClaim={() => setCurrentTab('create-claim')}
          />
        );
      }
      if (currentTab === 'create-claim') {
        return (
          <CreateEditClaimScreen
            onDone={() => setCurrentTab('my-claims')}
            onCancel={() => setCurrentTab('my-claims')}
          />
        );
      }
      if (currentTab === 'edit-claim') {
        return (
          <CreateEditClaimScreen
            claimToEdit={claimToEdit}
            onDone={() => {
              setClaimToEdit(null);
              setCurrentTab('my-claims');
            }}
            onCancel={() => {
              setClaimToEdit(null);
              setCurrentTab('my-claims');
            }}
          />
        );
      }
    }

    // Fallback to default dashboard
    return isManager ? (
      <ManagerDashboardScreen
        onNavigateAllClaims={() => setCurrentTab('all-claims')}
        onNavigateUsers={() => setCurrentTab('users')}
      />
    ) : (
      <EmployeeDashboardScreen
        onNavigateCreateClaim={() => setCurrentTab('create-claim')}
        onNavigateClaims={() => setCurrentTab('my-claims')}
        onSelectClaim={handleSelectClaim}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Navbar activeTab={currentTab} onSelectTab={handleSelectTab} />
      <View style={styles.body}>{renderScreen()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  body: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});
