import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleSubNotification(sub, nextBillingDateFn, formatMoneyFn) {
  await cancelSubNotification(sub.id);

  const payAt = nextBillingDateFn(sub.billingDay);
  const notifyAt = new Date(payAt);
  notifyAt.setDate(notifyAt.getDate() - sub.notifyDaysBefore);
  notifyAt.setHours(9, 0, 0, 0);

  if (notifyAt <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: `sub_${sub.id}`,
    content: {
      title: 'Przypomnienie o płatności 💳',
      body: `${sub.name} — ${formatMoneyFn(sub.amount, sub.currency)} (za ${sub.notifyDaysBefore} dni)`,
      sound: true,
    },
    trigger: { type: 'date', date: notifyAt },
  });
}

export async function cancelSubNotification(subId) {
  try {
    await Notifications.cancelScheduledNotificationAsync(`sub_${subId}`);
  } catch {}
}
