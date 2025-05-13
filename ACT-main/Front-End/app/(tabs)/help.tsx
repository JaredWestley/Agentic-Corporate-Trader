import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, ScrollView, Platform } from 'react-native';
import { Collapsible } from '@/components/Collapsible'; 
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ParallaxScrollView from '@/components/ParallaxScrollView';

export default function Help() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={<Ionicons size={310} name="code-slash" style={styles.headerImage} />}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Help</ThemedText>
      </ThemedView>
      
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Collapsible title="1. How do I reset my password?">
          <ThemedText>
            To reset your password, follow these steps:
            {'\n'}- Click on the "Forgot Password" link on the login page.
            {'\n'}- Enter the email address associated with your account.
            {'\n'}- Check your email inbox for a password reset link.
            {'\n'}- Click the link and follow the instructions to create a new password.
          </ThemedText>
        </Collapsible>

        <Collapsible title="2. I didn’t receive the password reset email. What should I do?">
          <ThemedText>
            If you haven’t received the password reset email, try the following:
            {'\n'}- Check your spam/junk folder.
            {'\n'}- Ensure the email address is correct when requesting the reset.
            {'\n'}- Wait a few minutes and try again if the email is missing.
          </ThemedText>
        </Collapsible>

        <Collapsible title="3. What should I do if I don’t remember the email associated with my account?">
          <ThemedText>
            If you’ve forgotten the email address associated with your account, please contact our support team.
            Provide any information (e.g., username or transaction details) to help us verify your account.
          </ThemedText>
        </Collapsible>

        <Collapsible title="4. How long is the password reset link valid?">
          <ThemedText>
            The password reset link is valid for 24 hours. If you don’t use the link within that time, you’ll need to request another password reset.
          </ThemedText>
        </Collapsible>

        <Collapsible title="5. Can I reset my password if I no longer have access to my email?">
          <ThemedText>
            If you no longer have access to your email account, please contact our support team for assistance in recovering your account.
          </ThemedText>
        </Collapsible>
      </ScrollView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
});
