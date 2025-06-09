import { useState } from 'react';
import { Modal, TextInput, PasswordInput, Button, Stack, Text, Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';

interface LoginModalProps {
  opened: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export function LoginModal({ opened, onClose, onLoginSuccess }: LoginModalProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      setEmail('');
      setPassword('');
      onClose();
      onLoginSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <Modal 
      opened={opened} 
      onClose={handleClose}
      title="Login to Save Your Songs"
      centered
      size="sm"
    >
      <Stack gap="md">
        <Alert 
          icon={<IconInfoCircle size={16} />} 
          color="blue" 
          variant="light"
        >
          <Text size="sm">
            Login to save your songs permanently in the cloud. 
            Your songs will be accessible from any device.
          </Text>
        </Alert>

        {error && (
          <Alert color="red" variant="light">
            <Text size="sm">{error}</Text>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />

            <Button 
              type="submit" 
              fullWidth 
              loading={isSubmitting}
              disabled={!email || !password}
            >
              Login
            </Button>
          </Stack>
        </form>

        <Text size="xs" c="dimmed" ta="center">
          Don't have an account? Contact the administrator for access.
        </Text>
      </Stack>
    </Modal>
  );
}