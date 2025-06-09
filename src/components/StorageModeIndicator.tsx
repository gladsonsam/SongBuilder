import { useState, useEffect } from 'react';
import { Group, Badge, Button, Text, Alert, Modal, Stack } from '@mantine/core';
import { IconCloud, IconDeviceFloppy, IconLogin, IconLogout, IconAlertTriangle, IconArrowUp } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { useStorage } from '../context/StorageContext';
import { StorageMode } from '../utils/storageInterface';
import { LoginModal } from './LoginModal';

export function StorageModeIndicator() {
  const { isAuthenticated, logout, user } = useAuth();
  const { storageMode, hasLocalData, migrateLocalToCloud } = useStorage();
  const [loginModalOpened, setLoginModalOpened] = useState(false);
  const [migrationModalOpened, setMigrationModalOpened] = useState(false);
  const [, setLocalDataExists] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  // Check for local data when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      checkLocalData();
    }
  }, [isAuthenticated]);

  const checkLocalData = async () => {
    try {
      const hasData = await hasLocalData();
      setLocalDataExists(hasData);
      if (hasData) {
        setMigrationModalOpened(true);
      }
    } catch (error) {
      console.error('Failed to check local data:', error);
    }
  };

  const handleMigration = async () => {
    setIsMigrating(true);
    try {
      await migrateLocalToCloud();
      setLocalDataExists(false);
      setMigrationModalOpened(false);
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isCloudMode = storageMode === StorageMode.CLOUD;

  return (
    <>
      <Stack gap="sm">
        {/* Storage Mode Badge */}
        <Badge
          color={isCloudMode ? 'blue' : 'orange'}
          variant="light"
          leftSection={isCloudMode ? <IconCloud size={14} /> : <IconDeviceFloppy size={14} />}
          fullWidth
          size="lg"
        >
          {isCloudMode ? 'Cloud Storage' : 'Local Storage'}
        </Badge>

        {/* Authentication Section */}
        {isAuthenticated ? (
          <Stack gap="xs">
            <Text size="xs" c="dimmed" ta="center">
              Logged in as
            </Text>
            <Text size="sm" fw={500} ta="center" truncate>
              {user?.email}
            </Text>
            <Button
              size="xs"
              variant="subtle"
              leftSection={<IconLogout size={14} />}
              onClick={handleLogout}
              fullWidth
            >
              Logout
            </Button>
          </Stack>
        ) : (
          <Stack gap="xs">
            <Button
              size="sm"
              variant="default"
              leftSection={<IconLogin size={16} />}
              onClick={() => setLoginModalOpened(true)}
              fullWidth
            >
              Login
            </Button>
            <Text size="xs" c="dimmed" ta="center">
              Login for cloud storage
            </Text>
          </Stack>
        )}

        {/* Warning for Local Mode */}
        {!isCloudMode && (
          <Alert
            color="orange"
            variant="light"
            icon={<IconAlertTriangle size={14} />}
            style={{ fontSize: '11px', padding: '8px' }}
          >
            <Text size="xs">
              Songs saved locally - will be lost if you clear browser data
            </Text>
          </Alert>
        )}
      </Stack>

      <LoginModal
        opened={loginModalOpened}
        onClose={() => setLoginModalOpened(false)}
        onLoginSuccess={() => {
          setLoginModalOpened(false);
          checkLocalData();
        }}
      />

      <Modal
        opened={migrationModalOpened}
        onClose={() => setMigrationModalOpened(false)}
        title="Migrate Local Songs?"
        centered
        closeOnClickOutside={false}
        closeOnEscape={false}
      >
        <Stack gap="md">
          <Alert
            icon={<IconArrowUp size={16} />}
            color="blue"
            variant="light"
          >
            <Text size="sm">
              You have songs saved locally from when you weren't logged in. 
              Would you like to migrate them to cloud storage?
            </Text>
          </Alert>

          <Text size="sm" c="dimmed">
            This will copy your local songs to the cloud and then remove them from local storage.
            Your songs will then be accessible from any device.
          </Text>

          <Group justify="flex-end" gap="sm">
            <Button
              variant="subtle"
              color="gray"
              onClick={() => setMigrationModalOpened(false)}
              disabled={isMigrating}
            >
              Skip for Now
            </Button>
            <Button
              leftSection={<IconArrowUp size={16} />}
              onClick={handleMigration}
              loading={isMigrating}
            >
              Migrate to Cloud
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}