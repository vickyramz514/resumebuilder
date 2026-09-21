import { GoogleLogin } from '@react-oauth/google';
import { Button } from '@mui/material';

const clientId = import.meta.env.GOOGLE_CLIENT_ID ?? '';

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => Promise<void>;
  disabled?: boolean;
  onError?: (message: string) => void;
}

export default function GoogleSignInButton({ onCredential, disabled = false, onError }: GoogleSignInButtonProps) {
  if (!clientId) {
    return <Button type="button" variant="outlined" fullWidth disabled>Google (configure GOOGLE_CLIENT_ID)</Button>;
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', pointerEvents: disabled ? 'none' : undefined, opacity: disabled ? 0.5 : 1 }}>
      <GoogleLogin
        onSuccess={(response) => {
          if (!response.credential) {
            onError?.('No credential received from Google');
            return;
          }
          void onCredential(response.credential);
        }}
        onError={() => onError?.('Google sign-in was cancelled or failed')}
        useOneTap={false}
        theme="outline"
        size="large"
        text="continue_with"
        shape="rectangular"
        width={320}
      />
    </div>
  );
}
