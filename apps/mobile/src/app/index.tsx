import { Redirect } from 'expo-router';

export default function Index() {
    // Redirects the root URL '/' to your login screen
    return <Redirect href="/(auth)/login" />;
}