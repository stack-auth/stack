import { useRouter } from "next/navigation";
import { useStackApp } from "..";
import MessageCard from "./MessageCard";

export default function RedirectMessageCard({ 
  type,
  fullPage=false,
}: { 
  type: 'signedIn' | 'signedOut' | 'emailSent' | 'passwordReset' | 'emailVerified',
  fullPage?: boolean, 
}) {
  const stackApp = useStackApp();
  const router = useRouter();

  let title: string;
  let url: string;
  let message: string | null = null;
  let buttonText: string;
  switch (type) {
    case 'signedIn': {
      title = "You are already signed in";
      message = 'You are already signed in. You can click the buttont below to sign out if you want to sign in with a different account.';
      url = stackApp.urls.signOut;
      buttonText = "Sign Out";
      break;
    }
    case 'signedOut': {
      title = "You are already signed out";
      url = stackApp.urls.home;
      buttonText = "Go to Home";
      break;
    }
    case 'emailSent': {
      title = "Email Sent";
      message = 'Please check your inbox. If you do not receive the email, please check your spam folder.';
      url = stackApp.urls.home;
      buttonText = "Go to Home";
      break;
    }
    case 'passwordReset': {
      title = "Password Reset";
      message = 'Your password has been reset. You can now sign in with your new password.';
      url = stackApp.urls.signIn;
      buttonText = "Go to Sign In";
      break;
    }
    case 'emailVerified': {
      title = "Email Verified";
      message = 'Your have successfully verified your email';
      url = stackApp.urls.signIn;
      buttonText = "Go to Home";
      break;
    }
  }

  return (
    <MessageCard title={title} fullPage={fullPage}>
      {message && <p className='wl_mb-8'>{message}</p>}
      <button
        className='wl_btn wl_btn-primary'
        onClick={() => router.push(url.toString())}
      >
        {buttonText}
      </button>
    </MessageCard>
  );
}
